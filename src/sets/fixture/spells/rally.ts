import type { SpellId } from "../../../domain/primitives";
import type { SpellParameters } from "../../../domain/catalog/spell";
import type { SpellFn } from "../../../engine/spell/contract";

/**
 * Rally — the fixture set's timed self-buff: the caster steels itself, gaining
 * a flat burst of attack damage for a few seconds. Made-up content with a real
 * kit's shape, here to prove the mid-run apply / refold / expire machinery
 * (#70); it honors the same path contract as any set's spell, fictive or real.
 */

export const FIXTURE_RALLY_SPELL_ID = "fixture-rally" as SpellId;

/**
 * The kit's tuning numbers: the flat attack damage granted, per star level, and
 * how long it lasts. Plausible steroid values (~1.5x per star), not sourced.
 */
export const FIXTURE_RALLY_PARAMETERS: SpellParameters = {
  bonusAttackDamage: { 1: 40, 2: 60, 3: 90 },
  durationSeconds: 4,
};

/**
 * One targeted effect: the star-collapsed `bonusAttackDamage` as a flat, timed
 * stat-mod on the caster itself — a duration buff the engine folds into the
 * caster's stats now and refolds out when it expires (#70). Flat by design (no
 * `sources`): a caster-scaled magnitude is #71's work.
 */
export const rally: SpellFn = (_ctx, params) => [
  {
    recipient: "self",
    modifier: {
      kind: "stat-mod",
      target: "attackDamage",
      amount: { base: params.bonusAttackDamage },
      temporality: { kind: "duration", seconds: params.durationSeconds },
    },
  },
];
