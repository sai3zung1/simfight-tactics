/**
 * The canonical combat numbers for one unit — the stats the engine reads to
 * simulate a fight. Populated once by the data pipeline: values that vary by
 * star level are stored as explicit per-star tables (`ScalingByStar`), the rest
 * are flat, so the engine never does scaling math at runtime.
 */

import type { ScalingByStar } from "../primitives";

/**
 * How a unit generates mana — its role resolved to plain values at
 * composition (Set 15 roles revamp: the role fixes these; the engine reads
 * the values and never knows roles, ADR 0002). `perAttack` lands on each
 * auto-attack, `perSecond` is a steady flow (Casters), and
 * `gainsFromDamageTaken` gates the generation on hits taken (Tanks).
 */
export type ManaGeneration = {
  readonly perAttack: number;
  readonly perSecond: number;
  readonly gainsFromDamageTaken: boolean;
};

export type BaseStats = {
  readonly hp: ScalingByStar;
  readonly armor: number;
  readonly magicResist: number;
  /**
   * Reduction on damage taken, combined with (not part of) armor and
   * magic-resist mitigation; one additive pool that stat-mod modifiers raise.
   */
  readonly durability: number;

  readonly mana: {
    /** Floor below which mana cannot drop. */
    readonly min: number;
    readonly start: number;
    /**
     * Threshold required to cast the spell. Non-positive encodes a unit
     * with no mana bar at all — it never casts (Specialist role).
     */
    readonly max: number;
  };
  readonly manaGeneration: ManaGeneration;

  readonly attackDamage: ScalingByStar;
  /** Ability power — the stat that spell damage and other AP effects scale from. */
  readonly abilityPower: number;
  /** In attacks per second. */
  readonly attackSpeed: number;
  /** Probability in [0, 1] that a hit crits. */
  readonly critChance: number;
  /** Bonus over a nominal hit, not the full multiplier. */
  readonly critDamage: number;
  /** Measured in hexes. */
  readonly range: number;
  /** Outgoing damage bonus. */
  readonly damageAmp: number;
};
