import type { CombatState } from "../loop/combat-state";
import type { EventQueue } from "../loop/event-queue";
import type { StopSignal } from "../loop/stop-signal";
import { NEVER_EXPIRES, secondsToTicks, type Ticks } from "../loop/time";
import { ensureManaRegenScheduled } from "../mechanics/casting";
import { applyCrowdControl } from "../mechanics/crowd-control";
import { applyShield } from "../mechanics/shield";
import { applyTimedModifier } from "../mechanics/timed-modifiers";
import { applyHeal, type Combatant } from "../stats/combatant";
import {
  resolveSpellMagnitude,
  type EffectiveStats,
} from "../stats/effective-stats";
import type { Magnitude, Temporality } from "../../domain/catalog/modifier";
import { schedulePeriodicTicks } from "../mechanics/periodic-ticks";
import { deliverDamage, starCollapsed } from "./deliver";
import type { SpellEffect } from "./contract";

// The result is banked as a flat amount, with no sources left: a later fold
// cannot re-scale it, so a buff arriving after the cast changes nothing.
function snapshotAmount(
  amount: Magnitude,
  casterStats: EffectiveStats,
): number {
  return resolveSpellMagnitude(
    starCollapsed(amount.base),
    amount.sources,
    casterStats,
  );
}

function durationTicksOf(temporality: Temporality): Ticks {
  switch (temporality.kind) {
    // "instant" means permanent for the run here, not resolved-on-the-spot —
    // that second reading only holds for damage and heal.
    case "instant":
      return NEVER_EXPIRES;
    case "duration":
      return secondsToTicks(starCollapsed(temporality.seconds));
    case "periodic":
      throw new Error(
        "a periodic temporality is routed to tick scheduling before delivery",
      );
    default: {
      const _exhaustive: never = temporality;
      return _exhaustive;
    }
  }
}

export function applyEffects(
  effects: readonly SpellEffect[],
  caster: Combatant,
  opponent: Combatant,
  state: CombatState,
  queue: EventQueue,
  time: Ticks,
): StopSignal | undefined {
  for (const { recipient, modifier } of effects) {
    const target = recipient === "self" ? caster : opponent;
    if (modifier.temporality.kind === "periodic") {
      schedulePeriodicTicks(modifier, caster, target, time, queue);
      continue;
    }
    switch (modifier.kind) {
      case "damage": {
        if (modifier.temporality.kind !== "instant") {
          throw new Error(
            "spell damage is instant; damage over time is periodic (mechanics/periodic-ticks.ts)",
          );
        }
        const signal = deliverDamage(
          {
            amount: resolveSpellMagnitude(
              starCollapsed(modifier.amount.base),
              modifier.amount.sources,
              caster.stats,
            ),
            damageType: modifier.damageType,
          },
          caster,
          target,
          state,
          queue,
          time,
        );
        if (signal !== undefined) {
          return signal;
        }
        break;
      }
      case "crowd-control": {
        if (modifier.temporality.kind !== "duration") {
          throw new Error(
            "a crowd-control effect carries a duration; instant has no meaning (modifier.ts)",
          );
        }
        applyCrowdControl(
          target,
          modifier.cc,
          time,
          secondsToTicks(starCollapsed(modifier.temporality.seconds)),
          queue,
        );
        break;
      }
      case "stat-mod": {
        applyTimedModifier(
          target,
          {
            ...modifier,
            amount: { base: snapshotAmount(modifier.amount, caster.stats) },
          },
          time,
          durationTicksOf(modifier.temporality),
          queue,
        );
        break;
      }
      case "heal": {
        if (modifier.temporality.kind !== "instant") {
          throw new Error(
            "spell healing is instant; healing over time is periodic (mechanics/periodic-ticks.ts)",
          );
        }
        applyHeal(target, snapshotAmount(modifier.amount, caster.stats));
        break;
      }
      case "shield": {
        applyShield(
          target,
          snapshotAmount(modifier.amount, caster.stats),
          time,
          durationTicksOf(modifier.temporality),
          queue,
        );
        break;
      }
      case "damage-reduction": {
        applyTimedModifier(
          target,
          {
            ...modifier,
            amount: { base: snapshotAmount(modifier.amount, caster.stats) },
          },
          time,
          durationTicksOf(modifier.temporality),
          queue,
        );
        break;
      }
      case "mana-generation": {
        applyTimedModifier(
          target,
          {
            ...modifier,
            amount: { base: snapshotAmount(modifier.amount, caster.stats) },
          },
          time,
          durationTicksOf(modifier.temporality),
          queue,
        );
        ensureManaRegenScheduled(target, time, queue);
        break;
      }
      default: {
        const _exhaustive: never = modifier;
        return _exhaustive;
      }
    }
  }
  return undefined;
}
