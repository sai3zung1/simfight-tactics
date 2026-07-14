/**
 * The canonical combat numbers for one unit — the stats the engine reads to
 * simulate a fight. Populated once by the data pipeline: values that vary by
 * star level are stored as explicit per-star tables (`ScalingByStar`), the rest
 * are flat, so the engine never does scaling math at runtime.
 */

import type { ScalingByStar } from "../primitives";

/**
 * How a unit generates mana. In the game the amounts follow the unit's
 * role; the data pipeline resolves that role to these plain numbers, so
 * the engine reads values and never knows roles (ADR 0002).
 * `gainsFromDamageTaken` gates the hits-taken generation — only Tanks
 * have it.
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
    /**
     * Floor below which mana cannot drop. Declarative today: no effect
     * drains mana yet, so no code enforces it — the clamp enters
     * `gainMana` with the first draining effect.
     */
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
  /**
   * The most common scaling source for spell effects, one among many: an
   * effect's amount may scale from any base stat
   * (docs/data/modifier-archetypes.md, "open stat enumeration").
   * Stored normalized: 1 is the at-rest baseline the game displays as 100;
   * the unit conversion is the adapter's job (ADR 0005).
   */
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
