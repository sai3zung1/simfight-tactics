import type { ShieldExpiryEvent } from "../loop/combat-event";
import type { CombatState } from "../loop/combat-state";
import { combatantById } from "../loop/combat-state";
import type { EventQueue } from "../loop/event-queue";
import { addTicks, type Ticks } from "../loop/time";
import type { Combatant } from "../stats/combatant";

/**
 * The shield side of combat: a spell's cast grants a consumable pool that
 * absorbs damage ahead of HP (`applyDamage` draws it down, stats/combatant.ts).
 * A pool never folds into the stat sheet — it is HP-adjacent, not a stat — so it
 * lives here, apart from the modifier fold, with its own expiry event (#71,
 * D6/D7).
 */

/**
 * Apply a shield of `amount` to `combatant` for `durationTicks` from `now`: push
 * a fresh pool and, unless it is permanent-for-combat (`NEVER_EXPIRES`),
 * schedule its expiry. Additive and independent — each cast pushes its own pool,
 * never merging into an existing one, so several shields coexist and their
 * remainders sum (#71, D6). The real producers are a cast resolving
 * (engine/spell/apply-effects.ts) and a periodic residue tick
 * (periodic-ticks.ts), both mid-loop occurrences.
 */
export function applyShield(
  combatant: Combatant,
  amount: number,
  now: Ticks,
  durationTicks: Ticks,
  queue: EventQueue,
): void {
  const expiresAt = addTicks(now, durationTicks);
  combatant.shields.push({ remaining: amount, expiresAt });
  if (Number.isFinite(expiresAt)) {
    queue.push({
      kind: "shield-expiry",
      time: expiresAt,
      combatant: combatant.id,
    });
  }
}

/**
 * Resolve one shield expiry: drop every pool whose window has closed
 * (`expiresAt <= now`), mutating the list in place — the same backward-splice as
 * the timed-modifier prune. No refold: a shield is HP-adjacent, not a stat, so
 * its expiry changes no fold (#71, D7). A pool still holding charge when its
 * window closes simply fades, its remainder lost. When several pools share an
 * `expiresAt`, both events fire on the same tick: the first prunes all the due
 * pools, the second finds nothing.
 */
export function processShieldExpiry(
  event: ShieldExpiryEvent,
  state: CombatState,
): void {
  const pools = combatantById(state, event.combatant).shields;
  for (let i = pools.length - 1; i >= 0; i--) {
    if (pools[i].expiresAt <= event.time) {
      pools.splice(i, 1);
    }
  }
}
