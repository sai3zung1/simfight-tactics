import type { CombatEvent } from "../loop/combat-event";
import type { CombatState } from "../loop/combat-state";
import type { EventQueue } from "../loop/event-queue";
import type { StopSignal } from "../loop/stop-signal";
import { processAutoAttack } from "./auto-attack";
import { processCast, processManaRegen } from "./casting";
import { processCrowdControlExpiry } from "./crowd-control";
import { processPeriodicTick } from "./periodic-ticks";
import { processShieldExpiry } from "./shield";
import { processModifierExpiry } from "./timed-modifiers";
import { EMPTY_SPELL_REGISTRY, type SpellRegistry } from "../spell/contract";

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
      case "shield-expiry":
        processShieldExpiry(event, state);
        return undefined;
      case "periodic-tick":
        return processPeriodicTick(event, state, queue);
      default: {
        const _exhaustive: never = event;
        return _exhaustive;
      }
    }
  };
}
