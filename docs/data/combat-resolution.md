# Combat resolution mechanics (research note)

**Status:** Research note · 2026-06 · input to the engine and its calibration;
companion to [ADR 0004](../adr/0004-modifier-taxonomy-resolution.md).

> ADR 0004 fixes the per-kind pipeline shapes. This note records the mechanics
> and coefficients behind them, each with its source and confidence. Numeric
> values are patch-sensitive and are confirmed by calibration against the live
> game; the structural findings come from the game data directly.

## Mitigation (damage)

- Damage-taken multiplier: `100 / (100 + resist)`, identical for armor and magic
  resist.
- Armor and magic resist floor at 0; reduced to 0 is effectively true damage.
- Resist reduction (shred, sunder) is ~30% and does not stack with itself.

> **Example** — a 200-damage physical hit (the `100` is a fixed game constant;
> more armor means less damage taken):
>
> - target armor 50: `200 × 100/(100+50)` = **133 taken**
> - after a 30% armor shred (50 → 35): `200 × 100/(100+35)` = **148 taken**

Source: community references. Confirm at calibration.

## Mana generation

- Per attack, flat by role: 10 (assassin, marksman, fighter), 7 (caster), 5
  (tank).
- From damage taken: 1% of pre-mitigation plus 7% of post-mitigation, capped
  ~42.5 per source.

> **Example** — a caster (7 mana per attack) takes a 200 hit, reduced to 100 by
> mitigation:
>
> - from the hit: `1%×200 + 7%×100` = **+9 mana** (1% of pre-, 7% of
>   post-mitigation)
> - from its next attack: **+7 mana**

Source: community references; patch-sensitive. Confirm at calibration.

## Critical strike

- Base 25% chance, +30% bonus critical damage; multiplies the damage instance.

> **Example** — a 1000-damage hit that crits: `1000 × 1.30` = **1300 dealt**
> (1.30 = 1 + the 30% bonus crit damage).

Source: community references. Confirm at calibration.

## Scaling formula (from the game data)

The `@ModifiedX@` displayed in an ability is a `GameCalculation`: a sum of
subparts.

- `StatByCoefficientCalculationPart` — a unit stat × a multiplier (`mStat` =
  which stat, `mCoefficient` = the multiplier).
- `SubPartScaledProportionalToStat` — a named value scaled to a stat
  (`mDataValue` = the value, e.g. an AP ratio; `mRatio` ≈ 0.01).
- The scaling stat is named by the description's `%i:scaleY%` tag (via
  `mStyleTagIfScaled`).

Location: the TFT map bin (`map22.bin.json`) holds shared calculations;
per-champion calculations are reached through `__linked` references. The `mStat`
enum is partly decoded — `mStat=2` appears in the basic-attack calculation with
coefficient 1, consistent with attack damage.

> **Example** — an ability's `@ModifiedDamage@` is a calculation that sums two
> parts (`%i:scaleAP%` in the text flags the scaled one):
>
> - **base part** — a unit stat × a multiplier, here `AD × 1` (attack damage × 1)
> - **scaled part** — a ratio × a unit stat, here `0.01 × AP` (1% of ability
>   power)

Source: cdragon bin (extracted). Structure confirmed; the full per-champion
store is not yet walked.

## Pipelines

The per-kind pipeline shapes are fixed in ADR 0004 (damage: bonus,
amplification, critical strike, mitigation; heal: amplification, anti-heal;
shield: amplification; mana: per-attack and from damage-taken). Their internal
ordering and coefficients are pinned by calibration against the live game.

> **Example** — illustrative; the stage order is the candidate to confirm at
> calibration. A 300 base hit, +50% amplification, a crit, into 100 armor:
>
> - base: **300**
> - amplification (+50%, ×1.5): **450**
> - critical strike (+30%, ×1.30): **585**
> - mitigation (100 armor → ×0.5): **293 dealt**

## Sources

- Mitigation, mana, crit (community references, patch-sensitive):
  [TFT:Mana](https://wiki.leagueoflegends.com/en-us/TFT:Mana),
  [TFT:Critical strike](https://wiki.leagueoflegends.com/en-us/TFT:Critical_strike),
  [armor & magic resist](https://www.tacter.com/tft/guides/how-armor-and-magic-resistance-works-in-teamfight-tactics-eecf98c2).
- Scaling formula (game data): cdragon
  `game/data/maps/shipping/map22/map22.bin.json` and
  `game/data/characters/<champ>/skins/*.bin.json`.
