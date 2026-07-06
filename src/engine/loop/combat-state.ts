import type { Combatant } from "../stats/combatant";

/**
 * The full runtime state of one simulation: both combatants plus counters
 * that measure the run itself — a damage total belongs to the run, not to
 * either combatant. `totalDamageDealt` accumulates as the run plays out;
 * combat is still unidirectional (the target never deals damage), so there
 * is no taken-side counter yet.
 */
export type CombatState = {
  readonly attacker: Combatant;
  readonly target: Combatant;
  totalDamageDealt: number;
};
