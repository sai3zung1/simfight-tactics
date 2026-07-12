import type { CrowdControl } from "../../domain/catalog/modifier";
import type { CrowdControlExpiryEvent } from "../loop/combat-event";
import type { CombatState } from "../loop/combat-state";
import { combatantById } from "../loop/combat-state";
import type { EventQueue } from "../loop/event-queue";
import { addTicks, ONE_TICK, type Ticks } from "../loop/time";
import { blocksAttack, canAttack, type Combatant } from "../stats/combatant";
import { shouldAutoAttack } from "./auto-attack";
import { pushCastIfReady } from "./casting";

/**
 * Land a crowd-control effect on `combatant`, starting at `now` for
 * `durationTicks`. The only real producer will be a spell's cast resolving
 * (#68, not built yet) — a cast is a mid-loop occurrence, so this can never
 * run from the combat-start fold (`resolveCombatant`); this ticket's own
 * tests call it directly (#50, D1/D4).
 *
 * If the effect takes away the attack, any auto-attack this combatant
 * already has pending is cancelled outright — left to fire, it would do
 * nothing anyway, but cancelling keeps the timeline honest (#50, D3).
 */
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

/**
 * Resolve one crowd-control effect ending. The cast recheck always runs —
 * `pushCastIfReady` already no-ops on its own if something else still blocks
 * it or the gauge isn't full (and if two effects both leave the gauge ready
 * on the same tick, `processCast`'s own already-spent guard drops the
 * second cast — no extra bookkeeping needed here).
 *
 * The attack only restarts if this specific effect was the one blocking it
 * (silence expiring must never touch a chain it never stopped), the
 * combatant still attacks at all, and nothing has already re-armed it this
 * tick — two attack-blocking effects can expire together, and only one of
 * them should push the fresh swing (#50).
 */
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
