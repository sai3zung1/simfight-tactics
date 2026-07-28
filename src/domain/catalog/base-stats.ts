import type { ScalingByStar } from "../primitives";

export type ManaGeneration = {
  readonly perAttack: number;
  readonly perSecond: number;
  readonly gainsFromDamageTaken: boolean;
};

export type BaseStats = {
  readonly hp: ScalingByStar;
  readonly armor: number;
  readonly magicResist: number;
  readonly durability: number;

  readonly mana: {
    readonly min: number;
    readonly start: number;
    readonly max: number;
  };
  readonly manaGeneration: ManaGeneration;

  readonly attackDamage: ScalingByStar;
  readonly abilityPower: number;
  readonly attackSpeed: number;
  readonly critChance: number;
  readonly critDamage: number;
  readonly range: number;
  readonly damageAmp: number;
};
