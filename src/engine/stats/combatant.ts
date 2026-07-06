import type { BaseStats } from "../../domain/catalog/base-stats";
import type { Modifier } from "../../domain/catalog/modifier";
import type { StarLevel } from "../../domain/primitives";
import type { CombatantId } from "./combatant-id";
import {
  applyModifiers,
  resolveDamageReductions,
  type EffectiveStats,
} from "./effective-stats";
import { resolveStats } from "./resolved-stats";

/**
 * One participant's state for a single running simulation. `stats` is the
 * effective view — neutral base state plus the side's applied modifiers
 * (ADR 0002) — fixed at combat start: nothing creates or removes a modifier
 * mid-run yet (that arrives with casting and crowd-control, #49/#50), so one
 * fold per run, and the fold stays recomputable for when it does.
 * `damageReductions` carries the damage-reduction modifiers resolved to
 * plain amounts, apart from the durability stat because the two stack under
 * different rules (`reductionFactor`). `currentHp` is the one field that
 * changes as the fight plays out.
 */
export type Combatant = {
  readonly id: CombatantId;
  readonly stats: EffectiveStats;
  readonly damageReductions: readonly number[];
  currentHp: number;
};

/**
 * Build a combatant's starting state: effective stats for its star level and
 * applied modifiers, full effective HP.
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
  };
}
