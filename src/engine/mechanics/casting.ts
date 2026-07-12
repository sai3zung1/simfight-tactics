import type { CastEvent, ManaRegenEvent } from "../loop/combat-event";
import type { CombatState } from "../loop/combat-state";
import { combatantById } from "../loop/combat-state";
import type { Combatant } from "../stats/combatant";
import type { EventQueue } from "../loop/event-queue";
import { addTicks, secondsToTicks, type Ticks } from "../loop/time";
import { gainMana, readyToCast, regenManaGain, hasManaBar } from "./mana";

/**
 * The casting side of the mana pipeline: emit a cast when a gauge is full,
 * spend the gauge when the cast resolves, and drive the steady per-second
 * generation. A cast is the trigger only — the spell's effects come with
 * spell modeling.
 */

/**
 * Seconds between two ticks of steady generation. Measured: the live game
 * pays per-second values in discrete one-second steps, the first one
 * interval in (docs/data/calibration-log.md, B1).
 */
export const MANA_REGEN_INTERVAL_SECONDS = 1;

/** A combatant joins the regen schedule only if ticking can ever pay out. */
export function shouldScheduleManaRegen(combatant: Combatant): boolean {
  return hasManaBar(combatant) && regenManaGain(combatant) > 0;
}

/**
 * Emit the cast as its own event, on the same tick as the gain that
 * filled the gauge — the queue's arrival order resolves it right after,
 * so a cast stays a first-class, ordered occurrence (ADR 0002).
 */
export function pushCastIfReady(
  combatant: Combatant,
  time: Ticks,
  queue: EventQueue,
): void {
  if (readyToCast(combatant)) {
    queue.push({ kind: "cast", time, caster: combatant.id });
  }
}

/**
 * Steady generation: pay out one interval's worth, maybe emit a cast,
 * reschedule the next tick — the same recurring pattern as the
 * auto-attack.
 */
export function processManaRegen(
  event: ManaRegenEvent,
  state: CombatState,
  queue: EventQueue,
): void {
  const combatant = combatantById(state, event.combatant);
  gainMana(combatant, regenManaGain(combatant));
  pushCastIfReady(combatant, event.time, queue);
  queue.push({
    kind: "mana-regen",
    time: addTicks(event.time, secondsToTicks(MANA_REGEN_INTERVAL_SECONDS)),
    combatant: event.combatant,
  });
}

/**
 * Resolve one cast: count it and spend the gauge. The gauge restarts at
 * the post-cast modifier sum — zero without items: measured, the excess
 * above the threshold is lost and there is no floor
 * (docs/data/calibration-log.md, A1).
 *
 * A cast event whose gauge is no longer full is dropped: two same-tick
 * gains can each emit a cast, and the first to resolve spends the bar.
 */
export function processCast(event: CastEvent, state: CombatState): void {
  const caster = combatantById(state, event.caster);
  if (!readyToCast(caster)) {
    return;
  }
  state.castsBy[event.caster]++;
  caster.currentMana = caster.manaGains["post-cast"];
}
