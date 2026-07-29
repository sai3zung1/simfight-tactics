import type { Magnitude, Modifier } from "../../domain/catalog/modifier";
import type { PeriodicTickEvent } from "../loop/combat-event";
import type { CombatState } from "../loop/combat-state";
import { combatantById } from "../loop/combat-state";
import type { EventQueue } from "../loop/event-queue";
import type { StopSignal } from "../loop/stop-signal";
import {
  NEVER_EXPIRES,
  addTicks,
  secondsToTicks,
  type Ticks,
} from "../loop/time";
import { deliverDamage, starCollapsed } from "../spell/deliver";
import { applyHeal, type Combatant } from "../stats/combatant";
import {
  resolveSpellMagnitude,
  type EffectiveStats,
} from "../stats/effective-stats";
import { ensureManaRegenScheduled } from "./casting";
import { applyShield } from "./shield";
import { applyTimedModifier } from "./timed-modifiers";

export function schedulePeriodicTicks(
  modifier: Modifier,
  source: Combatant,
  target: Combatant,
  now: Ticks,
  queue: EventQueue,
): void {
  if (modifier.temporality.kind !== "periodic") {
    throw new Error("only a periodic temporality expands into ticks");
  }
  if (modifier.kind === "crowd-control") {
    throw new Error(
      "a periodic crowd-control is inexpressible: no per-tick duration exists (modifier.ts); a real recurring-cc kit extends the taxonomy (#73)",
    );
  }
  const windowTicks = secondsToTicks(
    starCollapsed(modifier.temporality.seconds),
  );
  const intervalTicks = secondsToTicks(modifier.temporality.interval);
  if (intervalTicks <= 0) {
    throw new Error("a periodic interval must be a positive length of time");
  }
  const count = Math.floor(windowTicks / intervalTicks);
  if (count === 0) {
    throw new Error(
      "a periodic window shorter than its interval never ticks; the effect would be a silent no-op",
    );
  }
  // The increment comes first, so the opening tick lands one interval in and
  // never at the cast itself.
  let tickAt = now;
  for (let k = 0; k < count; k++) {
    tickAt = addTicks(tickAt, intervalTicks);
    queue.push({
      kind: "periodic-tick",
      time: tickAt,
      source: source.id,
      target: target.id,
      modifier,
    });
  }
}

function tickAmount(amount: Magnitude, sourceStats: EffectiveStats): number {
  return resolveSpellMagnitude(
    starCollapsed(amount.base),
    amount.sources,
    sourceStats,
  );
}

export function processPeriodicTick(
  event: PeriodicTickEvent,
  state: CombatState,
  queue: EventQueue,
): StopSignal | undefined {
  const source = combatantById(state, event.source);
  const target = combatantById(state, event.target);
  const modifier = event.modifier;
  const temporality = modifier.temporality;
  if (temporality.kind !== "periodic") {
    throw new Error(
      "a periodic tick carries a periodic modifier by construction (schedulePeriodicTicks)",
    );
  }
  // Only the kinds that leave a residue read this: damage and heal consume
  // their tick outright, so their declared mode has no effect.
  const residueTicks =
    temporality.mode === "accrual"
      ? NEVER_EXPIRES
      : secondsToTicks(temporality.interval);
  switch (modifier.kind) {
    case "damage":
      return deliverDamage(
        {
          amount: tickAmount(modifier.amount, source.stats),
          damageType: modifier.damageType,
        },
        source,
        target,
        state,
        queue,
        event.time,
      );
    case "heal":
      applyHeal(target, tickAmount(modifier.amount, source.stats));
      return undefined;
    case "stat-mod":
    case "damage-reduction":
      applyTimedModifier(
        target,
        {
          ...modifier,
          amount: { base: tickAmount(modifier.amount, source.stats) },
        },
        event.time,
        residueTicks,
        queue,
      );
      return undefined;
    case "mana-generation":
      applyTimedModifier(
        target,
        {
          ...modifier,
          amount: { base: tickAmount(modifier.amount, source.stats) },
        },
        event.time,
        residueTicks,
        queue,
      );
      ensureManaRegenScheduled(target, event.time, queue);
      return undefined;
    case "shield":
      applyShield(
        target,
        tickAmount(modifier.amount, source.stats),
        event.time,
        residueTicks,
        queue,
      );
      return undefined;
    case "crowd-control":
      throw new Error(
        "a periodic crowd-control never schedules (schedulePeriodicTicks rejects it)",
      );
    default: {
      const _exhaustive: never = modifier;
      return _exhaustive;
    }
  }
}
