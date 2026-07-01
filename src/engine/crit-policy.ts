/**
 * CritPolicy — the crit multiplier applied to a hit, derived from the attacker's crit
 * stats. Computed upstream (by the producer) and passed to `resolveDamage` as a ready
 * number: the pipeline stays unaware of the crit mechanic.
 *
 * Three faces: `expected` (deterministic, current mode) and the bounds `neverCrit` /
 * `alwaysCrit` — a test guardrail today, the extremes of the stochastic roll later.
 */
export type CritPolicy = (critChance: number, critDamage: number) => number;

/**
 * Expected value: the weighted average between a nominal and a critical hit.
 * `critDamage` is a bonus (schema convention — source encoding to confirm, #36).
 * Provisional shape; coefficient to be set by calibration (docs/data/combat-resolution.md).
 */
export const expected: CritPolicy = (critChance, critDamage) =>
  1 + critChance * critDamage;

/** Lower bound: no crit → nominal hit. */
export const neverCrit: CritPolicy = () => 1;

/** Upper bound: guaranteed crit → full bonus. */
export const alwaysCrit: CritPolicy = (_, critDamage) => 1 + critDamage;
