import type { BaseStats } from "../../domain/catalog/base-stats";
import type { UnitId } from "../../domain/primitives";

/**
 * Stand-in combat stats used until the real unit catalog lands (#39). Not
 * real game data — fixed profiles so the combat pipeline (damage, crit,
 * cadence, kill, mana) has something concrete to run against. One profile
 * per mana-generation shape of the role system
 * (docs/data/combat-resolution.md); combat stats stay identical across the
 * mana profiles on purpose, so comparing two profiles isolates the mana
 * axis. The no-attack caster is the one deliberate exception: bidirectional
 * combat made every attacking profile feed its own gauge per swing, so
 * observing the steady flow alone requires a profile that never swings.
 * HP is low enough that a `time-to-kill` run reaches a kill well
 * inside the engine's hard cap.
 */
export const PROVISIONAL_FIGHTER_STATS: BaseStats = {
  hp: { 1: 550, 2: 990, 3: 1780 },
  armor: 25,
  magicResist: 25,
  durability: 0,
  mana: { min: 0, start: 0, max: 100 },
  manaGeneration: { perAttack: 10, perSecond: 0, gainsFromDamageTaken: false },
  attackDamage: { 1: 55, 2: 90, 3: 150 },
  abilityPower: 1,
  attackSpeed: 0.85,
  critChance: 0.25,
  critDamage: 0.4,
  range: 1,
  damageAmp: 0,
};

/** Tank-shaped mana profile: the only one that gains from damage taken. */
export const PROVISIONAL_TANK_STATS: BaseStats = {
  ...PROVISIONAL_FIGHTER_STATS,
  manaGeneration: { perAttack: 5, perSecond: 0, gainsFromDamageTaken: true },
};

/**
 * Durable tank-shaped profile for the defensive-kit demonstrators (aegis, mend):
 * HP high enough that the mortal target survives to fill its gauge from the hits
 * it takes and cast its defensive spell, so a `time-to-kill` run shows the kill
 * landing later once the shield or heal is on. Fills from damage taken, like the
 * tank.
 */
export const PROVISIONAL_DEFENSIVE_CASTER_STATS: BaseStats = {
  ...PROVISIONAL_TANK_STATS,
  hp: { 1: 1600, 2: 1600, 3: 1600 },
};

/** Caster-shaped mana profile: the only one with a steady per-second flow. */
export const PROVISIONAL_CASTER_STATS: BaseStats = {
  ...PROVISIONAL_FIGHTER_STATS,
  manaGeneration: { perAttack: 7, perSecond: 2, gainsFromDamageTaken: false },
};

/**
 * Caster-shaped profile that never attacks (`attackSpeed` 0 is filtered by
 * `shouldAutoAttack`): isolates the steady per-second flow from the
 * per-swing gains every attacking profile generates.
 */
export const PROVISIONAL_NO_ATTACK_CASTER_STATS: BaseStats = {
  ...PROVISIONAL_CASTER_STATS,
  attackSpeed: 0,
};

/**
 * Specialist-shaped profile: no mana bar (`max` 0), so it never casts.
 * Deliberately generic — real Specialists carry per-unit resource
 * mechanics, modeled only when a set brings them.
 */
export const PROVISIONAL_NO_MANA_STATS: BaseStats = {
  ...PROVISIONAL_FIGHTER_STATS,
  mana: { min: 0, start: 0, max: 0 },
  manaGeneration: { perAttack: 0, perSecond: 0, gainsFromDamageTaken: false },
};

/**
 * HP high enough to survive hard-cap-long attacks from any other profile —
 * exists so the `time-to-kill` timeout path is reachable by a real
 * end-to-end test, not just by construction.
 */
export const PROVISIONAL_IMMORTAL_STATS: BaseStats = {
  ...PROVISIONAL_FIGHTER_STATS,
  hp: { 1: 100000, 2: 100000, 3: 100000 },
};

/** Ids selecting each non-default profile as a `BoardSide.unitId`. */
export const PROVISIONAL_TANK_UNIT_ID = "provisional-tank" as UnitId;
export const PROVISIONAL_CASTER_UNIT_ID = "provisional-caster" as UnitId;
export const PROVISIONAL_NO_ATTACK_CASTER_UNIT_ID =
  "provisional-no-attack-caster" as UnitId;
export const PROVISIONAL_NO_MANA_UNIT_ID = "provisional-no-mana" as UnitId;
export const PROVISIONAL_IMMORTAL_UNIT_ID = "provisional-immortal" as UnitId;
/**
 * A caster-shaped profile carrying the `rally` self-buff instead of `burst`
 * (wired in provisional-spell.ts): it auto-attacks, so a mid-run attack-damage
 * buff is observable in the damage it deals (#70's demonstrator).
 */
export const PROVISIONAL_RALLY_CASTER_UNIT_ID =
  "provisional-rally-caster" as UnitId;

/**
 * Three caster-shaped profiles carrying #71's stat-mod kits (wired in
 * provisional-spell.ts), each a one-capacity demonstrator: `shred` debuffs the
 * opponent's armor so the caster's own hits land harder, `aegis` shields the
 * caster so a kill takes longer, `mend` heals the caster so it survives longer.
 */
export const PROVISIONAL_SHRED_CASTER_UNIT_ID =
  "provisional-shred-caster" as UnitId;
export const PROVISIONAL_AEGIS_CASTER_UNIT_ID =
  "provisional-aegis-caster" as UnitId;
export const PROVISIONAL_MEND_CASTER_UNIT_ID =
  "provisional-mend-caster" as UnitId;

/**
 * Resolve a `BoardSide.unitId` to its provisional profile. Distinguishes
 * exactly these test-facing profiles, not a real catalog (ADR 0002 — the
 * engine still doesn't know champions) — any other id defaults to the
 * fighter profile.
 */
export function resolveUnitStats(unitId: UnitId): BaseStats {
  switch (unitId) {
    case PROVISIONAL_TANK_UNIT_ID:
      return PROVISIONAL_TANK_STATS;
    case PROVISIONAL_CASTER_UNIT_ID:
    case PROVISIONAL_RALLY_CASTER_UNIT_ID:
    case PROVISIONAL_SHRED_CASTER_UNIT_ID:
      return PROVISIONAL_CASTER_STATS;
    case PROVISIONAL_AEGIS_CASTER_UNIT_ID:
    case PROVISIONAL_MEND_CASTER_UNIT_ID:
      // Durable and damage-taken-fed, so the mortal target survives long enough
      // to fill its gauge and cast its defensive kit before a kill lands.
      return PROVISIONAL_DEFENSIVE_CASTER_STATS;
    case PROVISIONAL_NO_ATTACK_CASTER_UNIT_ID:
      return PROVISIONAL_NO_ATTACK_CASTER_STATS;
    case PROVISIONAL_NO_MANA_UNIT_ID:
      return PROVISIONAL_NO_MANA_STATS;
    case PROVISIONAL_IMMORTAL_UNIT_ID:
      return PROVISIONAL_IMMORTAL_STATS;
    default:
      return PROVISIONAL_FIGHTER_STATS;
  }
}
