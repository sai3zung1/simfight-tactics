import type { BaseStats } from "../../domain/catalog/base-stats";
import type { Modifier } from "../../domain/catalog/modifier";
import type { StarLevel } from "../../domain/primitives";
import type { Ticks } from "../loop/time";
import type { CombatantId } from "./combatant-id";
import {
  applyModifiers,
  resolveDamageReductions,
  type EffectiveStats,
} from "./effective-stats";
import { resolveStats } from "./resolved-stats";

/**
 * One participant's state while a simulation runs: identity, the stats the
 * loop reads, and the values the fight changes as it plays out.
 */
export type Combatant = {
  readonly id: CombatantId;
  /**
   * Computed once at combat start; effective-stats.ts owns the how and
   * why. The active modifier set cannot change mid-run yet. When spell
   * effects and crowd-control (#50) bring that, the computation simply
   * runs again.
   */
  readonly stats: EffectiveStats;
  /**
   * Damage-reduction amounts kept apart from the `durability` stat: the two
   * shrink damage under different stacking rules (`reductionFactor`).
   */
  readonly damageReductions: readonly number[];
  currentHp: number;
  /** Gauge toward the cast threshold (`stats.mana.max`). */
  currentMana: number;
  /** Tick until which mana generation stays blocked after a cast; 0 = open. */
  manaLockedUntil: Ticks;
};

/**
 * Build a combatant's starting state: stats resolved and modifiers
 * applied, full HP, mana at its starting value, generation lock open.
 */
export function resolveCombatant(
  stats: BaseStats,
  starLevel: StarLevel,
  id: CombatantId,
  modifiers: readonly Modifier[],
): Combatant {
  const resolved = resolveStats(stats, starLevel);
  const effective = applyModifiers(resolved, modifiers, starLevel);
  return {
    id,
    stats: effective,
    damageReductions: resolveDamageReductions(modifiers, starLevel, resolved),
    currentHp: effective.hp,
    currentMana: effective.mana.start,
    manaLockedUntil: 0 as Ticks,
  };
}
