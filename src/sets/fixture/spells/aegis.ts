import type { SpellId } from "../../../domain/primitives";
import type { SpellParameters } from "../../../domain/catalog/spell";
import type { SpellFn } from "../../../engine/spell/contract";

export const FIXTURE_AEGIS_SPELL_ID = "fixture-aegis" as SpellId;

export const FIXTURE_AEGIS_PARAMETERS: SpellParameters = {
  shieldAmount: { 1: 300, 2: 450, 3: 675 },
  durationSeconds: 4,
};

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
