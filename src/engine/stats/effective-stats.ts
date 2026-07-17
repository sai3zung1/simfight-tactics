import type {
  Magnitude,
  ManaTrigger,
  ModifiableStat,
  Modifier,
  ScalingSource,
} from "../../domain/catalog/modifier";
import type { StarLevel, StarValue } from "../../domain/primitives";
import { resolveScaling, type ResolvedStats } from "./resolved-stats";

/**
 * A unit's stats once the active modifiers are applied — the view the
 * combat loop reads (ADR 0002: every effect is a modifier applied to a
 * neutral base state). Comments in this file call that one-pass
 * application "the fold".
 *
 * Second of the two stat views: same shape as `ResolvedStats`
 * (resolved-stats.ts), distinct name so a signature declares "modifiers
 * already applied". This is a derived view: when the active set changes,
 * recompute it. Nothing edits it in place.
 */
export type EffectiveStats = ResolvedStats;

/** A modifier value: flat, or one number per star level. */
function resolveStarValue(value: StarValue, starLevel: StarLevel): number {
  return typeof value === "number" ? value : resolveScaling(value, starLevel);
}

/**
 * Sum of the stats a magnitude scales from, read on the view the caller
 * passes: the combat-start fold reads the pre-fold base — a scaled amount
 * never sees another modifier's output, so application order cannot
 * matter — while a cast-time resolution (`resolveSpellMagnitude`) reads the
 * caster's effective view, where the fold is long settled. Several sources
 * sum; that is the natural reading of the taxonomy, not a sourced game
 * rule — revisit if spell calibration (#74) proves otherwise. `range` has
 * no resolved field and contributes zero, explicitly — the first composed
 * kit that scales from it adds the read (#96 holds the trigger). A new
 * `ScalingSource` is a compile break here.
 */
function scalingBasis(
  sources: readonly ScalingSource[],
  stats: ResolvedStats,
): number {
  let sum = 0;
  for (const source of sources) {
    switch (source) {
      case "hp":
        sum += stats.hp;
        break;
      case "armor":
        sum += stats.armor;
        break;
      case "magicResist":
        sum += stats.magicResist;
        break;
      case "attackDamage":
        sum += stats.attackDamage;
        break;
      case "abilityPower":
        sum += stats.abilityPower;
        break;
      case "attackSpeed":
        sum += stats.attackSpeed;
        break;
      case "critChance":
        sum += stats.critChance;
        break;
      case "critDamage":
        sum += stats.critDamage;
        break;
      case "range":
        break;
      default: {
        const _exhaustive: never = source;
        return _exhaustive;
      }
    }
  }
  return sum;
}

/**
 * A spell effect's concrete amount, resolved at cast time against the
 * caster's effective stats — the fold is settled by then, so an
 * ability-power item moves the spell, unlike the combat-start fold which
 * reads pre-fold values. The base is a plain number by contract: a spell's
 * per-star values are collapsed into the caster's parameters at combat
 * setup, so nothing at cast time ever resolves a star
 * (engine/spell/apply-effects.ts guards that contract).
 */
export function resolveSpellMagnitude(
  base: number,
  sources: readonly ScalingSource[] | undefined,
  casterStats: EffectiveStats,
): number {
  return sources === undefined
    ? base
    : base * scalingBasis(sources, casterStats);
}

/**
 * A magnitude's concrete value for one star level: the flat normalized
 * `base` (units are the adapter's job, ADR 0005), multiplied by the summed
 * source stats when the amount is stat-scaled — `{ base: 0.10, sources:
 * ["attackSpeed"] }` reads as one tenth of the wearer's attack speed.
 */
function resolveMagnitude(
  amount: Magnitude,
  starLevel: StarLevel,
  base: ResolvedStats,
): number {
  const value = resolveStarValue(amount.base, starLevel);
  return amount.sources === undefined
    ? value
    : value * scalingBasis(amount.sources, base);
}

/**
 * Land one stat-mod on its effective field. `range` has no landing field
 * yet: the loop doesn't read it, so it skips explicitly — the first
 * composed kit that reads it adds the field (#96 holds the trigger). A new
 * `ModifiableStat` is a compile break here, never a silent no-op.
 */
function applyStatMod(
  stats: EffectiveStats,
  target: ModifiableStat,
  amount: number,
): EffectiveStats {
  switch (target) {
    case "hp":
      return { ...stats, hp: stats.hp + amount };
    case "armor":
      return { ...stats, armor: stats.armor + amount };
    case "magicResist":
      return { ...stats, magicResist: stats.magicResist + amount };
    case "durability":
      return { ...stats, durability: stats.durability + amount };
    case "attackDamage":
      return { ...stats, attackDamage: stats.attackDamage + amount };
    case "abilityPower":
      return { ...stats, abilityPower: stats.abilityPower + amount };
    case "attackSpeed":
      return { ...stats, attackSpeed: stats.attackSpeed + amount };
    case "critChance":
      return { ...stats, critChance: stats.critChance + amount };
    case "critDamage":
      return { ...stats, critDamage: stats.critDamage + amount };
    case "damageAmp":
      return { ...stats, damageAmp: stats.damageAmp + amount };
    case "range":
      return stats;
    default: {
      const _exhaustive: never = target;
      return _exhaustive;
    }
  }
}

/**
 * Each `damage-reduction` modifier resolved to its plain amount, one entry
 * per source. Deliberately kept apart from the durability stat: the two
 * reduce damage under different stacking rules (`reductionFactor` in damage
 * resolution). `Temporality` is not read here: a timed reduction's lifetime is
 * the timed-modifier machinery's job — the entry expires and the caller refolds
 * (#70/#71) — so this pass only resolves the amount, identically for a permanent
 * item modifier and a spell's timed reduction.
 */
export function resolveDamageReductions(
  modifiers: readonly Modifier[],
  starLevel: StarLevel,
  base: ResolvedStats,
): readonly number[] {
  const reductions: number[] = [];
  for (const modifier of modifiers) {
    if (modifier.kind === "damage-reduction") {
      reductions.push(resolveMagnitude(modifier.amount, starLevel, base));
    }
  }
  return reductions;
}

/**
 * One resolved amount per mana trigger. Built once at combat start; the
 * mana pipeline (mechanics/mana.ts) reads the bucket matching the event it
 * processes. The `Record` is exhaustive by construction: a new
 * `ManaTrigger` breaks compilation here, never a silent zero.
 */
export type ManaGains = Readonly<Record<ManaTrigger, number>>;

/**
 * Each `mana-generation` modifier resolved to its plain amount and
 * bucketed by trigger — the same one-pass resolution as
 * `resolveDamageReductions`. `Temporality` is not read here: a timed gain's
 * lifetime is the timed-modifier machinery's job (the entry expires and the
 * caller refolds, #70/#71), so this pass only resolves and buckets the amount.
 */
export function resolveManaGains(
  modifiers: readonly Modifier[],
  starLevel: StarLevel,
  base: ResolvedStats,
): ManaGains {
  const gains: Record<ManaTrigger, number> = {
    "on-attack": 0,
    "per-second": 0,
    "post-cast": 0,
    "on-damage-taken": 0,
  };
  for (const modifier of modifiers) {
    if (modifier.kind === "mana-generation") {
      gains[modifier.trigger] += resolveMagnitude(
        modifier.amount,
        starLevel,
        base,
      );
    }
  }
  return gains;
}

/**
 * Fold the active modifiers into the base view — one pass, pure. Only
 * `stat-mod` lands here: every other kind is resolved by its own pipeline
 * (damage-reduction in damage resolution, mana-generation in the mana
 * pipeline via `resolveManaGains`, spell-emitted damage and crowd-control
 * in cast delivery — engine/spell/apply-effects.ts; heal and shield with
 * #71), never by stat folding. The exhaustive switch makes a future kind a
 * compile break, not a silent skip.
 */
export function applyModifiers(
  base: ResolvedStats,
  modifiers: readonly Modifier[],
  starLevel: StarLevel,
): EffectiveStats {
  let stats: EffectiveStats = base;
  for (const modifier of modifiers) {
    switch (modifier.kind) {
      case "stat-mod":
        stats = applyStatMod(
          stats,
          modifier.target,
          resolveMagnitude(modifier.amount, starLevel, base),
        );
        break;
      case "damage":
      case "heal":
      case "shield":
      case "crowd-control":
      case "damage-reduction":
      case "mana-generation":
        break;
      default: {
        const _exhaustive: never = modifier;
        return _exhaustive;
      }
    }
  }
  return stats;
}
