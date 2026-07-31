import { test, expect } from "bun:test";
import { sear, FIXTURE_SEAR_PARAMETERS } from "./sear";
import { ctx } from "./test-context";

test("emits one periodic magic burn on the opponent, base scaled by ability power", () => {
  expect(
    sear(ctx(), { tickDamage: 60, windowSeconds: 4, intervalSeconds: 1 }),
  ).toEqual([
    {
      recipient: "opponent",
      modifier: {
        kind: "damage",
        damageType: "magic",
        amount: { base: 60, sources: ["abilityPower"] },
        temporality: {
          kind: "periodic",
          seconds: 4,
          interval: 1,
          mode: "instance",
        },
      },
    },
  ]);
});

test("the emitted base is the star-collapsed parameter, never a per-star table", () => {
  const [effect] = sear(ctx(), {
    tickDamage: 90,
    windowSeconds: 4,
    intervalSeconds: 1,
  });
  expect(effect.modifier.kind).toBe("damage");
  if (effect.modifier.kind === "damage") {
    expect(effect.modifier.amount.base).toBe(90);
  }
});

test("the per-star card lives in the parameters, for setup to collapse", () => {
  expect(FIXTURE_SEAR_PARAMETERS).toEqual({
    tickDamage: { 1: 60, 2: 90, 3: 135 },
    windowSeconds: 4,
    intervalSeconds: 1,
  });
});
