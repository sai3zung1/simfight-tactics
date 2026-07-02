import { test, expect } from "bun:test";
import { applyModifiers } from "./effective-stats";
import type { ResolvedStats } from "./resolved-stats";
import type {
  ModifiableStat,
  Modifier,
  StarValue,
} from "../domain/catalog/modifier";

const base: ResolvedStats = {
  hp: 1000,
  armor: 30,
  magicResist: 30,
  durability: 0,
  attackDamage: 100,
  attackSpeed: 0.8,
  critChance: 0.25,
  critDamage: 0.4,
  damageAmp: 0,
};

const statMod = (target: ModifiableStat, amount: StarValue): Modifier => ({
  kind: "stat-mod",
  target,
  amount: { base: amount },
  temporality: { kind: "instant" },
});

test("returns the base view untouched when no modifiers are active", () => {
  expect(applyModifiers(base, [], 2)).toEqual(base);
});

test("folds a flat stat-mod into its target stat only", () => {
  expect(applyModifiers(base, [statMod("attackDamage", 50)], 1)).toEqual({
    ...base,
    attackDamage: 150,
  });
});

test("never mutates the base view", () => {
  applyModifiers(base, [statMod("attackDamage", 50)], 1);
  expect(base.attackDamage).toBe(100);
});

test("accumulates several stat-mods on the same stat", () => {
  const view = applyModifiers(
    base,
    [statMod("armor", 20), statMod("armor", 15)],
    1,
  );
  expect(view.armor).toBe(65);
});

test("lands every stat the effective view carries", () => {
  const landings = [
    "hp",
    "armor",
    "magicResist",
    "durability",
    "attackDamage",
    "attackSpeed",
    "critChance",
    "critDamage",
    "damageAmp",
  ] as const;
  for (const target of landings) {
    const view = applyModifiers(base, [statMod(target, 10)], 1);
    expect(view[target]).toBe(base[target] + 10);
  }
});

test("resolves a per-star amount to the combatant's star level", () => {
  const perStar = statMod("attackDamage", { 1: 10, 2: 25, 3: 60 });
  expect(applyModifiers(base, [perStar], 2).attackDamage).toBe(125);
});

test("skips stats without an effective landing field", () => {
  const view = applyModifiers(
    base,
    [statMod("abilityPower", 40), statMod("range", 1)],
    1,
  );
  expect(view).toEqual(base);
});

test("leaves kinds owned by other pipelines untouched", () => {
  const otherKinds: readonly Modifier[] = [
    {
      kind: "damage",
      damageType: "magic",
      amount: { base: 100 },
      temporality: { kind: "instant" },
    },
    { kind: "heal", amount: { base: 100 }, temporality: { kind: "instant" } },
    {
      kind: "shield",
      amount: { base: 100 },
      temporality: { kind: "duration", seconds: 4 },
    },
    {
      kind: "crowd-control",
      cc: "stun",
      temporality: { kind: "duration", seconds: 1.5 },
    },
    {
      kind: "damage-reduction",
      amount: { base: 0.2 },
      temporality: { kind: "instant" },
    },
    {
      kind: "mana-generation",
      amount: { base: 10 },
      temporality: { kind: "instant" },
    },
  ];
  expect(applyModifiers(base, otherKinds, 1)).toEqual(base);
});
