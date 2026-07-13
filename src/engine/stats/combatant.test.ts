import { test, expect } from "bun:test";
import { applyDamage, canAttack, canCast, resolveCombatant } from "./combatant";
import type { CombatantId } from "./combatant-id";
import type { BaseStats } from "../../domain/catalog/base-stats";
import type { SpellId } from "../../domain/primitives";
import type { Ticks } from "../loop/time";

const stats: BaseStats = {
  hp: { 1: 500, 2: 900, 3: 1600 },
  armor: 30,
  magicResist: 30,
  durability: 0,
  mana: { min: 0, start: 0, max: 100 },
  manaGeneration: { perAttack: 0, perSecond: 0, gainsFromDamageTaken: false },
  attackDamage: { 1: 50, 2: 90, 3: 160 },
  abilityPower: 0,
  attackSpeed: 0.7,
  critChance: 0.25,
  critDamage: 0.4,
  range: 1,
  damageAmp: 0,
};

test("starts at full resolved HP for its star level", () => {
  const combatant = resolveCombatant(
    stats,
    3,
    "attacker" as CombatantId,
    [],
    true,
  );
  expect(combatant.currentHp).toBe(1600);
  expect(combatant.stats.hp).toBe(1600);
});

test("starts at its starting mana", () => {
  const withStartMana: BaseStats = {
    ...stats,
    mana: { min: 0, start: 30, max: 100 },
  };
  const combatant = resolveCombatant(
    withStartMana,
    1,
    "attacker" as CombatantId,
    [],
    true,
  );
  expect(combatant.currentMana).toBe(30);
});

test("carries the id it was given", () => {
  const combatant = resolveCombatant(
    stats,
    1,
    "target" as CombatantId,
    [],
    true,
  );
  expect(combatant.id).toBe("target" as CombatantId);
});

test("folds applied stat-mods into the stats the loop will read", () => {
  const combatant = resolveCombatant(
    stats,
    1,
    "attacker" as CombatantId,
    [
      {
        kind: "stat-mod",
        target: "attackDamage",
        amount: { base: 30 },
        temporality: { kind: "instant" },
      },
    ],
    true,
  );
  expect(combatant.stats.attackDamage).toBe(80);
});

test("starts at full effective HP when a modifier raises max HP", () => {
  const combatant = resolveCombatant(
    stats,
    1,
    "attacker" as CombatantId,
    [
      {
        kind: "stat-mod",
        target: "hp",
        amount: { base: 200 },
        temporality: { kind: "instant" },
      },
    ],
    true,
  );
  expect(combatant.currentHp).toBe(700);
});

test("resolves mana-generation modifiers into per-trigger gains", () => {
  const combatant = resolveCombatant(
    stats,
    1,
    "attacker" as CombatantId,
    [
      {
        kind: "mana-generation",
        trigger: "on-attack",
        amount: { base: 5 },
        temporality: { kind: "instant" },
      },
    ],
    true,
  );
  expect(combatant.manaGains["on-attack"]).toBe(5);
  expect(combatant.manaGains["post-cast"]).toBe(0);
});

test("applyDamage lowers a mortal combatant's HP and reports the kill at zero", () => {
  const mortal = resolveCombatant(stats, 1, "target" as CombatantId, [], true);
  expect(applyDamage(mortal, 100)).toBe(false);
  expect(mortal.currentHp).toBe(400);
  expect(applyDamage(mortal, 400)).toBe(true);
  expect(mortal.currentHp).toBe(0);
});

test("applyDamage floors an immortal combatant at 1 and never reports a kill", () => {
  const immortal = resolveCombatant(
    stats,
    1,
    "attacker" as CombatantId,
    [],
    false,
  );
  expect(applyDamage(immortal, 9999)).toBe(false);
  expect(immortal.currentHp).toBe(1);
  // Already at the floor: hits keep landing without moving HP any further.
  expect(applyDamage(immortal, 9999)).toBe(false);
  expect(immortal.currentHp).toBe(1);
});

test("an empty crowd-control list never blocks anything", () => {
  const c = resolveCombatant(stats, 1, "attacker" as CombatantId, [], true);
  expect(canAttack(c, 0 as Ticks)).toBe(true);
  expect(canCast(c, 0 as Ticks)).toBe(true);
});

test("stun blocks both attack and cast", () => {
  const c = resolveCombatant(stats, 1, "attacker" as CombatantId, [], true);
  c.activeCrowdControl.push({ cc: "stun", blockedThrough: 3000 as Ticks });
  expect(canAttack(c, 1000 as Ticks)).toBe(false);
  expect(canCast(c, 1000 as Ticks)).toBe(false);
});

test("disarm blocks attack only", () => {
  const c = resolveCombatant(stats, 1, "attacker" as CombatantId, [], true);
  c.activeCrowdControl.push({ cc: "disarm", blockedThrough: 3000 as Ticks });
  expect(canAttack(c, 1000 as Ticks)).toBe(false);
  expect(canCast(c, 1000 as Ticks)).toBe(true);
});

test("silence blocks cast only", () => {
  const c = resolveCombatant(stats, 1, "attacker" as CombatantId, [], true);
  c.activeCrowdControl.push({ cc: "silence", blockedThrough: 3000 as Ticks });
  expect(canAttack(c, 1000 as Ticks)).toBe(true);
  expect(canCast(c, 1000 as Ticks)).toBe(false);
});

test("blocked through its last tick inclusive, free the very next one", () => {
  const c = resolveCombatant(stats, 1, "attacker" as CombatantId, [], true);
  c.activeCrowdControl.push({ cc: "stun", blockedThrough: 3000 as Ticks });
  expect(canAttack(c, 3000 as Ticks)).toBe(false);
  expect(canAttack(c, 3001 as Ticks)).toBe(true);
});

test("carries damage-reduction modifiers as their own lane, apart from durability", () => {
  const combatant = resolveCombatant(
    stats,
    1,
    "target" as CombatantId,
    [
      {
        kind: "stat-mod",
        target: "durability",
        amount: { base: 0.1 },
        temporality: { kind: "instant" },
      },
      {
        kind: "damage-reduction",
        amount: { base: 0.2 },
        temporality: { kind: "instant" },
      },
    ],
    true,
  );
  expect(combatant.stats.durability).toBeCloseTo(0.1);
  expect(combatant.damageReductions).toEqual([0.2]);
});

test("collapses per-star spell parameters to the caster's star level", () => {
  const combatant = resolveCombatant(
    stats,
    2,
    "attacker" as CombatantId,
    [],
    true,
    "test-spell" as SpellId,
    { baseDamage: { 1: 100, 2: 150, 3: 200 }, adRatio: 1.5 },
  );
  expect(combatant.spellId).toBe("test-spell" as SpellId);
  // Per-star value picked at the caster's star; flat value passes through.
  expect(combatant.spellParameters.baseDamage).toBe(150);
  expect(combatant.spellParameters.adRatio).toBe(1.5);
});
