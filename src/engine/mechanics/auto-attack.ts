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

export function attackInterval(attackSpeed: number): Ticks {
  return secondsToTicks(1 / attackSpeed);
}

export function shouldAutoAttack(attacker: Combatant): boolean {
  return attacker.stats.attackSpeed > 0;
}

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
