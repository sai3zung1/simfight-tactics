import type { SpellId } from "../../../domain/primitives";
import type { SpellParameters } from "../../../domain/catalog/spell";
import type { SpellFn } from "../../../engine/spell/contract";

export const FIXTURE_SUNDER_SPELL_ID = "fixture-sunder" as SpellId;

export const FIXTURE_SUNDER_PARAMETERS: SpellParameters = {
  armorReduction: { 1: 20, 2: 30, 3: 45 },
  durationSeconds: 4,
};

export const sunder: SpellFn = (_ctx, params) => [
  {
    recipient: "opponent",
    modifier: {
      kind: "stat-mod",
      target: "armor",
      // Negative because the taxonomy has no debuff kind: a stat-mod carries
      // its direction in the sign.
      amount: { base: -params.armorReduction },
      temporality: { kind: "duration", seconds: params.durationSeconds },
    },
  },
];
