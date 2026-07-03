/**
 * CritPolicy — the crit multiplier applied to a hit, derived from the attacker's crit
 * stats. Computed upstream (by the producer) and passed to `resolveDamage` as a ready
 * number: the pipeline stays unaware of the crit mechanic.
 *
 * Three faces: `expected` — the deterministic policy the engine runs on — and
 * the bounds `neverCrit` / `alwaysCrit`, which bracket it in tests and become
 * the extremes of the roll if a stochastic mode is ever added.
 */
export type CritPolicy = (critChance: number, critDamage: number) => number;

/**
 * Expected value: the weighted average between a nominal and a critical hit.
 * `critDamage` is stored as the bonus over a nominal hit, not the full
 * multiplier — whether the extraction source encodes it the same way is
 * confirmed once extraction is owned end-to-end (#36). Provisional shape;
 * coefficient to be set by calibration (docs/data/combat-resolution.md).
 */
export const expected: CritPolicy = (critChance, critDamage) =>
  1 + critChance * critDamage;

/** Lower bound: no crit → nominal hit. */
export const neverCrit: CritPolicy = () => 1;

/** Upper bound: guaranteed crit → full bonus. */
export const alwaysCrit: CritPolicy = (_, critDamage) => 1 + critDamage;
