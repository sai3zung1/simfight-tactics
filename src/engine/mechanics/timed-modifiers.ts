import type { Modifier } from "../../domain/catalog/modifier";
import type { ModifierExpiryEvent } from "../loop/combat-event";
import type { CombatState } from "../loop/combat-state";
import { combatantById } from "../loop/combat-state";
import type { EventQueue } from "../loop/event-queue";
import { refoldStats, type Combatant } from "../stats/combatant";
import { addTicks, type Ticks } from "../loop/time";

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

export function processModifierExpiry(
  event: ModifierExpiryEvent,
  state: CombatState,
): void {
  const combatant = combatantById(state, event.combatant);
  if (removeExpired(combatant, event.time)) {
    refoldStats(combatant);
  }
}
