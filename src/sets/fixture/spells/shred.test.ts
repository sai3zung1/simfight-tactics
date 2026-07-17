import { test, expect } from "bun:test";
import { shred, FIXTURE_SHRED_PARAMETERS } from "./shred";
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

test("emits one flat, timed armor debuff on the opponent, as a negative amount", () => {
  expect(shred(ctx(), { armorShred: 20, durationSeconds: 4 })).toEqual([
    {
      recipient: "opponent",
      modifier: {
        kind: "stat-mod",
        target: "armor",
        amount: { base: -20 },
        temporality: { kind: "duration", seconds: 4 },
      },
    },
  ]);
});

test("the emitted amount is the negated star-collapsed parameter, no scaling source", () => {
  const [effect] = shred(ctx(), { armorShred: 30, durationSeconds: 4 });
  expect(effect.modifier.kind).toBe("stat-mod");
  if (effect.modifier.kind === "stat-mod") {
    expect(effect.modifier.amount.base).toBe(-30);
    expect(effect.modifier.amount.sources).toBeUndefined();
  }
});

test("the per-star card lives in the parameters, for setup to collapse", () => {
  expect(FIXTURE_SHRED_PARAMETERS).toEqual({
    armorShred: { 1: 20, 2: 30, 3: 45 },
    durationSeconds: 4,
  });
});
