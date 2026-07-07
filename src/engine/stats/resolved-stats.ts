import type {
  BaseStats,
  ManaGeneration,
} from "../../domain/catalog/base-stats";
import type { ScalingByStar, StarLevel } from "../../domain/primitives";

/**
 * Collapse the per-star tables of `BaseStats` into plain numbers, once, so
 * nothing downstream ever asks "which star level?" again.
 *
 * First of the two stat views: `ResolvedStats` holds a unit's numbers
 * before modifiers; `EffectiveStats` (effective-stats.ts) is the same
 * shape after them.
 */
export type ResolvedStats = {
  readonly hp: number;
  readonly armor: number;
  readonly magicResist: number;
  readonly durability: number;
  /** Both pass through as-is: mana does not vary by star in the game data. */
  readonly mana: BaseStats["mana"];
  readonly manaGeneration: ManaGeneration;
  readonly attackDamage: number;
  readonly attackSpeed: number;
  readonly critChance: number;
  readonly critDamage: number;
  readonly damageAmp: number;
};

/**
 * Assumes `starLevel` has a matching entry in `scaling` — an invariant the
 * data pipeline is meant to guarantee (a unit's eligible star range), not
 * re-validated here (parse, don't validate). That guarantee is not built
 * yet: the pipeline emitting key 4 only for units actually eligible at four
 * stars is an open, parked gap on the data side (#23).
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
    mana: stats.mana,
    manaGeneration: stats.manaGeneration,
    attackDamage: resolveScaling(stats.attackDamage, starLevel),
    attackSpeed: stats.attackSpeed,
    critChance: stats.critChance,
    critDamage: stats.critDamage,
    damageAmp: stats.damageAmp,
  };
}
