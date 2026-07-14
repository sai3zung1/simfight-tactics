import type { SpellId } from "../../../domain/primitives";
import type { SpellParameters } from "../../../domain/catalog/spell";
import type { SpellFn } from "../../../engine/spell/contract";

/**
 * Burst — the fixture set's one spell: a single instant hit of magic damage
 * on the opponent, multiplied by the caster's ability power. Made-up content
 * with a real kit's shape, here to prove the cast-to-damage machinery (#69);
 * it honors the same path contract as any set's spell, fictive or real.
 */

export const FIXTURE_BURST_SPELL_ID = "fixture-burst" as SpellId;

/**
 * The kit's tuning numbers: the damage listed at the at-rest ability power,
 * per star level. Plausible magic-kit values (~1.5x per star), not sourced.
 */
export const FIXTURE_BURST_PARAMETERS: SpellParameters = {
  baseDamage: { 1: 230, 2: 345, 3: 520 },
};

/**
 * One targeted effect: the star-collapsed `baseDamage`, scaled by the
 * caster's ability power, delivered as instant magic damage to the opponent.
 */
export const burst: SpellFn = (_ctx, params) => [
  {
    recipient: "opponent",
    modifier: {
      kind: "damage",
      damageType: "magic",
      amount: { base: params.baseDamage, sources: ["abilityPower"] },
      temporality: { kind: "instant" },
    },
  },
];
