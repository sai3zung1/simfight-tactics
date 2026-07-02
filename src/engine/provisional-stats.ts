import type { BaseStats } from "../domain/catalog/base-stats";
import type { UnitId } from "../domain/primitives";

/**
 * Stand-in combat stats used until the real unit catalog lands (#39). Not
 * real game data — a fixed profile so the combat pipeline (damage, crit,
 * cadence, kill) has something concrete to run against. HP is low enough
 * that a `time_to_kill` run reaches a kill well inside the engine's hard
 * cap.
 */
export const PROVISIONAL_STATS: BaseStats = {
  hp: { 1: 550, 2: 990, 3: 1780 },
  armor: 25,
  magicResist: 25,
  durability: 0,
  mana: { min: 0, start: 0, max: 100 },
  attackDamage: { 1: 55, 2: 90, 3: 150 },
  abilityPower: 0,
  attackSpeed: 0.85,
  critChance: 0.25,
  critDamage: 0.4,
  range: 1,
  damageAmp: 0,
};

/**
 * A second provisional profile, HP high enough to survive hard-cap-long
 * attacks from `PROVISIONAL_STATS` — exists so the `time_to_kill` timeout
 * path is reachable by a real end-to-end test, not just by construction.
 */
export const PROVISIONAL_TANKY_STATS: BaseStats = {
  ...PROVISIONAL_STATS,
  hp: { 1: 100000, 2: 100000, 3: 100000 },
};

/** Selects `PROVISIONAL_TANKY_STATS` when set as a `BoardSide.unitId`. */
export const PROVISIONAL_TANKY_UNIT_ID = "provisional-tanky" as UnitId;

/**
 * Resolve a `BoardSide.unitId` to its provisional profile. Distinguishes
 * exactly these two test-facing profiles, not a real catalog (ADR 0002 —
 * the engine still doesn't know champions) — any other id defaults to the
 * standard profile.
 */
export function resolveUnitStats(unitId: UnitId): BaseStats {
  return unitId === PROVISIONAL_TANKY_UNIT_ID
    ? PROVISIONAL_TANKY_STATS
    : PROVISIONAL_STATS;
}
