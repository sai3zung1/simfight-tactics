import type { Combatant } from "../stats/combatant";
import type { CombatantId } from "../stats/combatant-id";

export type CombatState = {
  readonly attacker: Combatant;
  readonly target: Combatant;
  readonly damageDealtBy: Record<CombatantId, number>;
  readonly castsBy: Record<CombatantId, number>;
};

export function combatantById(state: CombatState, id: CombatantId): Combatant {
  return id === state.attacker.id ? state.attacker : state.target;
}
