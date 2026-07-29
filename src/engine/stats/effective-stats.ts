import type {
  Magnitude,
  ManaTrigger,
  ModifiableStat,
  Modifier,
  ScalingSource,
} from "../../domain/catalog/modifier";
import type { StarLevel, StarValue } from "../../domain/primitives";
import { resolveScaling, type ResolvedStats } from "./resolved-stats";

export type EffectiveStats = ResolvedStats;

function resolveStarValue(value: StarValue, starLevel: StarLevel): number {
  return typeof value === "number" ? value : resolveScaling(value, starLevel);
}

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
      // Range has no field in the resolved view — it contributes nothing to
      // the basis rather than being an unhandled case.
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

export function resolveSpellMagnitude(
  base: number,
  sources: readonly ScalingSource[] | undefined,
  casterStats: EffectiveStats,
): number {
  return sources === undefined
    ? base
    : base * scalingBasis(sources, casterStats);
}

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
    // No field to land on, so a range stat-mod applies nothing — deliberate,
    // not an unfinished case.
    case "range":
      return stats;
    default: {
      const _exhaustive: never = target;
      return _exhaustive;
    }
  }
}

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

export type ManaGains = Readonly<Record<ManaTrigger, number>>;

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

// Scaled amounts read the pre-fold base, not the running result: passing
// `stats` here would let one modifier scale off another's output.
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
