import type { SpellId } from "../../../domain/primitives";
import type { SpellParameters } from "../../../domain/catalog/spell";
import type { SpellFn } from "../../../engine/spell/contract";

export const FIXTURE_RALLY_SPELL_ID = "fixture-rally" as SpellId;

export const FIXTURE_RALLY_PARAMETERS: SpellParameters = {
  bonusAttackDamage: { 1: 40, 2: 60, 3: 90 },
  durationSeconds: 4,
};

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
