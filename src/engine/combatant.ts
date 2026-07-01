import type { BaseStats } from "../domain/catalog/base-stats";
import type { StarLevel } from "../domain/primitives";
import type { CombatantId } from "./combatant-id";
import { resolveStats, type ResolvedStats } from "./resolved-stats";

/**
 * One participant's state for a single running simulation. `stats` is the
 * neutral base state fixed at combat start (ADR 0002) — `currentHp` is the
 * one field that changes as the fight plays out.
 */
export type Combatant = {
  readonly id: CombatantId;
  readonly stats: ResolvedStats;
  currentHp: number;
};

/** Build a combatant's starting state: stats resolved for its star level, full HP. */
export function resolveCombatant(
  stats: BaseStats,
  starLevel: StarLevel,
  id: CombatantId,
): Combatant {
  const resolved = resolveStats(stats, starLevel);
  return {
    id,
    stats: resolved,
    currentHp: resolved.hp,
  };
}
