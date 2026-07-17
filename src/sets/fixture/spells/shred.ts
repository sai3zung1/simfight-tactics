import type { SpellId } from "../../../domain/primitives";
import type { SpellParameters } from "../../../domain/catalog/spell";
import type { SpellFn } from "../../../engine/spell/contract";

/**
 * Shred — the fixture set's debuff: the caster tears at the opponent's armor for
 * a few seconds, so its own physical hits land harder for the window. Made-up
 * content with a real kit's shape (shred / sunder), here to prove a timed
 * stat-mod landing on the opposite side as a negative amount (#71, D6/D8); it
 * honors the same path contract as any set's spell, fictive or real.
 */

export const FIXTURE_SHRED_SPELL_ID = "fixture-shred" as SpellId;

/**
 * The kit's tuning numbers: the flat armor removed, per star level, and how long
 * it lasts. Plausible shred values (~1.5x per star), not sourced.
 */
export const FIXTURE_SHRED_PARAMETERS: SpellParameters = {
  armorShred: { 1: 20, 2: 30, 3: 45 },
  durationSeconds: 4,
};

/**
 * One targeted effect: the star-collapsed `armorShred` as a flat, timed stat-mod
 * on the opponent's armor — negative, since a debuff lowers the stat. The engine
 * folds it out of the victim's armor now and refolds it back when it expires
 * (#70/#71). Flat by design (no `sources`): a caster-scaled shred is left to
 * real content.
 */
export const shred: SpellFn = (_ctx, params) => [
  {
    recipient: "opponent",
    modifier: {
      kind: "stat-mod",
      target: "armor",
      amount: { base: -params.armorShred },
      temporality: { kind: "duration", seconds: params.durationSeconds },
    },
  },
];
