import type { Modifier } from "../../domain/catalog/modifier";
import type { ModifierExpiryEvent } from "../loop/combat-event";
import type { CombatState } from "../loop/combat-state";
import { combatantById } from "../loop/combat-state";
import type { EventQueue } from "../loop/event-queue";
import { refoldStats, type Combatant } from "../stats/combatant";
import { addTicks, type Ticks } from "../loop/time";

/**
 * Apply a timed modifier to `combatant` for `durationTicks`, starting at `now`:
 * record it, refold so `stats` carries it at once, and schedule its expiry. The
 * window is half-open — the entry expires at `now + durationTicks`, the tick its
 * `modifier-expiry` fires and prunes it (D6). Stacking is additive and
 * independent: a second application pushes a second entry with its own expiry,
 * never refreshing or replacing the first (D5). The only real producer is a
 * cast resolving (engine/spell/apply-effects.ts), a mid-loop occurrence — this
 * never runs from the combat-start fold, exactly as `applyCrowdControl`.
 *
 * A permanent-for-combat entry (`durationTicks` = `NEVER_EXPIRES`) schedules no
 * expiry: its window never closes, so the fold carries it for the whole run
 * (#71, D2). Every other duration schedules its `modifier-expiry` as before.
 */
export function applyTimedModifier(
  combatant: Combatant,
  modifier: Modifier,
  now: Ticks,
  durationTicks: Ticks,
  queue: EventQueue,
): void {
  const expiresAt = addTicks(now, durationTicks);
  combatant.timedModifiers.push({ modifier, expiresAt });
  refoldStats(combatant);
  if (Number.isFinite(expiresAt)) {
    queue.push({
      kind: "modifier-expiry",
      time: expiresAt,
      combatant: combatant.id,
    });
  }
}

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
