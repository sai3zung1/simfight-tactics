import { test, expect } from "bun:test";
import { aegis, FIXTURE_AEGIS_PARAMETERS } from "./aegis";
import { ctx } from "./test-context";

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
