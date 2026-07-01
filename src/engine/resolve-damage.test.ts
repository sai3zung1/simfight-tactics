import { test, expect, describe } from "bun:test";
import { resolveDamage, mitigationFactor, amplify } from "./resolve-damage";
import { expected, neverCrit, alwaysCrit } from "./crit-policy";

const CRIT_CHANCE = 0.25;
const CRIT_DAMAGE = 0.4;

describe("resolveDamage", () => {
  const hit = { amount: 100, damageType: "physical" } as const;
  const attacker = { damageAmp: 0.2 }; // amplification ×1.2
  const target = { armor: 50, magicResist: 0 }; // physical → 100/150 ≈ 0.667

  test("applies amplification, crit and mitigation", () => {
    // 100 × 1.2 × 1.10 × 0.667 ≈ 88
    expect(
      resolveDamage(hit, attacker, target, expected(CRIT_CHANCE, CRIT_DAMAGE)),
    ).toBeCloseTo(88);
  });

  test("no crit yields the lower damage", () => {
    // 100 × 1.2 × 1 × 0.667 ≈ 80
    expect(
      resolveDamage(hit, attacker, target, neverCrit(CRIT_CHANCE, CRIT_DAMAGE)),
    ).toBeCloseTo(80);
  });

  test("guaranteed crit yields the upper damage", () => {
    // 100 × 1.2 × 1.4 × 0.667 ≈ 112
    expect(
      resolveDamage(
        hit,
        attacker,
        target,
        alwaysCrit(CRIT_CHANCE, CRIT_DAMAGE),
      ),
    ).toBeCloseTo(112);
  });

  test("magic damage is mitigated by magic resist, not armor", () => {
    const magicHit = { amount: 100, damageType: "magic" } as const;
    const magicTarget = { armor: 0, magicResist: 50 }; // 100/150 ≈ 0.667
    expect(
      resolveDamage(magicHit, { damageAmp: 0 }, magicTarget, 1),
    ).toBeCloseTo(66.67);
  });

  test("true damage ignores resists entirely", () => {
    const trueHit = { amount: 100, damageType: "true" } as const;
    const tanky = { armor: 999, magicResist: 999 };
    expect(resolveDamage(trueHit, { damageAmp: 0 }, tanky, 1)).toBe(100);
  });

  test("guardrail: neverCrit ≤ expected ≤ alwaysCrit, fed by the policies", () => {
    const low = resolveDamage(
      hit,
      attacker,
      target,
      neverCrit(CRIT_CHANCE, CRIT_DAMAGE),
    );
    const mid = resolveDamage(
      hit,
      attacker,
      target,
      expected(CRIT_CHANCE, CRIT_DAMAGE),
    );
    const high = resolveDamage(
      hit,
      attacker,
      target,
      alwaysCrit(CRIT_CHANCE, CRIT_DAMAGE),
    );

    expect(low).toBeLessThanOrEqual(mid);
    expect(mid).toBeLessThanOrEqual(high);
  });
});

describe("mitigationFactor — routing by damage type", () => {
  const target = { armor: 50, magicResist: 30 };

  test("physical uses armor", () => {
    expect(mitigationFactor("physical", target)).toBeCloseTo(100 / 150);
  });

  test("magic uses magic resist", () => {
    expect(mitigationFactor("magic", target)).toBeCloseTo(100 / 130);
  });

  test("true is a neutral factor", () => {
    expect(mitigationFactor("true", target)).toBe(1);
  });

  test("zero resist is neutral", () => {
    expect(mitigationFactor("physical", { armor: 0, magicResist: 0 })).toBe(1);
  });
});

describe("amplify", () => {
  test("turns a bonus into a factor (1 + bonus)", () => {
    expect(amplify(0.2)).toBeCloseTo(1.2);
  });

  test("zero bonus is neutral", () => {
    expect(amplify(0)).toBe(1);
  });
});
