import { test, expect, describe } from "bun:test";
import {
  resolveDamage,
  mitigationFactor,
  amplify,
  reductionFactor,
} from "./resolve-damage";
import { expected, neverCrit, alwaysCrit } from "./crit-policy";

const CRIT_CHANCE = 0.25;
const CRIT_DAMAGE = 0.4;

describe("resolveDamage", () => {
  const hit = { amount: 100, damageType: "physical" } as const;
  const attacker = { damageAmp: 0.2 }; // amplification ×1.2
  const noReduction = { durability: 0, damageReductions: [] };
  // physical → 100/150 ≈ 0.667
  const target = { armor: 50, magicResist: 0, ...noReduction };

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
    const magicTarget = { armor: 0, magicResist: 50, ...noReduction }; // 100/150 ≈ 0.667
    expect(
      resolveDamage(magicHit, { damageAmp: 0 }, magicTarget, 1),
    ).toBeCloseTo(66.67);
  });

  test("true damage ignores resists entirely", () => {
    const trueHit = { amount: 100, damageType: "true" } as const;
    const tanky = { armor: 999, magicResist: 999, ...noReduction };
    expect(resolveDamage(trueHit, { damageAmp: 0 }, tanky, 1)).toBe(100);
  });

  test("durability reduces the dealt damage", () => {
    const durable = {
      armor: 0,
      magicResist: 0,
      durability: 0.5,
      damageReductions: [],
    };
    // 100 × 1 × 1 × 1 × 0.5
    expect(resolveDamage(hit, { damageAmp: 0 }, durable, 1)).toBe(50);
  });

  test("both reduction lanes apply to the same hit", () => {
    const shielded = {
      armor: 0,
      magicResist: 0,
      durability: 0.2,
      damageReductions: [0.5],
    };
    // 100 × (1 − 0.2) × (1 − 0.5)
    expect(resolveDamage(hit, { damageAmp: 0 }, shielded, 1)).toBeCloseTo(40);
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

describe("reductionFactor — the two damage-reduction lanes", () => {
  test("no reduction is neutral", () => {
    expect(reductionFactor(0, [])).toBe(1);
  });

  test("durability lane alone", () => {
    expect(reductionFactor(0.2, [])).toBeCloseTo(0.8);
  });

  test("damage-reduction modifiers each contribute their own factor", () => {
    expect(reductionFactor(0, [0.1, 0.2])).toBeCloseTo(0.72);
  });

  test("the lanes stack multiplicatively", () => {
    expect(reductionFactor(0.2, [0.5])).toBeCloseTo(0.4);
  });

  test("a full reduction floors at total negation, never below", () => {
    expect(reductionFactor(1.5, [])).toBe(0);
    expect(reductionFactor(0, [1, 0.3])).toBe(0);
  });

  test("a negative reduction never amplifies", () => {
    expect(reductionFactor(-0.5, [])).toBe(1);
    expect(reductionFactor(0, [-0.3])).toBe(1);
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
