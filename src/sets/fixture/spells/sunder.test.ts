import { test, expect } from "bun:test";
import { sunder, FIXTURE_SUNDER_PARAMETERS } from "./sunder";
import { ctx } from "./test-context";

test("emits one flat, timed armor debuff on the opponent, as a negative amount", () => {
  expect(sunder(ctx(), { armorReduction: 20, durationSeconds: 4 })).toEqual([
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
  const [effect] = sunder(ctx(), { armorReduction: 30, durationSeconds: 4 });
  expect(effect.modifier.kind).toBe("stat-mod");
  if (effect.modifier.kind === "stat-mod") {
    expect(effect.modifier.amount.base).toBe(-30);
    expect(effect.modifier.amount.sources).toBeUndefined();
  }
});

test("the per-star card lives in the parameters, for setup to collapse", () => {
  expect(FIXTURE_SUNDER_PARAMETERS).toEqual({
    armorReduction: { 1: 20, 2: 30, 3: 45 },
    durationSeconds: 4,
  });
});
