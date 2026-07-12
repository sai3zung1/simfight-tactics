import type { AutoAttackEvent } from "../loop/combat-event";
import type { CombatState } from "../loop/combat-state";
import { combatantById } from "../loop/combat-state";
import { applyDamage, canAttack, type Combatant } from "../stats/combatant";
import type { EventQueue } from "../loop/event-queue";
import type { StopSignal } from "../loop/stop-signal";
import { resolveDamage } from "./resolve-damage";
import { expectedCrit } from "./crit-policy";
import { attackManaGain, damageTakenManaGain, gainMana } from "./mana";
import { pushCastIfReady } from "./casting";
import { addTicks, secondsToTicks, type Ticks } from "../loop/time";

/**
 * Interval between two auto-attacks, from attacks-per-second to ticks.
 * Assumes a positive attack speed: units that never attack are filtered by
 * `shouldAutoAttack` before anything gets scheduled, so the division cannot
 * misbehave here.
 */
export function attackInterval(attackSpeed: number): Ticks {
  return secondsToTicks(1 / attackSpeed);
}

/**
 * A non-positive attack speed encodes a unit that never auto-attacks: no
 * first event gets scheduled at all, and the interval math never divides
 * by zero.
 */
export function shouldAutoAttack(attacker: Combatant): boolean {
  return attacker.stats.attackSpeed > 0;
}

/**
 * Resolve one auto-attack: damage the target, tally it, then hand out the
 * mana the exchange generated and reprogram the next attack. Whether the
 * victim can die at all is its own `canDie`, applied by `applyDamage`
 * where the hit lands. Order matters: a killing hit returns before any
 * mana bookkeeping — nothing after the run's end is observable — and
 * never gets a follow-up scheduled.
 *
 * A gated attacker (stun, disarm) does nothing here, and — unlike a
 * survived hit — does not reprogram the next attack either: the chain
 * stops rather than loop through wasted ticks, restarted only when the
 * blocking effect expires (mechanics/crowd-control.ts, #50).
 */
export function processAutoAttack(
  event: AutoAttackEvent,
  state: CombatState,
  queue: EventQueue,
): StopSignal | undefined {
  const attacker = combatantById(state, event.attacker);
  const target = combatantById(state, event.target);

  if (!canAttack(attacker, event.time)) {
    return undefined;
  }

  const hit = resolveDamage(
    { amount: attacker.stats.attackDamage, damageType: "physical" },
    { damageAmp: attacker.stats.damageAmp },
    {
      armor: target.stats.armor,
      magicResist: target.stats.magicResist,
      durability: target.stats.durability,
      damageReductions: target.damageReductions,
    },
    expectedCrit(attacker.stats.critChance, attacker.stats.critDamage),
  );

  const killed = applyDamage(target, hit.dealt);
  state.damageDealtBy[event.attacker] += hit.dealt;

  if (killed) {
    return { time: event.time };
  }

  // The attacker earns its per-attack mana, the target converts the hit;
  // either gauge may fill — the cast then fires as its own same-tick event.
  gainMana(attacker, attackManaGain(attacker));
  gainMana(target, damageTakenManaGain(target, hit.preMitigated, hit.dealt));
  pushCastIfReady(attacker, event.time, queue);
  pushCastIfReady(target, event.time, queue);

  queue.push({
    kind: "auto-attack",
    time: addTicks(event.time, attackInterval(attacker.stats.attackSpeed)),
    attacker: event.attacker,
    target: event.target,
  });
  return undefined;
}
