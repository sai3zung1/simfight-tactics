import { test, expect } from "bun:test";
import { aegis, FIXTURE_AEGIS_PARAMETERS } from "./aegis";
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

test("emits one flat, timed shield on the caster itself", () => {
  expect(aegis(ctx(), { shieldAmount: 300, durationSeconds: 4 })).toEqual([
    {
      recipient: "self",
      modifier: {
        kind: "shield",
        amount: { base: 300 },
        temporality: { kind: "duration", seconds: 4 },
      },
    },
  ]);
});

test("the emitted amount is the star-collapsed parameter and carries no scaling source", () => {
  const [effect] = aegis(ctx(), { shieldAmount: 450, durationSeconds: 4 });
  expect(effect.modifier.kind).toBe("shield");
  if (effect.modifier.kind === "shield") {
    expect(effect.modifier.amount.base).toBe(450);
    expect(effect.modifier.amount.sources).toBeUndefined();
  }
});

test("the per-star card lives in the parameters, for setup to collapse", () => {
  expect(FIXTURE_AEGIS_PARAMETERS).toEqual({
    shieldAmount: { 1: 300, 2: 450, 3: 675 },
    durationSeconds: 4,
  });
});
