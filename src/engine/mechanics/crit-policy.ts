export type CritPolicy = (critChance: number, critDamage: number) => number;

// Expected value, not a roll: a hit carries the weighted average of a nominal
// and a critical one.
export const expectedCrit: CritPolicy = (critChance, critDamage) =>
  1 + critChance * critDamage;

export const neverCrit: CritPolicy = () => 1;

export const alwaysCrit: CritPolicy = (_, critDamage) => 1 + critDamage;
