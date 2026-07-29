import type {
  BaseStats,
  ManaGeneration,
} from "../../domain/catalog/base-stats";
import type { ScalingByStar, StarLevel } from "../../domain/primitives";

export type ResolvedStats = {
  readonly hp: number;
  readonly armor: number;
  readonly magicResist: number;
  readonly durability: number;
  readonly mana: BaseStats["mana"];
  readonly manaGeneration: ManaGeneration;
  readonly attackDamage: number;
  readonly abilityPower: number;
  readonly attackSpeed: number;
  readonly critChance: number;
  readonly critDamage: number;
  readonly damageAmp: number;
};

// The cast trusts the data pipeline to only ever ask for a star a unit is
// eligible at; a missing entry would return undefined under a number type.
export function resolveScaling(
  scaling: ScalingByStar,
  starLevel: StarLevel,
): number {
  return scaling[starLevel] as number;
}

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
    abilityPower: stats.abilityPower,
    attackSpeed: stats.attackSpeed,
    critChance: stats.critChance,
    critDamage: stats.critDamage,
    damageAmp: stats.damageAmp,
  };
}
