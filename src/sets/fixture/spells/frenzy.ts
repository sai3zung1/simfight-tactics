import type { SpellId } from "../../../domain/primitives";
import type { SpellParameters } from "../../../domain/catalog/spell";
import type { SpellFn } from "../../../engine/spell/contract";

export const FIXTURE_FRENZY_SPELL_ID = "fixture-frenzy" as SpellId;

export const FIXTURE_FRENZY_PARAMETERS: SpellParameters = {
  tickAttackSpeed: { 1: 0.06, 2: 0.09, 3: 0.14 },
  windowSeconds: 5,
  intervalSeconds: 1,
};

export const frenzy: SpellFn = (_ctx, params) => [
  {
    recipient: "self",
    modifier: {
      kind: "stat-mod",
      target: "attackSpeed",
      amount: { base: params.tickAttackSpeed },
      temporality: {
        kind: "periodic",
        seconds: params.windowSeconds,
        interval: params.intervalSeconds,
        mode: "accrual",
      },
    },
  },
];
