import type { SpellId } from "../../../domain/primitives";
import type { SpellParameters } from "../../../domain/catalog/spell";
import type { SpellFn } from "../../../engine/spell/contract";

export const FIXTURE_SHRED_SPELL_ID = "fixture-shred" as SpellId;

export const FIXTURE_SHRED_PARAMETERS: SpellParameters = {
  armorShred: { 1: 20, 2: 30, 3: 45 },
  durationSeconds: 4,
};

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
