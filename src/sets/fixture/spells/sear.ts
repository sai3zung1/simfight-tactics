import type { SpellId } from "../../../domain/primitives";
import type { SpellParameters } from "../../../domain/catalog/spell";
import type { SpellFn } from "../../../engine/spell/contract";

export const FIXTURE_SEAR_SPELL_ID = "fixture-sear" as SpellId;

export const FIXTURE_SEAR_PARAMETERS: SpellParameters = {
  tickDamage: { 1: 60, 2: 90, 3: 135 },
  windowSeconds: 4,
  intervalSeconds: 1,
};

export const sear: SpellFn = (_ctx, params) => [
  {
    recipient: "opponent",
    modifier: {
      kind: "damage",
      damageType: "magic",
      amount: { base: params.tickDamage, sources: ["abilityPower"] },
      temporality: {
        kind: "periodic",
        seconds: params.windowSeconds,
        interval: params.intervalSeconds,
        mode: "instance",
      },
    },
  },
];
