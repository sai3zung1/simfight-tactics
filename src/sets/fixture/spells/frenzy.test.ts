import { test, expect } from "bun:test";
import { frenzy, FIXTURE_FRENZY_PARAMETERS } from "./frenzy";
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

test("emits one accrual periodic attack-speed ramp on the caster itself", () => {
  expect(
    frenzy(ctx(), {
      tickAttackSpeed: 0.06,
      windowSeconds: 5,
      intervalSeconds: 1,
    }),
  ).toEqual([
    {
      recipient: "self",
      modifier: {
        kind: "stat-mod",
        target: "attackSpeed",
        amount: { base: 0.06 },
        temporality: {
          kind: "periodic",
          seconds: 5,
          interval: 1,
          mode: "accrual",
        },
      },
    },
  ]);
});

test("the emitted amount is the star-collapsed parameter and carries no scaling source", () => {
  const [effect] = frenzy(ctx(), {
    tickAttackSpeed: 0.09,
    windowSeconds: 5,
    intervalSeconds: 1,
  });
  expect(effect.modifier.kind).toBe("stat-mod");
  if (effect.modifier.kind === "stat-mod") {
    expect(effect.modifier.amount.base).toBe(0.09);
    expect(effect.modifier.amount.sources).toBeUndefined();
  }
});

test("the per-star card lives in the parameters, for setup to collapse", () => {
  expect(FIXTURE_FRENZY_PARAMETERS).toEqual({
    tickAttackSpeed: { 1: 0.06, 2: 0.09, 3: 0.14 },
    windowSeconds: 5,
    intervalSeconds: 1,
  });
});
