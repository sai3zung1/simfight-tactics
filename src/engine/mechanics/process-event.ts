import type { CombatEvent } from "../loop/combat-event";
import type { CombatState } from "../loop/combat-state";
import type { EventQueue } from "../loop/event-queue";
import type { StopSignal } from "../loop/stop-signal";
import { processAutoAttack } from "./auto-attack";
import { processCast, processManaRegen } from "./casting";
import { processCrowdControlExpiry } from "./crowd-control";
import { processModifierExpiry } from "./timed-modifiers";
import { EMPTY_SPELL_REGISTRY, type SpellRegistry } from "../spell/contract";

/**
 * Build `runLoop`'s `process` for one run: a closure over this run's
 * queue and state, so `process` keeps the narrow shape `runLoop` expects
 * while still reaching the mutable state it needs. The switch is the
 * single point routing an event kind to its mechanic — a new kind is a
 * compile break here, never a silent skip. Mortality is not plumbed
 * through here: each combatant carries its own `canDie`, applied where
 * damage lands.
 */
export function createProcess(
  queue: EventQueue,
  state: CombatState,
  registry: SpellRegistry = EMPTY_SPELL_REGISTRY,
): (event: CombatEvent) => StopSignal | undefined {
  return (event) => {
    switch (event.kind) {
      case "auto-attack":
        return processAutoAttack(event, state, queue);
      case "mana-regen":
        processManaRegen(event, state, queue);
        return undefined;
      case "cast":
        return processCast(event, state, queue, registry);
      case "crowd-control-expiry":
        processCrowdControlExpiry(event, state, queue);
        return undefined;
      case "modifier-expiry":
        processModifierExpiry(event, state);
        return undefined;
      default: {
        const _exhaustive: never = event;
        return _exhaustive;
      }
    }
  };
}
