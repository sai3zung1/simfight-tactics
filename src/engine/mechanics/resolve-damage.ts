import type { DamageType } from "../../domain/catalog/modifier";

/**
 * The two numbers one hit produces: `preMitigated` is the damage heading
 * into mitigation (amplification and crit applied), `dealt` is what lands
 * after mitigation and reduction. The damage-taken mana conversion reads
 * both; where exactly the pre-mitigation boundary sits is provisional
 * until calibration (#51).
 */
export type ResolvedHit = {
  readonly preMitigated: number;
  readonly dealt: number;
};

/**
 * resolveDamage — a hit's damage pipeline: amplification → crit → mitigation
 * → reduction. Returns the hit's two numbers, mutates nothing. `critFactor`
 * arrives pre-computed (the CritPolicy is applied upstream); the other factors
 * are derived here from the attacker's and target's stats.
 *
 * Order is provisional: the shape (bonus → amp → crit → mitigation) comes from ADR 0004,
 * extended here with the reduction stage; the internal order and coefficients are still
 * to be set by calibration. Today every stage multiplies into one product, so their
 * order cannot change the result. Order starts to matter the day the flat `bonus`
 * stage (no source yet) lands.
 */
export function resolveDamage(
  hit: { amount: number; damageType: DamageType },
  attacker: { damageAmp: number },
  target: {
    armor: number;
    magicResist: number;
    durability: number;
    damageReductions: readonly number[];
  },
  critFactor: number,
): ResolvedHit {
  const preMitigated = hit.amount * amplify(attacker.damageAmp) * critFactor;
  const mitigated = mitigationFactor(hit.damageType, target);
  const reduced = reductionFactor(target.durability, target.damageReductions);
  return { preMitigated, dealt: preMitigated * mitigated * reduced };
}

/** Fixed game constant of the mitigation formula, not a stat (combat-resolution.md). */
const MITIGATION_BASE = 100;

/**
 * Reduction from a resist: `100/(100+resist)`. More resist → less damage.
 * Resists floor at 0 (combat-resolution.md): a resist shredded below zero
 * yields true-damage territory, never amplified damage.
 */
function mitigate(resist: number): number {
  return MITIGATION_BASE / (MITIGATION_BASE + Math.max(0, resist));
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

/**
 * One lane's share of the reduction. A reduction never amplifies (raising
 * damage taken is `damageAmp`'s job) and never over-negates — each factor
 * stays in [0, 1].
 */
function reductionTerm(reduction: number): number {
  return Math.min(1, Math.max(0, 1 - reduction));
}

/**
 * Reduction factor from the two damage-reduction lanes: the target's effective
 * `durability` — one additive pool, fed by the stat-mod fold — and the
 * `damage-reduction` modifiers, one factor per source. The lanes stack
 * multiplicatively, so their rules stay distinct by construction. Formula and
 * pipeline slot are community-sourced, provisional until calibration (#51).
 */
export function reductionFactor(
  durability: number,
  damageReductions: readonly number[],
): number {
  let factor = reductionTerm(durability);
  for (const reduction of damageReductions) {
    factor *= reductionTerm(reduction);
  }
  return factor;
}
