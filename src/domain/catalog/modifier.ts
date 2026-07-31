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
  "omnivamp",
] as const satisfies readonly (keyof BaseStats)[];
export type ModifiableStat = (typeof MODIFIABLE_STATS)[number];

export type Magnitude = {
  readonly base: StarValue;
  readonly sources?: readonly ScalingSource[];
};

export type Instant = { readonly kind: "instant" };

export type Duration = {
  readonly kind: "duration";
  readonly seconds: StarValue;
};

export type Periodic = {
  readonly kind: "periodic";
  readonly seconds: StarValue;
  readonly interval: number;
  // What one tick leaves behind: `instance` lasts a single interval,
  // `accrual` lasts to the end of combat.
  readonly mode: "instance" | "accrual";
};

export type Temporality = Instant | Duration | Periodic;

export type DamageType = "physical" | "magic" | "true";

export type ManaTrigger =
  | "on-attack"
  | "per-second"
  | "post-cast"
  | "on-damage-taken";

export type CrowdControl = "silence" | "stun" | "disarm";

export type Modifier =
  // A hit or a heal lands and is done — nothing for an expiry to undo — so
  // over-time versions are periodic, never duration.
  | {
      readonly kind: "damage";
      readonly damageType: DamageType;
      readonly amount: Magnitude;
      readonly temporality: Instant | Periodic;
    }
  | {
      readonly kind: "heal";
      readonly amount: Magnitude;
      readonly temporality: Instant | Periodic;
    }
  | {
      readonly kind: "shield";
      readonly amount: Magnitude;
      readonly temporality: Temporality;
    }
  // A crowd-control has to be lifted, so it always carries a duration; a
  // periodic recurrence has no per-tick duration to give each application, so
  // a recurring-cc kit would extend the taxonomy instead (#73).
  | {
      readonly kind: "crowd-control";
      readonly cc: CrowdControl;
      readonly temporality: Duration;
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
