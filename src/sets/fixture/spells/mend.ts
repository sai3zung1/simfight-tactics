import type { SpellId } from "../../../domain/primitives";
import type { SpellParameters } from "../../../domain/catalog/spell";
import type { SpellFn } from "../../../engine/spell/contract";

export const FIXTURE_MEND_SPELL_ID = "fixture-mend" as SpellId;

export const FIXTURE_MEND_PARAMETERS: SpellParameters = {
  healAmount: { 1: 250, 2: 375, 3: 560 },
};

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
