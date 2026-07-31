import { test, expect } from "bun:test";
import { rally, FIXTURE_RALLY_PARAMETERS } from "./rally";
import { ctx } from "./test-context";

test("emits one flat, timed attack-damage buff on the caster itself", () => {
  expect(rally(ctx(), { bonusAttackDamage: 40, durationSeconds: 4 })).toEqual([
    {
      recipient: "self",
      modifier: {
        kind: "stat-mod",
        target: "attackDamage",
        amount: { base: 40 },
        temporality: { kind: "duration", seconds: 4 },
      },
    },
  ]);
});

test("the emitted amount is the star-collapsed parameter and carries no scaling source", () => {
  const [effect] = rally(ctx(), { bonusAttackDamage: 60, durationSeconds: 4 });
  expect(effect.modifier.kind).toBe("stat-mod");
  if (effect.modifier.kind === "stat-mod") {
    expect(effect.modifier.amount.base).toBe(60);
    expect(effect.modifier.amount.sources).toBeUndefined();
  }
});

test("the per-star card lives in the parameters, for setup to collapse", () => {
  expect(FIXTURE_RALLY_PARAMETERS).toEqual({
    bonusAttackDamage: { 1: 40, 2: 60, 3: 90 },
    durationSeconds: 4,
  });
});
