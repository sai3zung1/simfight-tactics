/**
 * The canonical combat numbers for one unit — the stats the engine reads to
 * simulate a fight. Populated once by the data pipeline: values that vary by
 * star level are stored as explicit per-star tables (`ScalingByStar`), the rest
 * are flat, so the engine never does scaling math at runtime.
 */

import type { ScalingByStar } from "../primitives";

export type BaseStats = {
  readonly hp: ScalingByStar;
  readonly armor: number;
  readonly magicResist: number;
  /** Damage reduction. */
  readonly durability: number;

  readonly mana: {
    /** Floor below which mana cannot drop. */
    readonly min: number;
    readonly start: number;
    /** Threshold required to cast the spell. */
    readonly max: number;
  };

  readonly attackDamage: ScalingByStar;
  /** Ability power — the stat that spell damage and other AP effects scale from. */
  readonly abilityPower: number;
  /** In attacks per second. */
  readonly attackSpeed: number;
  readonly critChance: number;
  readonly critDamage: number;
  /** Measured in hexes. */
  readonly range: number;
  /** Outgoing damage bonus. */
  readonly damageAmp: number;
};
