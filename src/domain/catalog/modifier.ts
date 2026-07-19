import type { StarValue } from "../primitives";
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

/** How long a modifier's effect lives once it applies. */
export type Temporality =
  | { readonly kind: "instant" }
  | { readonly kind: "duration"; readonly seconds: StarValue }
  | {
      readonly kind: "periodic";
      /** Total window the effect repeats over, from its application. */
      readonly seconds: StarValue;
      /** Seconds between two ticks of the effect. */
      readonly interval: number;
      /**
       * What one tick leaves behind. `instance`: the residue lives exactly one
       * interval — gone at the next tick's boundary (a pulsing buff or
       * shield). `accrual`: the residue never expires — ticks stack for the
       * rest of combat (a ramping steroid). Kinds without residue (damage,
       * heal) consume the tick on the spot, so both modes read the same for
       * them; authors declare `instance` by convention. Required rather than
       * defaulted: the two behaviors diverge too much to guess silently.
       */
      readonly mode: "instance" | "accrual";
    };

export type DamageType = "physical" | "magic" | "true";

/**
 * The holder event that fires a mana gain. The trigger says what fires a
 * gain; `Temporality` says how long the granting effect lives.
 *
 * A spell refunding its own caster never comes through modifiers (spell
 * effects live in hand-written spell functions), so "post-cast" always
 * means an equipped source reacting to the holder's finished cast.
 */
export type ManaTrigger =
  | "on-attack"
  | "per-second"
  | "post-cast"
  | "on-damage-taken";

/**
 * Fear and root are out of scope: both need a notion of position/movement
 * this engine does not model (a static 1v1 duel, no space dimension).
 * Revisit only if the engine ever models unit positioning — nothing on the
 * board plans that today (#50).
 */
export type CrowdControl = "silence" | "stun" | "disarm";

/**
 * The engine's whole vocabulary of combat effects: every item, trait,
 * augment or spell effect is expressed as one of these kinds, applied to a
 * neutral base state (ADR 0002). One kind per resolution pipeline; the set
 * is frozen by ADR 0004 and only grows when real data presents an effect
 * it cannot express.
 */
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
      /**
       * Only `duration` is meaningful here. An `instant` crowd-control has no
       * length to take away, and a `periodic` one is inexpressible: the
       * periodic arm carries no per-tick duration, so nothing could say how
       * long each recurring stun lasts — an `instance` residue of one full
       * interval would mean a permanent lock. Excluded until a real kit
       * presents recurring crowd-control (#73 extends the taxonomy then);
       * delivery and scheduling treat both as loud author bugs, never silent
       * skips.
       */
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
