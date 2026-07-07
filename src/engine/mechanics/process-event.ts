import type { CombatEvent } from "../loop/combat-event";
import type { CombatState } from "../loop/combat-state";
import type { EventQueue } from "../loop/event-queue";
import type { StopSignal } from "../loop/stop-signal";
import { processAutoAttack } from "./auto-attack";
import { processCast, processManaRegen } from "./casting";

/**
 * Build `runLoop`'s `process` for one run: a closure over this run's
 * queue and state, so `process` keeps the narrow shape `runLoop` expects
 * while still reaching the mutable state it needs. The switch is the
 * single point routing an event kind to its mechanic — a new kind is a
 * compile break here, never a silent skip. `lethal` comes from the stop
 * condition (fixed_duration treats the target as immortal) and is fixed
 * for the whole run.
 */
export function createProcess(
  queue: EventQueue,
  state: CombatState,
  lethal: boolean,
): (event: CombatEvent) => StopSignal | undefined {
  return (event) => {
    switch (event.kind) {
      case "auto-attack":
        return processAutoAttack(event, state, queue, lethal);
      case "mana-regen":
        processManaRegen(event, state, queue);
        return undefined;
      case "cast":
        processCast(event, state);
        return undefined;
      default: {
        const _exhaustive: never = event;
        return _exhaustive;
      }
    }
  };
}
