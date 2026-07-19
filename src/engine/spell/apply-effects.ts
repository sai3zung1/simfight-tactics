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

/**
 * Snapshot a spell modifier's magnitude against the caster's effective stats,
 * once, at cast time (D4). The returned number is banked into the timed entry
 * as a flat amount, so the later fold reads the caster's value — never the
 * recipient's: a debuff scaled on the caster's stats keeps the caster's basis
 * even folded into the victim, and an ability-power buff banks the item-moved
 * AP the caster held when it cast. Mirrors how spell damage already resolves
 * (same `resolveSpellMagnitude`), so every spell-emitted amount shares one rule.
 */
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

/**
 * How long a spell-emitted timed effect lives, in ticks. An instant temporality
 * means permanent-for-combat — the `NEVER_EXPIRES` sentinel, no scheduled expiry
 * (D2); a duration collapses its star-safe seconds to ticks. Periodic never
 * reaches here: cast delivery routes it to tick scheduling before any kind
 * resolves, so hitting that arm is an engine bug — loud, not silently
 * skipped. Shared by every timed kit (stat-mod, damage-reduction,
 * mana-generation, shield).
 */
function durationTicksOf(temporality: Temporality): Ticks {
  switch (temporality.kind) {
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

/**
 * Deliver a cast's produced effects to combat state, in the order the spell
 * returned them. Damage rides the same pipeline as an auto-attack — resolve,
 * land on HP, tally, then the exchange's mana — held in `deliverDamage`
 * (deliver.ts) with the crit factor pinned at `neverCrit`: a spell never
 * crits by default, the capability is item-granted (#13). A killing effect
 * returns its stop signal immediately: nothing after a run's end is
 * observable, later effects included. The exhaustive switch makes a new
 * `Modifier` kind a compile break here, never a silent skip.
 *
 * `casting.ts` and this module depend on each other — a cast delivers
 * effects, a delivered hit can push the victim's response cast. Safe by
 * construction: each side only calls the other at run time, never while
 * modules load.
 */
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
    // Periodic is orthogonal to kind: any periodic effect expands into
    // scheduled ticks (mechanics/periodic-ticks.ts) instead of resolving now.
    // One routing point, so the kind switch below only ever sees instant and
    // duration temporalities.
    if (modifier.temporality.kind === "periodic") {
      schedulePeriodicTicks(modifier, caster, target, time, queue);
      continue;
    }
    switch (modifier.kind) {
      case "damage": {
        // Damage resolves now or not at all: over-time damage is periodic —
        // routed to scheduling above — so a duration means nothing, and
        // reaching here with one is a spell-author bug, never a silent skip.
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
        // Only a duration is meaningful for crowd control (modifier.ts);
        // periodic is rejected at scheduling, so instant is the remaining
        // author bug caught here.
        if (modifier.temporality.kind !== "duration") {
          throw new Error(
            "a crowd-control effect carries a duration; instant and periodic have no meaning (modifier.ts)",
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
        // A stat-mod folds into the recipient's stats via #70's timed machinery.
        // An instant one is a permanent-for-combat buff riding a `NEVER_EXPIRES`
        // window, so nothing schedules its expiry and the fold carries it for the
        // whole run (D2). A mod on `hp` moves max HP, and refoldStats reconciles
        // current HP with it — a rise grants the HP, an expiry clamps under the
        // new max (D3). The amount is snapshotted against the caster now (D4) and
        // banked flat, so the fold reads the caster's basis, not the recipient's.
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
        // A heal lands on HP now, capped at the recipient's effective max
        // (`applyHeal`). Instant only: healing over time is periodic — routed
        // to scheduling above — so a duration reaching here is a spell-author
        // bug, never a silent skip. The amount is snapshotted against the
        // caster (D4), the same rule as damage and stat-mods.
        if (modifier.temporality.kind !== "instant") {
          throw new Error(
            "spell healing is instant; healing over time is periodic (mechanics/periodic-ticks.ts)",
          );
        }
        applyHeal(target, snapshotAmount(modifier.amount, caster.stats));
        break;
      }
      case "shield": {
        // A shield is a consumable pool absorbing damage ahead of HP
        // (mechanics/shield.ts). An instant temporality is a permanent-for-combat
        // pool (`NEVER_EXPIRES`, no scheduled expiry); a duration schedules its
        // own shield-expiry (D7). The amount is snapshotted against the caster
        // (D4).
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
        // A damage-reduction rides the timed machinery into its own lane,
        // recomputed by refoldStats like the stat fold (D1). Instant is
        // permanent-for-combat. Snapshotted against the caster (D4).
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
        // A mana-generation bonus rides the timed machinery into its trigger
        // bucket, recomputed by refoldStats like the stat fold (D1). Snapshotted
        // against the caster (D4). A per-second gain appearing mid-run also has
        // to start the recipient's regen chain if it wasn't ticking — the fold
        // alone pays nothing without the recurring event (D1).
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
