import { test, expect } from "bun:test";
import { resolveStats } from "./resolved-stats";
import type { BaseStats } from "../../domain/catalog/base-stats";

const stats: BaseStats = {
  hp: { 1: 500, 2: 900, 3: 1600 },
  armor: 30,
  magicResist: 30,
  durability: 0.15,
  mana: { min: 0, start: 0, max: 100 },
  manaGeneration: { perAttack: 0, perSecond: 0, gainsFromDamageTaken: false },
  attackDamage: { 1: 50, 2: 90, 3: 160 },
  abilityPower: 1,
  attackSpeed: 0.7,
  critChance: 0.25,
  critDamage: 0.4,
  range: 1,
  damageAmp: 0,
};

test("resolves the per-star fields to the chosen star level", () => {
  expect(resolveStats(stats, 2)).toEqual({
    hp: 900,
    armor: 30,
    magicResist: 30,
    durability: 0.15,
    mana: { min: 0, start: 0, max: 100 },
    manaGeneration: { perAttack: 0, perSecond: 0, gainsFromDamageTaken: false },
    attackDamage: 90,
    abilityPower: 1,
    attackSpeed: 0.7,
    critChance: 0.25,
    critDamage: 0.4,
    damageAmp: 0,
  });
});

test("passes flat fields through unchanged regardless of star level", () => {
  expect(resolveStats(stats, 1).armor).toBe(30);
  expect(resolveStats(stats, 3).armor).toBe(30);
});
