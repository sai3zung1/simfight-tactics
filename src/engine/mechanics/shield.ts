import type { ShieldExpiryEvent } from "../loop/combat-event";
import type { CombatState } from "../loop/combat-state";
import { combatantById } from "../loop/combat-state";
import type { EventQueue } from "../loop/event-queue";
import { addTicks, type Ticks } from "../loop/time";
import type { Combatant } from "../stats/combatant";

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
