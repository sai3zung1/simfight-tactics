import type { BaseStats } from "../../domain/catalog/base-stats";

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
  omnivamp: 0,
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
