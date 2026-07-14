import { test, expect } from "bun:test";
import { burst, FIXTURE_BURST_PARAMETERS } from "./burst";
import type { SpellContext } from "../../../engine/spell/contract";
import type { EffectiveStats } from "../../../engine/stats/effective-stats";

const stats: EffectiveStats = {
  hp: 1000,
  armor: 25,
  magicResist: 25,
  durability: 0,
  mana: { min: 0, start: 0, max: 100 },
  manaGeneration: { perAttack: 7, perSecond: 2, gainsFromDamageTaken: false },
  attackDamage: 55,
  abilityPower: 1,
  attackSpeed: 0.85,
  critChance: 0.25,
  critDamage: 0.4,
  damageAmp: 0,
};

const ctx = (): SpellContext => ({
  caster: { stats, hp: { current: 1000, max: 1000 } },
  opponent: { stats, hp: { current: 1000, max: 1000 } },
});

test("emits exactly one instant magic hit on the opponent, base scaled by ability power", () => {
  expect(burst(ctx(), { baseDamage: 230 })).toEqual([
    {
      recipient: "opponent",
      modifier: {
        kind: "damage",
        damageType: "magic",
        amount: { base: 230, sources: ["abilityPower"] },
        temporality: { kind: "instant" },
      },
    },
  ]);
});

test("the emitted base is the star-collapsed parameter, never a per-star table", () => {
  const [effect] = burst(ctx(), { baseDamage: 345 });
  expect(effect.modifier.kind).toBe("damage");
  if (effect.modifier.kind === "damage") {
    expect(effect.modifier.amount.base).toBe(345);
  }
});

test("the per-star card lives in the parameters, for setup to collapse", () => {
  expect(FIXTURE_BURST_PARAMETERS).toEqual({
    baseDamage: { 1: 230, 2: 345, 3: 520 },
  });
});
