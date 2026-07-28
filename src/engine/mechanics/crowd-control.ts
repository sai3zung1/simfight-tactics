import type { CrowdControl } from "../../domain/catalog/modifier";
import type { CrowdControlExpiryEvent } from "../loop/combat-event";
import type { CombatState } from "../loop/combat-state";
import { combatantById } from "../loop/combat-state";
import type { EventQueue } from "../loop/event-queue";
import { addTicks, ONE_TICK, type Ticks } from "../loop/time";
import { blocksAttack, canAttack, type Combatant } from "../stats/combatant";
import { shouldAutoAttack } from "./auto-attack";
import { pushCastIfReady } from "./casting";

export function applyCrowdControl(
  combatant: Combatant,
  cc: CrowdControl,
  now: Ticks,
  durationTicks: Ticks,
  queue: EventQueue,
): void {
  const blockedThrough = addTicks(now, durationTicks);
  combatant.activeCrowdControl.push({ cc, blockedThrough });

  if (blocksAttack(cc)) {
    queue.cancel(
      (event) =>
        event.kind === "auto-attack" && event.attacker === combatant.id,
    );
  }

  queue.push({
    kind: "crowd-control-expiry",
    time: addTicks(blockedThrough, ONE_TICK),
    combatant: combatant.id,
    cc,
  });
}

export function processCrowdControlExpiry(
  event: CrowdControlExpiryEvent,
  state: CombatState,
  queue: EventQueue,
): void {
  const combatant = combatantById(state, event.combatant);
  pushCastIfReady(combatant, event.time, queue);

  if (
    !blocksAttack(event.cc) ||
    !canAttack(combatant, event.time) ||
    !shouldAutoAttack(combatant) ||
    queue.has((e) => e.kind === "auto-attack" && e.attacker === combatant.id)
  ) {
    return;
  }

  const opponent =
    combatant.id === state.attacker.id ? state.target : state.attacker;
  queue.push({
    kind: "auto-attack",
    time: event.time,
    attacker: combatant.id,
    target: opponent.id,
  });
}
