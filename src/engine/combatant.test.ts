import { test, expect } from "bun:test";
import { resolveCombatant } from "./combatant";
import type { CombatantId } from "./combatant-id";
import type { BaseStats } from "../domain/catalog/base-stats";

const stats: BaseStats = {
  hp: { 1: 500, 2: 900, 3: 1600 },
  armor: 30,
  magicResist: 30,
  durability: 0,
  mana: { min: 0, start: 0, max: 100 },
  attackDamage: { 1: 50, 2: 90, 3: 160 },
  abilityPower: 0,
  attackSpeed: 0.7,
  critChance: 0.25,
  critDamage: 0.4,
  range: 1,
  damageAmp: 0,
};

test("starts at full resolved HP for its star level", () => {
  const combatant = resolveCombatant(stats, 3, "attacker" as CombatantId);
  expect(combatant.currentHp).toBe(1600);
  expect(combatant.stats.hp).toBe(1600);
});

test("carries the id it was given", () => {
  const combatant = resolveCombatant(stats, 1, "target" as CombatantId);
  expect(combatant.id).toBe("target" as CombatantId);
});
