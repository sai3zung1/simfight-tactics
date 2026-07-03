import type { ScalingByStar } from "../primitives";
import type { BaseStats } from "./base-stats";

/**
 * Stats a modifier value can scale from — a curated subset of `BaseStats` keys
 * (the sources observed in the modifier cartography,
 * docs/data/modifier-archetypes.md).
 * The `satisfies` anchors every member to a real stat: a typo or a renamed stat
 * breaks here.
 */
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

/** Stats a `stat-mod` can change — a curated subset of `BaseStats` keys. */
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

/** A value that is flat, or varies per star level. */
export type StarValue = number | ScalingByStar;

/**
 * How much a modifier applies. `base` alone is a flat, normalized amount.
 * With `sources`, `base` becomes a ratio multiplying the summed source
 * stats — the game's way of expressing "a share of a stat"
 * (docs/data/modifier-archetypes.md, "Scaling: where the truth lives").
 */
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
      /** Seconds between two ticks of the effect. */
      readonly interval: number;
    };

export type DamageType = "physical" | "magic" | "true";

export type CrowdControl = "silence" | "stun" | "disarm" | "fear";

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
      readonly amount: Magnitude;
      readonly temporality: Temporality;
    };
