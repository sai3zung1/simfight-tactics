/**
 * Per-unit combat statistics, loaded once from the data pipeline.
 *
 * Stats that scale per star level use `ScalingByStar` (from `../primitives`);
 * the pipeline (ROADMAP §5) resolves their values at normalization time.
 * Other stats are flat. The engine performs no scaling math at runtime.
 */

import type { ScalingByStar } from "../primitives";

export type BaseStats = {
  /** Hitpoints, per star level. */
  readonly hp: ScalingByStar;
  /** Flat physical resistance. */
  readonly armor: number;
  /** Flat magic resistance. */
  readonly magicResist: number;
  /** Damage reduction in range 0 to 1. */
  readonly durability: number;

  readonly mana: {
    /** Floor below which mana cannot drop. */
    readonly min: number;
    /** Value at combat start. */
    readonly start: number;
    /** Threshold required to cast the spell. */
    readonly max: number;
  };

  /** Per-attack damage, per star level. */
  readonly attackDamage: ScalingByStar;
  /** Reference value for spell-scaling formulas. */
  readonly abilityPower: number;
  /** In attacks per second. */
  readonly attackSpeed: number;
  /** Probability in range 0 to 1. */
  readonly critChance: number;
  /** Damage multiplier applied on a crit hit. */
  readonly critDamage: number;
  /** Measured in hexes. */
  readonly range: number;
  /** Outgoing damage bonus, expressed as a decimal. */
  readonly damageAmp: number;
};
