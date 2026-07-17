import { test, expect } from "bun:test";
import { mend, FIXTURE_MEND_PARAMETERS } from "./mend";
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

test("emits one instant heal on the caster itself", () => {
  expect(mend(ctx(), { healAmount: 250 })).toEqual([
    {
      recipient: "self",
      modifier: {
        kind: "heal",
        amount: { base: 250 },
        temporality: { kind: "instant" },
      },
    },
  ]);
});

test("the emitted amount is the star-collapsed parameter and carries no scaling source", () => {
  const [effect] = mend(ctx(), { healAmount: 375 });
  expect(effect.modifier.kind).toBe("heal");
  if (effect.modifier.kind === "heal") {
    expect(effect.modifier.amount.base).toBe(375);
    expect(effect.modifier.amount.sources).toBeUndefined();
  }
});

test("the per-star card lives in the parameters, for setup to collapse", () => {
  expect(FIXTURE_MEND_PARAMETERS).toEqual({
    healAmount: { 1: 250, 2: 375, 3: 560 },
  });
});
