import type { DamageType } from "../../domain/catalog/modifier";

export type ResolvedHit = {
  readonly preMitigated: number;
  readonly dealt: number;
};

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

const MITIGATION_BASE = 100;

function mitigate(resist: number): number {
  return MITIGATION_BASE / (MITIGATION_BASE + Math.max(0, resist));
}

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
      return 1;
    default: {
      const _exhaustive: never = damageType;
      return _exhaustive;
    }
  }
}

export function amplify(amp: number): number {
  return 1 + amp;
}

function reductionTerm(reduction: number): number {
  return Math.min(1, Math.max(0, 1 - reduction));
}

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
