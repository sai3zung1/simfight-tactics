import { test, expect } from "bun:test";
import {
  hasManaBar,
  gainMana,
  attackManaGain,
  damageTakenManaGain,
  regenManaGain,
  readyToCast,
} from "./mana";
import { NO_SPELL_ID } from "../spell/contract";
import type { Combatant } from "../stats/combatant";
import type { CombatantId } from "../stats/combatant-id";
import type { ResolvedStats } from "../stats/resolved-stats";
import type { ManaGains } from "../stats/effective-stats";

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
  damageReductions: [],
  activeCrowdControl: [],
  spellId: NO_SPELL_ID,
  spellParameters: {},
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

// The two tests below pin the adopted damage-taken coefficients and cap
// (docs/data/calibration-log.md, C2) — a drift here is a calibration break,
// not a refactor.
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
  gainMana(c, 40);
  expect(c.currentMana).toBe(40);
  expect(readyToCast(c)).toBe(false);
  gainMana(c, 60);
  expect(readyToCast(c)).toBe(true);
});

test("a unit with no mana bar accumulates nothing", () => {
  const c = makeCombatant({ mana: { min: 0, start: 0, max: 0 } });
  gainMana(c, 50);
  expect(c.currentMana).toBe(0);
  expect(readyToCast(c)).toBe(false);
});
