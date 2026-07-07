import type { Combatant } from "../stats/combatant";
import type { CombatantId } from "../stats/combatant-id";

/**
 * The full runtime state of one simulation: both combatants plus counters
 * that measure the run itself — a damage total or a cast count belongs to
 * the run, not to either combatant. Combat is still unidirectional (the
 * target never deals damage), so there is no taken-side damage counter
 * yet.
 */
export type CombatState = {
  readonly attacker: Combatant;
  readonly target: Combatant;
  totalDamageDealt: number;
  attackerCasts: number;
  targetCasts: number;
};

/** A run holds exactly two combatants, so an id always resolves — no miss branch. */
export function combatantById(state: CombatState, id: CombatantId): Combatant {
  return id === state.attacker.id ? state.attacker : state.target;
}
