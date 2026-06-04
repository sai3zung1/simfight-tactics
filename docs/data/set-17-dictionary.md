# Set 17 — Data Dictionary

> Canonical census and effect vocabularies for the Set 17 dataset. Companion to
> the data in `data/set-17/`.

## Canonical counts

Validated 2026-05-18.

| Category  | Total | Breakdown                                                                             |
| --------- | ----- | ------------------------------------------------------------------------------------- |
| Champions | 63    | 14·1c + 13·2c + 13·3c + 14·4c + 9·5c                                                  |
| Traits    | 42    | 30 origins + 12 classes                                                               |
| Items     | 182   | 10 component + 39 craftable + 19 emblems + 39 radiant + 39 artifacts + 36 trait items |
| Augments  | 263   | 70 silver + 122 gold + 71 prismatic                                                   |
| Gods      | 9     | Set-specific mechanic                                                                 |

## Active vocabularies

Extended as new champions are integrated.

**`type`**: physicalDamage, magicDamage, healing, shielding, duration, range,
count, probability, attackSpeedPct, damageAmpPct, maxHealthGain, defenseBonus,
hpThresholdPct, armorReduction, damageReduction, damageReductionPct, durability,
healingAmpPct

**`initiator`**: caster, passive, onAttack, traitProc, onTakedown, onCombatStart

**`target`**: self, primary, allEnemies, adjacentEnemies, alliesInRange,
lowestHPEnemy, highestHPEnemy, subsequentTargets, farthestEnemy, nearestEnemy,
rowEnemies, nearestEnemies

**`description` coloring tags**: `<physicalDamage>`, `<magicDamage>`,
`<trueDamage>`, `<healing>`, `<shielding>`, `<TFTBonus>`, `<status>`
