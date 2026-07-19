import type { SpellId } from "../../../domain/primitives";
import type { SpellParameters } from "../../../domain/catalog/spell";
import type { SpellFn } from "../../../engine/spell/contract";

/**
 * Frenzy — the fixture set's ramping steroid: the caster works itself up,
 * gaining stacking attack speed at a steady cadence for the rest of the
 * fight. Made-up content with a real kit's shape (the Guinsoo pattern), here
 * to prove accrual residue ticks (#72); it honors the same path contract as
 * any set's spell, fictive or real.
 */

export const FIXTURE_FRENZY_SPELL_ID = "fixture-frenzy" as SpellId;

/**
 * The kit's tuning numbers: the attack speed each tick grants — flat and
 * permanent-for-combat, stacks never decay — per star level, and the ramp's
 * window and cadence. Plausible ramp values (~1.5x per star), not sourced.
 */
export const FIXTURE_FRENZY_PARAMETERS: SpellParameters = {
  tickAttackSpeed: { 1: 0.06, 2: 0.09, 3: 0.14 },
  windowSeconds: 5,
  intervalSeconds: 1,
};

/**
 * One targeted effect: the star-collapsed `tickAttackSpeed` as an accrual
 * periodic stat-mod on the caster itself — each tick banks one more
 * never-expiring stack. Flat by design (no `sources`): the Guinsoo pattern
 * grants fixed steps, and a flat magnitude is exactly what the per-tick
 * re-read leaves untouched.
 */
export const frenzy: SpellFn = (_ctx, params) => [
  {
    recipient: "self",
    modifier: {
      kind: "stat-mod",
      target: "attackSpeed",
      amount: { base: params.tickAttackSpeed },
      temporality: {
        kind: "periodic",
        seconds: params.windowSeconds,
        interval: params.intervalSeconds,
        mode: "accrual",
      },
    },
  },
];
