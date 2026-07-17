import { NEVER_EXPIRES } from "../loop/time";
import type { Combatant } from "../stats/combatant";

/**
 * The shield side of combat: a spell's cast grants a consumable pool that
 * absorbs damage ahead of HP (`applyDamage` draws it down, stats/combatant.ts).
 * A pool never folds into the stat sheet — it is HP-adjacent, not a stat — so it
 * lives here, apart from the modifier fold (#71, D6/D7).
 *
 * S5 grants permanent-for-combat pools only; timed pools and their expiry event
 * land in D7.
 */

/**
 * Apply a shield of `amount` to `combatant` as a fresh, permanent-for-combat
 * pool (`NEVER_EXPIRES`). Additive and independent — each cast pushes its own
 * pool, never merging into an existing one, so several shields coexist and their
 * remainders sum (#71, D6). The real producer is a cast resolving
 * (engine/spell/apply-effects.ts), a mid-loop occurrence.
 */
export function applyShield(combatant: Combatant, amount: number): void {
  combatant.shields.push({ remaining: amount, expiresAt: NEVER_EXPIRES });
}
