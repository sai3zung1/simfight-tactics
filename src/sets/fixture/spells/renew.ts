import type { SpellId } from "../../../domain/primitives";
import type { SpellParameters } from "../../../domain/catalog/spell";
import type { SpellFn } from "../../../engine/spell/contract";

/**
 * Renew — the fixture set's heal over time: the caster mends itself in
 * repeated pulses, each capped at its maximum HP. Made-up content with a real
 * kit's shape, here to prove the per-tick heal path (#72); it honors the same
 * path contract as any set's spell, fictive or real.
 */

export const FIXTURE_RENEW_SPELL_ID = "fixture-renew" as SpellId;

/**
 * The kit's tuning numbers: the HP each pulse restores, per star level, and
 * the regrowth's window and cadence. Plausible heal-over-time values (~1.5x
 * per star), not sourced.
 */
export const FIXTURE_RENEW_PARAMETERS: SpellParameters = {
  tickHeal: { 1: 70, 2: 105, 3: 160 },
  windowSeconds: 3,
  intervalSeconds: 1,
};

/**
 * One targeted effect: the star-collapsed `tickHeal` as periodic healing on
 * the caster itself. Flat by design (no `sources`), like the other defensive
 * fixtures. `instance` by convention — a heal tick leaves no residue, so the
 * mode cannot be observed.
 */
export const renew: SpellFn = (_ctx, params) => [
  {
    recipient: "self",
    modifier: {
      kind: "heal",
      amount: { base: params.tickHeal },
      temporality: {
        kind: "periodic",
        seconds: params.windowSeconds,
        interval: params.intervalSeconds,
        mode: "instance",
      },
    },
  },
];
