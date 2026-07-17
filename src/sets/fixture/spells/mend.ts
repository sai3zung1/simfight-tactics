import type { SpellId } from "../../../domain/primitives";
import type { SpellParameters } from "../../../domain/catalog/spell";
import type { SpellFn } from "../../../engine/spell/contract";

/**
 * Mend — the fixture set's heal: the caster restores a burst of its own HP,
 * capped at its maximum. Made-up content with a real kit's shape, here to prove
 * an instant heal landing on HP and losing its overheal (#71, D5/D8); it honors
 * the same path contract as any set's spell, fictive or real.
 */

export const FIXTURE_MEND_SPELL_ID = "fixture-mend" as SpellId;

/**
 * The kit's tuning numbers: the flat HP restored, per star level. Plausible heal
 * values (~1.5x per star), not sourced.
 */
export const FIXTURE_MEND_PARAMETERS: SpellParameters = {
  healAmount: { 1: 250, 2: 375, 3: 560 },
};

/**
 * One targeted effect: the star-collapsed `healAmount` as an instant heal on the
 * caster itself — the engine restores HP up to the effective max and drops the
 * surplus (#71). Flat by design (no `sources`): a caster-scaled heal is left to
 * real content.
 */
export const mend: SpellFn = (_ctx, params) => [
  {
    recipient: "self",
    modifier: {
      kind: "heal",
      amount: { base: params.healAmount },
      temporality: { kind: "instant" },
    },
  },
];
