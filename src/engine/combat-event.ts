import type { Ticks } from "./time";
import type { CombatantId } from "./combatant-id";

/**
 * CombatEvent — one scheduled occurrence the loop orders and processes.
 *
 * A discriminated union on `kind`; `time` is repeated on every member since
 * the queue orders on it regardless of which kind fired. "auto-attack" is
 * the only kind so far; new kinds join this union, and every consumer that
 * switches on `kind` carries its own exhaustiveness guard.
 *
 * Ordering among same-tick events is the queue's concern (a sequence number),
 * not a field carried here.
 */
export type CombatEvent = {
  readonly kind: "auto-attack";
  readonly time: Ticks;
  readonly attacker: CombatantId;
  readonly target: CombatantId;
};
