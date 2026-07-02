import type {
  Magnitude,
  ModifiableStat,
  Modifier,
  StarValue,
} from "../domain/catalog/modifier";
import type { StarLevel } from "../domain/primitives";
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
 * A magnitude's concrete value for one star level — the flat normalized
 * `base` (units are the adapter's job, ADR 0005). The stat-scaled part
 * (`sources`) lands in the next slice.
 */
function resolveMagnitude(amount: Magnitude, starLevel: StarLevel): number {
  return resolveStarValue(amount.base, starLevel);
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
 * Fold the active modifiers into the base view — one pass, pure. Only
 * `stat-mod` lands here: every other kind is resolved by its own pipeline
 * (damage-reduction in damage resolution, mana-generation in #49,
 * crowd-control in #50, damage/heal/shield by spell effects), never by stat
 * folding. The exhaustive switch makes a future kind a compile break, not a
 * silent skip.
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
          resolveMagnitude(modifier.amount, starLevel),
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
