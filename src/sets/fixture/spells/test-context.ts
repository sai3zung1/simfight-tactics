import type {
  CombatantView,
  SpellContext,
} from "../../../engine/spell/contract";

// One ordinary caster on both sides: every spell test reads the same baseline,
// so a stat added to the schema lands here once instead of once per test.
const stats: CombatantView["stats"] = {
  hp: 1000,
  armor: 25,
  magicResist: 25,
  durability: 0,
  mana: { min: 0, start: 0, max: 100 },
  manaGeneration: { perAttack: 7, perSecond: 2, gainsFromDamageTaken: false },
  attackDamage: 55,
  abilityPower: 1,
  attackSpeed: 0.85,
  critChance: 0.25,
  critDamage: 0.4,
  damageAmp: 0,
  omnivamp: 0,
};

export const ctx = (): SpellContext => ({
  caster: { stats, hp: { current: 1000, max: 1000 } },
  opponent: { stats, hp: { current: 1000, max: 1000 } },
});
