import { test, expect } from "bun:test";
import { mend, FIXTURE_MEND_PARAMETERS } from "./mend";
import { ctx } from "./test-context";

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
