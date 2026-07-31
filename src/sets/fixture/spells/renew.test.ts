import { test, expect } from "bun:test";
import { renew, FIXTURE_RENEW_PARAMETERS } from "./renew";
import { ctx } from "./test-context";

test("emits one flat periodic heal on the caster itself", () => {
  expect(
    renew(ctx(), { tickHeal: 70, windowSeconds: 3, intervalSeconds: 1 }),
  ).toEqual([
    {
      recipient: "self",
      modifier: {
        kind: "heal",
        amount: { base: 70 },
        temporality: {
          kind: "periodic",
          seconds: 3,
          interval: 1,
          mode: "instance",
        },
      },
    },
  ]);
});

test("the emitted amount is the star-collapsed parameter and carries no scaling source", () => {
  const [effect] = renew(ctx(), {
    tickHeal: 105,
    windowSeconds: 3,
    intervalSeconds: 1,
  });
  expect(effect.modifier.kind).toBe("heal");
  if (effect.modifier.kind === "heal") {
    expect(effect.modifier.amount.base).toBe(105);
    expect(effect.modifier.amount.sources).toBeUndefined();
  }
});

test("the per-star card lives in the parameters, for setup to collapse", () => {
  expect(FIXTURE_RENEW_PARAMETERS).toEqual({
    tickHeal: { 1: 70, 2: 105, 3: 160 },
    windowSeconds: 3,
    intervalSeconds: 1,
  });
});
