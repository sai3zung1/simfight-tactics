import { test, expect } from "bun:test";
import {
  hasManaBar,
  isManaLocked,
  gainMana,
  attackManaGain,
  damageTakenManaGain,
  regenManaGain,
  readyToCast,
} from "./mana";
import type { Combatant } from "../stats/combatant";
import type { CombatantId } from "../stats/combatant-id";
import type { ResolvedStats } from "../stats/resolved-stats";
import type { ManaGains } from "../stats/effective-stats";
import type { Ticks } from "../loop/time";

const NO_GAINS: ManaGains = {
  "on-attack": 0,
  "per-second": 0,
  "post-cast": 0,
  "on-damage-taken": 0,
};

const makeCombatant = (
  stats: Partial<ResolvedStats> = {},
  overrides: Partial<Combatant> = {},
): Combatant => ({
  id: "attacker" as CombatantId,
  canDie: true,
  currentHp: 1000,
  currentMana: 0,
  manaLockedUntil: 0 as Ticks,
  damageReductions: [],
  manaGains: NO_GAINS,
  stats: {
    hp: 1000,
    armor: 0,
    magicResist: 0,
    durability: 0,
    mana: { min: 0, start: 0, max: 100 },
    manaGeneration: {
      perAttack: 10,
      perSecond: 0,
      gainsFromDamageTaken: false,
    },
    attackDamage: 100,
    attackSpeed: 1,
    critChance: 0,
    critDamage: 0,
    damageAmp: 0,
    ...stats,
  },
  ...overrides,
});

test("a unit with no mana bar never casts", () => {
  const noBar = makeCombatant({ mana: { min: 0, start: 0, max: 0 } });
  expect(hasManaBar(noBar)).toBe(false);
  expect(hasManaBar(makeCombatant())).toBe(true);
});

test("attack gain sums the role value and on-attack bonuses", () => {
  const c = makeCombatant({}, { manaGains: { ...NO_GAINS, "on-attack": 5 } });
  expect(attackManaGain(c)).toBe(15);
});

test("damage-taken gain is zero for roles without it, whatever the hit", () => {
  expect(damageTakenManaGain(makeCombatant(), 200, 100)).toBe(0);
});

test("damage-taken gain applies the formula for eligible roles", () => {
  const tank = makeCombatant({
    manaGeneration: { perAttack: 5, perSecond: 0, gainsFromDamageTaken: true },
  });
  // 1% × 200 + 3% × 100
  expect(damageTakenManaGain(tank, 200, 100)).toBeCloseTo(5);
});

test("damage-taken gain caps per instance", () => {
  const tank = makeCombatant({
    manaGeneration: { perAttack: 5, perSecond: 0, gainsFromDamageTaken: true },
  });
  expect(damageTakenManaGain(tank, 100000, 50000)).toBe(42.5);
});

test("on-damage-taken bonuses apply to any holder", () => {
  const c = makeCombatant(
    {},
    { manaGains: { ...NO_GAINS, "on-damage-taken": 3 } },
  );
  expect(damageTakenManaGain(c, 200, 100)).toBe(3);
});

test("regen gain sums the role flow and per-second bonuses", () => {
  const caster = makeCombatant(
    {
      manaGeneration: {
        perAttack: 7,
        perSecond: 2,
        gainsFromDamageTaken: false,
      },
    },
    { manaGains: { ...NO_GAINS, "per-second": 1 } },
  );
  expect(regenManaGain(caster)).toBe(3);
});

test("gains land on the gauge until the threshold is crossed", () => {
  const c = makeCombatant();
  gainMana(c, 40, 0 as Ticks);
  expect(c.currentMana).toBe(40);
  expect(readyToCast(c)).toBe(false);
  gainMana(c, 60, 100 as Ticks);
  expect(readyToCast(c)).toBe(true);
});

test("the post-cast lock blocks every gain, then reopens", () => {
  const c = makeCombatant({}, { manaLockedUntil: 1000 as Ticks });
  gainMana(c, 10, 999 as Ticks);
  expect(c.currentMana).toBe(0);
  gainMana(c, 10, 1000 as Ticks);
  expect(c.currentMana).toBe(10);
});

test("the lock is open exactly at the unlock tick", () => {
  const c = makeCombatant({}, { manaLockedUntil: 1000 as Ticks });
  expect(isManaLocked(c, 999 as Ticks)).toBe(true);
  expect(isManaLocked(c, 1000 as Ticks)).toBe(false);
});

test("a unit with no mana bar accumulates nothing", () => {
  const c = makeCombatant({ mana: { min: 0, start: 0, max: 0 } });
  gainMana(c, 50, 0 as Ticks);
  expect(c.currentMana).toBe(0);
  expect(readyToCast(c)).toBe(false);
});
