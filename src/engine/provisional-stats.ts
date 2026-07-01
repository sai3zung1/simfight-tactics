import type { BaseStats } from "../domain/catalog/base-stats";

/**
 * Stand-in combat stats used until the real catalog composition lands (#39,
 * blocked, wired later via engine fixtures). Not real game data — a fixed
 * profile so #47's own pipeline (damage, crit, cadence, kill) has something
 * concrete to run against. Every unit resolves to this regardless of
 * `unitId`: the engine doesn't distinguish champions (ADR 0002), so this
 * placeholder doesn't need to either. HP is low enough that a `time_to_kill`
 * run reaches a kill well inside the 60s hard cap.
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
