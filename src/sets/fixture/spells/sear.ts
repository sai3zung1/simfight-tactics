import type { SpellId } from "../../../domain/primitives";
import type { SpellParameters } from "../../../domain/catalog/spell";
import type { SpellFn } from "../../../engine/spell/contract";

/**
 * Sear — the fixture set's damage over time: the caster ignites the opponent,
 * dealing repeated magic damage over a window. Made-up content with a real
 * kit's shape, here to prove periodic scheduling and the per-tick damage
 * pipeline (#72); it honors the same path contract as any set's spell,
 * fictive or real.
 */

export const FIXTURE_SEAR_SPELL_ID = "fixture-sear" as SpellId;

/**
 * The kit's tuning numbers: the damage each tick lists at the at-rest ability
 * power, per star level, and the burn's window and cadence. Plausible burn
 * values (~1.5x per star), not sourced.
 */
export const FIXTURE_SEAR_PARAMETERS: SpellParameters = {
  tickDamage: { 1: 60, 2: 90, 3: 135 },
  windowSeconds: 4,
  intervalSeconds: 1,
};

/**
 * One targeted effect: the star-collapsed `tickDamage`, scaled by the caster's
 * ability power and re-read at each tick, as periodic magic damage on the
 * opponent. `instance` by convention — a damage tick leaves no residue, so the
 * mode cannot be observed.
 */
export const sear: SpellFn = (_ctx, params) => [
  {
    recipient: "opponent",
    modifier: {
      kind: "damage",
      damageType: "magic",
      amount: { base: params.tickDamage, sources: ["abilityPower"] },
      temporality: {
        kind: "periodic",
        seconds: params.windowSeconds,
        interval: params.intervalSeconds,
        mode: "instance",
      },
    },
  },
];
