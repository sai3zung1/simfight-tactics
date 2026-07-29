import type { SpellId } from "../../../domain/primitives";
import type { SpellParameters } from "../../../domain/catalog/spell";
import type { SpellFn } from "../../../engine/spell/contract";

export const FIXTURE_BURST_SPELL_ID = "fixture-burst" as SpellId;

export const FIXTURE_BURST_PARAMETERS: SpellParameters = {
  baseDamage: { 1: 230, 2: 345, 3: 520 },
};

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
