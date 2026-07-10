import type { Combatant } from "../stats/combatant";
import type { CombatantId } from "../stats/combatant-id";

/**
 * The full runtime state of one simulation: both combatants plus counters
 * that measure the run itself — a damage total or a cast count belongs to
 * the run, not to either combatant. Counters are keyed by `CombatantId`:
 * mechanics credit whoever acted and never know sides, so attribution
 * survives accrual; the attacker-centric reading (dealt vs taken) is
 * produced once, at the result boundary in `simulate`.
 */
export type CombatState = {
  readonly attacker: Combatant;
  readonly target: Combatant;
  /** Damage dealt by each combatant over the run. */
  readonly damageDealtBy: Record<CombatantId, number>;
  /** Casts resolved by each combatant over the run. */
  readonly castsBy: Record<CombatantId, number>;
};

/** A run holds exactly two combatants, so an id always resolves — no miss branch. */
export function combatantById(state: CombatState, id: CombatantId): Combatant {
  return id === state.attacker.id ? state.attacker : state.target;
}
