import type { Combatant } from "./combatant";

/**
 * The full runtime state of one simulation: both combatants plus counters
 * that measure the run itself (D3) — not a property of either combatant.
 * `totalDamageDealt` accumulates as the run plays out; #47 is unidirectional
 * (the target never deals damage), so there is no taken-side counter yet.
 */
export type CombatState = {
  readonly attacker: Combatant;
  readonly target: Combatant;
  totalDamageDealt: number;
};
