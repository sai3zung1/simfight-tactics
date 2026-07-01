import type { CombatEvent } from "./combat-event";
import type { CombatState } from "./combat-state";
import type { Combatant } from "./combatant";
import type { CombatantId } from "./combatant-id";
import type { EventQueue } from "./event-queue";
import type { StopSignal } from "./stop-signal";
import { resolveDamage } from "./resolve-damage";
import { expected } from "./crit-policy";
import { secondsToTicks, type Ticks } from "./time";

/** Interval between two auto-attacks, from attacks-per-second to ticks. */
export function attackInterval(attackSpeed: number): Ticks {
  return secondsToTicks(1 / attackSpeed);
}

/** A non-positive attack speed means the unit never auto-attacks (D6). */
export function shouldAutoAttack(attacker: Combatant): boolean {
  return attacker.stats.attackSpeed > 0;
}

/** #47 only ever has these two combatants — no lookup miss is possible. */
function combatantById(state: CombatState, id: CombatantId): Combatant {
  return id === state.attacker.id ? state.attacker : state.target;
}

/**
 * Resolve one auto-attack: damage the target, tally it, then either signal a
 * kill (when lethal hits are allowed to end the run) or reprogram the next
 * attack. Order matters (D6): damage first, kill check second, reprogram
 * last — a lethal hit never gets a follow-up scheduled.
 */
function processAutoAttack(
  event: CombatEvent,
  state: CombatState,
  queue: EventQueue,
  lethal: boolean,
): StopSignal | undefined {
  const attacker = combatantById(state, event.attacker);
  const target = combatantById(state, event.target);

  const dealt = resolveDamage(
    { amount: attacker.stats.attackDamage, damageType: "physical" },
    { damageAmp: attacker.stats.damageAmp },
    { armor: target.stats.armor, magicResist: target.stats.magicResist },
    expected(attacker.stats.critChance, attacker.stats.critDamage),
  );

  target.currentHp -= dealt;
  state.totalDamageDealt += dealt;

  if (lethal && target.currentHp <= 0) {
    return { time: event.time };
  }

  queue.push({
    kind: "auto-attack",
    time: (event.time + attackInterval(attacker.stats.attackSpeed)) as Ticks,
    attacker: event.attacker,
    target: event.target,
  });
  return undefined;
}

/**
 * Build `runLoop`'s `process` for one run: a closure over this run's queue
 * and state, so `process` keeps the narrow `(event) => StopSignal | undefined`
 * shape `runLoop` expects while still reaching the mutable state it needs.
 * `lethal` comes from the stop condition (fixed_duration treats the target
 * as immortal) and is fixed for the whole run.
 */
export function createProcess(
  queue: EventQueue,
  state: CombatState,
  lethal: boolean,
): (event: CombatEvent) => StopSignal | undefined {
  return (event) => {
    switch (event.kind) {
      case "auto-attack":
        return processAutoAttack(event, state, queue, lethal);
      default: {
        const _exhaustive: never = event.kind;
        return _exhaustive;
      }
    }
  };
}
