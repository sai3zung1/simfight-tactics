import { test, expect } from "bun:test";
import { attackInterval, shouldAutoAttack } from "./auto-attack";
import { createProcess } from "./process-event";
import { createEventQueue } from "../loop/event-queue";
import type { Combatant } from "../stats/combatant";
import type { ResolvedStats } from "../stats/resolved-stats";
import type { CombatState } from "../loop/combat-state";
import type { CombatantId } from "../stats/combatant-id";
import type { CombatEvent } from "../loop/combat-event";
import type { Ticks } from "../loop/time";

const makeCombatant = (
  id: string,
  stats: Partial<ResolvedStats> = {},
  currentHp = 1000,
  canDie = true,
): Combatant => ({
  id: id as CombatantId,
  canDie,
  currentHp,
  currentMana: 0,
  damageReductions: [],
  manaGains: {
    "on-attack": 0,
    "per-second": 0,
    "post-cast": 0,
    "on-damage-taken": 0,
  },
  stats: {
    hp: 1000,
    armor: 0,
    magicResist: 0,
    durability: 0,
    mana: { min: 0, start: 0, max: 100 },
    manaGeneration: { perAttack: 0, perSecond: 0, gainsFromDamageTaken: false },
    attackDamage: 100,
    attackSpeed: 1,
    critChance: 0,
    critDamage: 0,
    damageAmp: 0,
    ...stats,
  },
});

const makeState = (attacker: Combatant, target: Combatant): CombatState => ({
  attacker,
  target,
  damageDealtBy: { [attacker.id]: 0, [target.id]: 0 },
  castsBy: { [attacker.id]: 0, [target.id]: 0 },
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
  const state = makeState(attacker, target);
  const queue = createEventQueue();
  const process = createProcess(queue, state);

  const signal = process(autoAttack(attacker, target, 0));

  expect(signal).toBeUndefined();
  expect(target.currentHp).toBeLessThan(1000);
  expect(state.damageDealtBy[attacker.id]).toBeGreaterThan(0);
  const next = queue.popNext();
  expect(next?.kind).toBe("auto-attack");
  expect(next?.time).toBe(1000 as Ticks);
});

test("signals a kill, with no follow-up scheduled, when the hit kills a mortal target", () => {
  const attacker = makeCombatant("attacker", { attackDamage: 9999 });
  const target = makeCombatant("target", {}, 10);
  const state = makeState(attacker, target);
  const queue = createEventQueue();
  const process = createProcess(queue, state);

  const signal = process(autoAttack(attacker, target, 500));

  expect(signal).toEqual({ time: 500 as Ticks });
  expect(queue.popNext()).toBeUndefined();
});

test("still deals damage but never signals when the target cannot die", () => {
  const attacker = makeCombatant("attacker", { attackDamage: 9999 });
  const target = makeCombatant("target", {}, 10, false);
  const state = makeState(attacker, target);
  const queue = createEventQueue();
  const process = createProcess(queue, state);

  const signal = process(autoAttack(attacker, target, 500));

  expect(signal).toBeUndefined();
  expect(state.damageDealtBy[attacker.id]).toBeGreaterThan(0);
  // Immortality floors the HP write instead of letting it cross death.
  expect(target.currentHp).toBe(1);
  expect(queue.popNext()).not.toBeUndefined();
});

test("a hit credits the swinger's tally, and only the swinger's", () => {
  const attacker = makeCombatant("attacker", {
    attackDamage: 100,
    critChance: 0,
  });
  const target = makeCombatant("target", {}, 1000);
  const state = makeState(attacker, target);
  const process = createProcess(createEventQueue(), state);

  process(autoAttack(attacker, target, 0));

  // No defenses, no crit: the credited amount is the full 100.
  expect(state.damageDealtBy[attacker.id]).toBe(100);
  expect(state.damageDealtBy[target.id]).toBe(0);
});

test("the attacker earns its per-attack mana on a surviving hit", () => {
  const attacker = makeCombatant("attacker", {
    manaGeneration: {
      perAttack: 10,
      perSecond: 0,
      gainsFromDamageTaken: false,
    },
  });
  const target = makeCombatant("target", {}, 1000);
  const state = makeState(attacker, target);
  const process = createProcess(createEventQueue(), state);

  process(autoAttack(attacker, target, 0));

  expect(attacker.currentMana).toBe(10);
});

test("an eligible target converts the hit into mana", () => {
  const attacker = makeCombatant("attacker", {
    attackDamage: 100,
    critChance: 0,
  });
  const target = makeCombatant("target", {
    manaGeneration: { perAttack: 5, perSecond: 0, gainsFromDamageTaken: true },
  });
  const state = makeState(attacker, target);
  const process = createProcess(createEventQueue(), state);

  process(autoAttack(attacker, target, 0));

  // No defenses: dealt = pre-mitigated = 100 -> 1% × 100 + 3% × 100
  expect(target.currentMana).toBeCloseTo(4);
});

test("a floored hit still grants full damage-taken mana", () => {
  const attacker = makeCombatant("attacker", {
    attackDamage: 100,
    critChance: 0,
  });
  const target = makeCombatant(
    "target",
    {
      manaGeneration: {
        perAttack: 5,
        perSecond: 0,
        gainsFromDamageTaken: true,
      },
    },
    1,
    false,
  );
  const state = makeState(attacker, target);
  const process = createProcess(createEventQueue(), state);

  process(autoAttack(attacker, target, 0));

  // The floor clamps the HP write, never the hit: the conversion reads the
  // hit's full resolved numbers. No defenses: 1% × 100 + 3% × 100.
  expect(target.currentMana).toBeCloseTo(4);
  expect(target.currentHp).toBe(1);
});

test("an ineligible target gains nothing from the same hit", () => {
  const attacker = makeCombatant("attacker", { attackDamage: 100 });
  const target = makeCombatant("target");
  const state = makeState(attacker, target);
  const process = createProcess(createEventQueue(), state);

  process(autoAttack(attacker, target, 0));

  expect(target.currentMana).toBe(0);
});

test("a gain that fills the gauge emits a cast event on the same tick", () => {
  const attacker = makeCombatant("attacker", {
    manaGeneration: {
      perAttack: 10,
      perSecond: 0,
      gainsFromDamageTaken: false,
    },
  });
  const target = makeCombatant("target", {}, 1000);
  attacker.currentMana = 95;
  const state = makeState(attacker, target);
  const queue = createEventQueue();
  const process = createProcess(queue, state);

  process(autoAttack(attacker, target, 500));

  const first = queue.popNext();
  expect(first?.kind).toBe("cast");
  expect(first?.time).toBe(500 as Ticks);
});

test("a lethal hit ends the run before any mana bookkeeping", () => {
  const attacker = makeCombatant("attacker", {
    attackDamage: 9999,
    manaGeneration: {
      perAttack: 10,
      perSecond: 0,
      gainsFromDamageTaken: false,
    },
  });
  const target = makeCombatant("target", {}, 10);
  const state = makeState(attacker, target);
  const process = createProcess(createEventQueue(), state);

  process(autoAttack(attacker, target, 0));

  expect(attacker.currentMana).toBe(0);
});
