import type { DamageType } from "../domain/catalog/modifier";

/**
 * resolveDamage — a hit's damage pipeline: amplification → crit → mitigation.
 * Returns the damage dealt, mutates nothing. `critFactor` arrives pre-computed (the
 * CritPolicy is applied upstream); amplification and mitigation are derived here from
 * the attacker's and target's raw stats.
 *
 * Order is provisional: the shape (bonus → amp → crit → mitigation) comes from ADR 0004;
 * the internal order and coefficients are still to be set by calibration. `bonus` has no
 * source yet — it will slot in before amplification.
 */
export function resolveDamage(
  hit: { amount: number; damageType: DamageType },
  attacker: { damageAmp: number },
  target: { armor: number; magicResist: number },
  critFactor: number,
): number {
  const amplified = amplify(attacker.damageAmp);
  const mitigated = mitigationFactor(hit.damageType, target);
  return hit.amount * amplified * critFactor * mitigated;
}

/** Fixed game constant of the mitigation formula, not a stat (combat-resolution.md). */
const MITIGATION_BASE = 100;

/** Reduction from a resist: `100/(100+resist)`. More resist → less damage. */
function mitigate(resist: number): number {
  return MITIGATION_BASE / (MITIGATION_BASE + resist);
}

/**
 * Mitigation factor by damage type: armor (physical), magic resist (magic), or none
 * (`true`). The `default` carries the exhaustiveness guard — a new `DamageType` breaks
 * compilation rather than silently yielding wrong damage.
 */
export function mitigationFactor(
  damageType: DamageType,
  target: { armor: number; magicResist: number },
): number {
  switch (damageType) {
    case "physical":
      return mitigate(target.armor);
    case "magic":
      return mitigate(target.magicResist);
    case "true":
      return 1; // true ignores resists → neutral mitigation
    default: {
      const _exhaustive: never = damageType;
      return _exhaustive;
    }
  }
}

/**
 * Amplification factor: `1 + bonus`. `damageAmp` is a normalized decimal bonus; any unit
 * conversion is the adapter's job, not here (ADR 0005).
 */
export function amplify(amp: number): number {
  return 1 + amp;
}
