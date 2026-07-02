import type { BaseStats } from "../domain/catalog/base-stats";
import type { ScalingByStar, StarLevel } from "../domain/primitives";

/**
 * A combatant's stats for one specific star level — `BaseStats` with the
 * per-star fields collapsed to plain numbers, narrowed to the fields the
 * combat pipeline actually reads. Resolved once here so nothing downstream
 * (damage resolution, crit, cadence) needs to know the combatant's star level
 * or unpack a per-star table again.
 */
export type ResolvedStats = {
  readonly hp: number;
  readonly armor: number;
  readonly magicResist: number;
  readonly durability: number;
  readonly attackDamage: number;
  readonly attackSpeed: number;
  readonly critChance: number;
  readonly critDamage: number;
  readonly damageAmp: number;
};

/**
 * Assumes `starLevel` has a matching entry in `scaling` — an invariant the
 * data pipeline is meant to guarantee (a unit's eligible star range), not
 * re-validated here (parse, don't validate). Open gap on the data side:
 * Ice-Box "Pipeline invariant: ScalingByStar omits key 4 for ineligible
 * units".
 */
export function resolveScaling(
  scaling: ScalingByStar,
  starLevel: StarLevel,
): number {
  return scaling[starLevel] as number;
}

/** Collapse `BaseStats` to one star level's `ResolvedStats`. */
export function resolveStats(
  stats: BaseStats,
  starLevel: StarLevel,
): ResolvedStats {
  return {
    hp: resolveScaling(stats.hp, starLevel),
    armor: stats.armor,
    magicResist: stats.magicResist,
    durability: stats.durability,
    attackDamage: resolveScaling(stats.attackDamage, starLevel),
    attackSpeed: stats.attackSpeed,
    critChance: stats.critChance,
    critDamage: stats.critDamage,
    damageAmp: stats.damageAmp,
  };
}
