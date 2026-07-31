import { test, expect } from "bun:test";
import { burst, FIXTURE_BURST_PARAMETERS } from "./burst";
import { ctx } from "./test-context";

test("emits exactly one instant magic hit on the opponent, base scaled by ability power", () => {
  expect(burst(ctx(), { baseDamage: 230 })).toEqual([
    {
      recipient: "opponent",
      modifier: {
        kind: "damage",
        damageType: "magic",
        amount: { base: 230, sources: ["abilityPower"] },
        temporality: { kind: "instant" },
      },
    },
  ]);
});

test("the emitted base is the star-collapsed parameter, never a per-star table", () => {
  const [effect] = burst(ctx(), { baseDamage: 345 });
  expect(effect.modifier.kind).toBe("damage");
  if (effect.modifier.kind === "damage") {
    expect(effect.modifier.amount.base).toBe(345);
  }
});

test("the per-star card lives in the parameters, for setup to collapse", () => {
  expect(FIXTURE_BURST_PARAMETERS).toEqual({
    baseDamage: { 1: 230, 2: 345, 3: 520 },
  });
});
