import type { ModifierExpiryEvent } from "../loop/combat-event";
import type { CombatState } from "../loop/combat-state";
import { combatantById } from "../loop/combat-state";
import { refoldStats, type Combatant } from "../stats/combatant";
import type { Ticks } from "../loop/time";

/**
 * Drop every timed modifier whose window has closed (`expiresAt <= now`),
 * mutating the list in place. Prunes by time, not by identity: several entries
 * can end on the same tick, so one pass settles them all — the same
 * backward-splice shape the queue uses to cancel events. Reports whether
 * anything was removed, so the caller only refolds when the set actually
 * changed.
 */
function removeExpired(combatant: Combatant, now: Ticks): boolean {
  const entries = combatant.timedModifiers;
  let removed = false;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].expiresAt <= now) {
      entries.splice(i, 1);
      removed = true;
    }
  }
  return removed;
}

/**
 * Resolve one timed-modifier expiry: prune the entries whose window has closed,
 * then refold so `stats` no longer carries them. Pure prune + refold — unlike a
 * crowd-control expiry it re-arms nothing, since a timed modifier gates no
 * action, only the fold (#70). When two entries share an `expiresAt`, both
 * events fire on the same tick: the first prunes both, the second finds nothing
 * and skips the redundant refold.
 */
export function processModifierExpiry(
  event: ModifierExpiryEvent,
  state: CombatState,
): void {
  const combatant = combatantById(state, event.combatant);
  if (removeExpired(combatant, event.time)) {
    refoldStats(combatant);
  }
}
