import { test, expect } from "bun:test";
import { frenzy, FIXTURE_FRENZY_PARAMETERS } from "./frenzy";
import { ctx } from "./test-context";

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
