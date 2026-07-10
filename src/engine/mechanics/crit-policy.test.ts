import { test, expect, describe } from "bun:test";
import { expectedCrit, neverCrit, alwaysCrit } from "./crit-policy";

const CRIT_CHANCE = 0.25;
const CRIT_DAMAGE = 0.4;

describe("nominal values", () => {
  test("expectedCrit = 1 + chance × damage", () => {
    expect(expectedCrit(CRIT_CHANCE, CRIT_DAMAGE)).toBeCloseTo(1.1);
  });

  test("neverCrit = 1 (no crit applied)", () => {
    expect(neverCrit(CRIT_CHANCE, CRIT_DAMAGE)).toBe(1);
  });

  test("alwaysCrit = 1 + damage (crit always applied)", () => {
    expect(alwaysCrit(CRIT_CHANCE, CRIT_DAMAGE)).toBeCloseTo(1.4);
  });
});

describe("edge cases — expectedCrit collapses to the bounds", () => {
  const DAMAGE = 0.75;

  test("chance 0 → expectedCrit equals neverCrit", () => {
    expect(expectedCrit(0, DAMAGE)).toBe(neverCrit(0, DAMAGE));
  });

  test("chance 1 → expectedCrit equals alwaysCrit", () => {
    expect(expectedCrit(1, DAMAGE)).toBe(alwaysCrit(1, DAMAGE));
  });
});

describe("guardrail — neverCrit ≤ expectedCrit ≤ alwaysCrit", () => {
  // Domain corners + middle. Deterministic and reproducible (no Math.random).
  const cases: ReadonlyArray<readonly [chance: number, damage: number]> = [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
    [0.5, 0.5],
    [0.25, 0.4],
    [1, 2],
  ];

  test.each(cases)("holds for chance=%p damage=%p", (chance, damage) => {
    const low = neverCrit(chance, damage);
    const mid = expectedCrit(chance, damage);
    const high = alwaysCrit(chance, damage);

    expect(low).toBeLessThanOrEqual(mid);
    expect(mid).toBeLessThanOrEqual(high);
  });
});
