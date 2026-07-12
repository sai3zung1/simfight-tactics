/**
 * The crit multiplier applied to a hit, derived from the attacker's crit
 * stats. Computed by the caller and passed to `resolveDamage` as a ready
 * number, so the damage pipeline stays unaware of the crit mechanic.
 *
 * `expectedCrit` is the deterministic policy the engine runs on; `neverCrit`
 * and `alwaysCrit` are its lower and upper bounds, used to bracket it in
 * tests. They would become the extremes of the roll if a stochastic mode
 * is ever added.
 */
export type CritPolicy = (critChance: number, critDamage: number) => number;

/**
 * Expected value: the weighted average between a nominal and a critical hit.
 * `critDamage` is stored as the bonus over a nominal hit, not the full
 * multiplier — the game data stores the full multiplier, so the adapter
 * subtracts one on the way in (docs/data/calibration-log.md, C5). Base
 * values are confirmed in the game data (log C4).
 */
export const expectedCrit: CritPolicy = (critChance, critDamage) =>
  1 + critChance * critDamage;

/** Lower bound: no crit → nominal hit. */
export const neverCrit: CritPolicy = () => 1;

/** Upper bound: guaranteed crit → full bonus. */
export const alwaysCrit: CritPolicy = (_, critDamage) => 1 + critDamage;
