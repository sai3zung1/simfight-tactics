export type CritPolicy = (critChance: number, critDamage: number) => number;

export const expectedCrit: CritPolicy = (critChance, critDamage) =>
  1 + critChance * critDamage;

export const neverCrit: CritPolicy = () => 1;

export const alwaysCrit: CritPolicy = (_, critDamage) => 1 + critDamage;
