import type { SpellId } from "../../../domain/primitives";
import type { SpellParameters } from "../../../domain/catalog/spell";
import type { SpellFn } from "../../../engine/spell/contract";

/**
 * Aegis — the fixture set's shield: the caster wraps itself in a barrier that
 * absorbs damage ahead of its HP for a few seconds. Made-up content with a real
 * kit's shape, here to prove a timed shield pool consumed ahead of HP and pruned
 * on expiry (#71, D6/D7/D8); it honors the same path contract as any set's
 * spell, fictive or real.
 */

export const FIXTURE_AEGIS_SPELL_ID = "fixture-aegis" as SpellId;

/**
 * The kit's tuning numbers: the flat shield granted, per star level, and how
 * long the barrier lasts. Plausible shield values (~1.5x per star), not sourced.
 */
export const FIXTURE_AEGIS_PARAMETERS: SpellParameters = {
  shieldAmount: { 1: 300, 2: 450, 3: 675 },
  durationSeconds: 4,
};

/**
 * One targeted effect: the star-collapsed `shieldAmount` as a timed shield on
 * the caster itself — a pool the engine consumes ahead of HP and prunes when it
 * expires (#71). Flat by design (no `sources`): a caster-scaled shield is left
 * to real content.
 */
export const aegis: SpellFn = (_ctx, params) => [
  {
    recipient: "self",
    modifier: {
      kind: "shield",
      amount: { base: params.shieldAmount },
      temporality: { kind: "duration", seconds: params.durationSeconds },
    },
  },
];
