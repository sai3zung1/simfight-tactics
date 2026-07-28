import type { SpellId } from "../../../domain/primitives";
import type { SpellParameters } from "../../../domain/catalog/spell";
import type { SpellFn } from "../../../engine/spell/contract";

export const FIXTURE_RENEW_SPELL_ID = "fixture-renew" as SpellId;

export const FIXTURE_RENEW_PARAMETERS: SpellParameters = {
  tickHeal: { 1: 70, 2: 105, 3: 160 },
  windowSeconds: 3,
  intervalSeconds: 1,
};

export const renew: SpellFn = (_ctx, params) => [
  {
    recipient: "self",
    modifier: {
      kind: "heal",
      amount: { base: params.tickHeal },
      temporality: {
        kind: "periodic",
        seconds: params.windowSeconds,
        interval: params.intervalSeconds,
        mode: "instance",
      },
    },
  },
];
