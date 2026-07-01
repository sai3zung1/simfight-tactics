import { test, expect } from "bun:test";
import { attackInterval, shouldAutoAttack, createProcess } from "./auto-attack";
import { createEventQueue } from "./event-queue";
import type { Combatant } from "./combatant";
import type { ResolvedStats } from "./resolved-stats";
import type { CombatState } from "./combat-state";
import type { CombatantId } from "./combatant-id";
import type { CombatEvent } from "./combat-event";
import type { Ticks } from "./time";

const makeCombatant = (
  id: string,
  stats: Partial<ResolvedStats> = {},
  currentHp = 1000,
): Combatant => ({
  id: id as CombatantId,
  currentHp,
  stats: {
    hp: 1000,
    armor: 0,
    magicResist: 0,
    attackDamage: 100,
    attackSpeed: 1,
    critChance: 0,
    critDamage: 0,
    damageAmp: 0,
    ...stats,
  },
});

const autoAttack = (
  attacker: Combatant,
  target: Combatant,
  time: number,
): CombatEvent => ({
  kind: "auto-attack",
  time: time as Ticks,
  attacker: attacker.id,
  target: target.id,
});

test("attackInterval converts attacks-per-second to ticks", () => {
  expect(attackInterval(1)).toBe(1000 as Ticks);
  expect(attackInterval(2)).toBe(500 as Ticks);
});

test("shouldAutoAttack is false for zero or negative attack speed", () => {
  expect(shouldAutoAttack(makeCombatant("a", { attackSpeed: 0 }))).toBe(false);
  expect(shouldAutoAttack(makeCombatant("a", { attackSpeed: -1 }))).toBe(false);
  expect(shouldAutoAttack(makeCombatant("a", { attackSpeed: 1 }))).toBe(true);
});

test("deals damage, tallies it, and reprograms the next attack when the target survives", () => {
  const attacker = makeCombatant("attacker", {
    attackDamage: 100,
    critChance: 0,
  });
  const target = makeCombatant("target", {}, 1000);
  const state: CombatState = { attacker, target, totalDamageDealt: 0 };
  const queue = createEventQueue();
  const process = createProcess(queue, state, true);

  const signal = process(autoAttack(attacker, target, 0));

  expect(signal).toBeUndefined();
  expect(target.currentHp).toBeLessThan(1000);
  expect(state.totalDamageDealt).toBeGreaterThan(0);
  const next = queue.popNext();
  expect(next?.kind).toBe("auto-attack");
  expect(next?.time).toBe(1000 as Ticks);
});

test("signals a kill, with no follow-up scheduled, when the hit is lethal and allowed to stop the run", () => {
  const attacker = makeCombatant("attacker", { attackDamage: 9999 });
  const target = makeCombatant("target", {}, 10);
  const state: CombatState = { attacker, target, totalDamageDealt: 0 };
  const queue = createEventQueue();
  const process = createProcess(queue, state, true);

  const signal = process(autoAttack(attacker, target, 500));

  expect(signal).toEqual({ time: 500 as Ticks });
  expect(queue.popNext()).toBeUndefined();
});

test("still deals damage but never signals when lethal hits aren't allowed to stop the run", () => {
  const attacker = makeCombatant("attacker", { attackDamage: 9999 });
  const target = makeCombatant("target", {}, 10);
  const state: CombatState = { attacker, target, totalDamageDealt: 0 };
  const queue = createEventQueue();
  const process = createProcess(queue, state, false);

  const signal = process(autoAttack(attacker, target, 500));

  expect(signal).toBeUndefined();
  expect(target.currentHp).toBeLessThan(0);
  expect(queue.popNext()).not.toBeUndefined();
});
