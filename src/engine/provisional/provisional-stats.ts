import type { BaseStats } from "../../domain/catalog/base-stats";
import type { UnitId } from "../../domain/primitives";

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

export const PROVISIONAL_TANK_STATS: BaseStats = {
  ...PROVISIONAL_FIGHTER_STATS,
  manaGeneration: { perAttack: 5, perSecond: 0, gainsFromDamageTaken: true },
};

export const PROVISIONAL_DEFENSIVE_CASTER_STATS: BaseStats = {
  ...PROVISIONAL_TANK_STATS,
  hp: { 1: 1600, 2: 1600, 3: 1600 },
};

export const PROVISIONAL_CASTER_STATS: BaseStats = {
  ...PROVISIONAL_FIGHTER_STATS,
  manaGeneration: { perAttack: 7, perSecond: 2, gainsFromDamageTaken: false },
};

export const PROVISIONAL_NO_ATTACK_CASTER_STATS: BaseStats = {
  ...PROVISIONAL_CASTER_STATS,
  attackSpeed: 0,
};

export const PROVISIONAL_NO_MANA_STATS: BaseStats = {
  ...PROVISIONAL_FIGHTER_STATS,
  mana: { min: 0, start: 0, max: 0 },
  manaGeneration: { perAttack: 0, perSecond: 0, gainsFromDamageTaken: false },
};

export const PROVISIONAL_IMMORTAL_STATS: BaseStats = {
  ...PROVISIONAL_FIGHTER_STATS,
  hp: { 1: 100000, 2: 100000, 3: 100000 },
};

export const PROVISIONAL_TANK_UNIT_ID = "provisional-tank" as UnitId;
export const PROVISIONAL_CASTER_UNIT_ID = "provisional-caster" as UnitId;
export const PROVISIONAL_NO_ATTACK_CASTER_UNIT_ID =
  "provisional-no-attack-caster" as UnitId;
export const PROVISIONAL_NO_MANA_UNIT_ID = "provisional-no-mana" as UnitId;
export const PROVISIONAL_IMMORTAL_UNIT_ID = "provisional-immortal" as UnitId;
export const PROVISIONAL_RALLY_CASTER_UNIT_ID =
  "provisional-rally-caster" as UnitId;

export const PROVISIONAL_SHRED_CASTER_UNIT_ID =
  "provisional-shred-caster" as UnitId;
export const PROVISIONAL_AEGIS_CASTER_UNIT_ID =
  "provisional-aegis-caster" as UnitId;
export const PROVISIONAL_MEND_CASTER_UNIT_ID =
  "provisional-mend-caster" as UnitId;

export const PROVISIONAL_SEAR_CASTER_UNIT_ID =
  "provisional-sear-caster" as UnitId;
export const PROVISIONAL_RENEW_CASTER_UNIT_ID =
  "provisional-renew-caster" as UnitId;
export const PROVISIONAL_FRENZY_CASTER_UNIT_ID =
  "provisional-frenzy-caster" as UnitId;

// TODO(#39): replaced by the unit catalog.
export function resolveUnitStats(unitId: UnitId): BaseStats {
  switch (unitId) {
    case PROVISIONAL_TANK_UNIT_ID:
      return PROVISIONAL_TANK_STATS;
    case PROVISIONAL_CASTER_UNIT_ID:
    case PROVISIONAL_RALLY_CASTER_UNIT_ID:
    case PROVISIONAL_SHRED_CASTER_UNIT_ID:
    case PROVISIONAL_FRENZY_CASTER_UNIT_ID:
      return PROVISIONAL_CASTER_STATS;
    case PROVISIONAL_AEGIS_CASTER_UNIT_ID:
    case PROVISIONAL_MEND_CASTER_UNIT_ID:
    case PROVISIONAL_RENEW_CASTER_UNIT_ID:
      return PROVISIONAL_DEFENSIVE_CASTER_STATS;
    case PROVISIONAL_NO_ATTACK_CASTER_UNIT_ID:
    case PROVISIONAL_SEAR_CASTER_UNIT_ID:
      return PROVISIONAL_NO_ATTACK_CASTER_STATS;
    case PROVISIONAL_NO_MANA_UNIT_ID:
      return PROVISIONAL_NO_MANA_STATS;
    case PROVISIONAL_IMMORTAL_UNIT_ID:
      return PROVISIONAL_IMMORTAL_STATS;
    default:
      return PROVISIONAL_FIGHTER_STATS;
  }
}
