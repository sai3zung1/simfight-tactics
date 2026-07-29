import type { StarValue } from "../primitives";
import type { BaseStats } from "./base-stats";

export const SCALING_SOURCES = [
  "attackDamage",
  "abilityPower",
  "hp",
  "armor",
  "magicResist",
  "attackSpeed",
  "critChance",
  "critDamage",
  "range",
] as const satisfies readonly (keyof BaseStats)[];
export type ScalingSource = (typeof SCALING_SOURCES)[number];

export const MODIFIABLE_STATS = [
  "attackDamage",
  "abilityPower",
  "hp",
  "armor",
  "magicResist",
  "attackSpeed",
  "critChance",
  "critDamage",
  "range",
  "damageAmp",
  "durability",
] as const satisfies readonly (keyof BaseStats)[];
export type ModifiableStat = (typeof MODIFIABLE_STATS)[number];

export type Magnitude = {
  readonly base: StarValue;
  readonly sources?: readonly ScalingSource[];
};

export type Temporality =
  | { readonly kind: "instant" }
  | { readonly kind: "duration"; readonly seconds: StarValue }
  | {
      readonly kind: "periodic";
      readonly seconds: StarValue;
      readonly interval: number;
      // What one tick leaves behind: `instance` lasts a single interval,
      // `accrual` lasts to the end of combat.
      readonly mode: "instance" | "accrual";
    };

export type DamageType = "physical" | "magic" | "true";

export type ManaTrigger =
  | "on-attack"
  | "per-second"
  | "post-cast"
  | "on-damage-taken";

export type CrowdControl = "silence" | "stun" | "disarm";

export type Modifier =
  | {
      readonly kind: "damage";
      readonly damageType: DamageType;
      readonly amount: Magnitude;
      readonly temporality: Temporality;
    }
  | {
      readonly kind: "heal";
      readonly amount: Magnitude;
      readonly temporality: Temporality;
    }
  | {
      readonly kind: "shield";
      readonly amount: Magnitude;
      readonly temporality: Temporality;
    }
  | {
      readonly kind: "crowd-control";
      readonly cc: CrowdControl;
      readonly temporality: Temporality;
    }
  | {
      readonly kind: "stat-mod";
      readonly target: ModifiableStat;
      readonly amount: Magnitude;
      readonly temporality: Temporality;
    }
  | {
      readonly kind: "damage-reduction";
      readonly amount: Magnitude;
      readonly temporality: Temporality;
    }
  | {
      readonly kind: "mana-generation";
      readonly trigger: ManaTrigger;
      readonly amount: Magnitude;
      readonly temporality: Temporality;
    };
