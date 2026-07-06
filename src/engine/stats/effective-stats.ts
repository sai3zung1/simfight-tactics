import type {
  Magnitude,
  ModifiableStat,
  Modifier,
  ScalingSource,
  StarValue,
} from "../../domain/catalog/modifier";
import type { StarLevel } from "../../domain/primitives";
import { resolveScaling, type ResolvedStats } from "./resolved-stats";

/**
 * EffectiveStats — the only stats view the loop reads: the star-resolved base
 * with the active modifiers folded in (ADR 0002: neutral base state plus
 * applied modifiers). A derived view, never a source of truth — recomputable
 * from (base, active set) at any moment. Structurally the base view today;
 * the distinct name keeps pre-fold and post-fold values apart in signatures.
 */
export type EffectiveStats = ResolvedStats;

/** A modifier value: flat, or one number per star level. */
function resolveStarValue(value: StarValue, starLevel: StarLevel): number {
  return typeof value === "number" ? value : resolveScaling(value, starLevel);
}

/**
 * Sum of the stats a magnitude scales from, read on the pre-fold base — a
 * scaled amount never sees another modifier's output, so application order
 * cannot matter. Several sources sum; that is the natural reading of the
 * taxonomy, not a sourced game rule — revisit if calibration (#51) proves
 * otherwise. `abilityPower` and `range` have no resolved field to read yet
 * and contribute zero, explicitly — the ticket that carries them adds the
 * read. A new `ScalingSource` is a compile break here.
 */
function scalingBasis(
  sources: readonly ScalingSource[],
  base: ResolvedStats,
): number {
  let sum = 0;
  for (const source of sources) {
    switch (source) {
      case "hp":
        sum += base.hp;
        break;
      case "armor":
        sum += base.armor;
        break;
      case "magicResist":
        sum += base.magicResist;
        break;
      case "attackDamage":
        sum += base.attackDamage;
        break;
      case "attackSpeed":
        sum += base.attackSpeed;
        break;
      case "critChance":
        sum += base.critChance;
        break;
      case "critDamage":
        sum += base.critDamage;
        break;
      case "abilityPower":
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
 * Land one stat-mod on its effective field. `abilityPower` and `range` have
 * no landing field yet: the loop doesn't read them, so they skip explicitly —
 * the ticket that reads them adds the field. A new `ModifiableStat` is a
 * compile break here, never a silent no-op.
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
    case "attackSpeed":
      return { ...stats, attackSpeed: stats.attackSpeed + amount };
    case "critChance":
      return { ...stats, critChance: stats.critChance + amount };
    case "critDamage":
      return { ...stats, critDamage: stats.critDamage + amount };
    case "damageAmp":
      return { ...stats, damageAmp: stats.damageAmp + amount };
    case "abilityPower":
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
 * resolution).
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
 * Fold the active modifiers into the base view — one pass, pure. Only
 * `stat-mod` lands here: every other kind is resolved by its own pipeline
 * (damage-reduction in damage resolution; mana-generation, crowd-control and
 * the damage/heal/shield of spells by pipelines still to come, #49/#50),
 * never by stat folding. The exhaustive switch makes a future kind a compile
 * break, not a silent skip.
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
