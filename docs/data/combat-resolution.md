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

> **Example** — a 100-damage physical hit:
>
> - into 100 armor: `100 × 100/(100+100)` = **50 taken**
> - after a 30% shred (armor 70): `100 × 100/(100+70)` = **59 taken**

Source: community references. Confirm at calibration.

## Mana generation

- Per attack, flat by role: 10 (assassin, marksman, fighter), 7 (caster), 5
  (tank).
- From damage taken: 1% of pre-mitigation plus 7% of post-mitigation, capped
  ~42.5 per source.

> **Example** — a caster takes a 200 hit (100 after mitigation):
>
> - from the hit: `1%×200 + 7%×100` = **+9 mana**
> - from its next attack: **+7 mana**

Source: community references; patch-sensitive. Confirm at calibration.

## Critical strike

- Base 25% chance, +30% bonus critical damage; multiplies the damage instance.

> **Example** — a 1000-damage hit that crits: `1000 × 1.30` = **1300 dealt**.

Source: community references. Confirm at calibration.

## Scaling formula (from the game data)

The `@ModifiedX@` displayed in an ability is a `GameCalculation`: a sum of
subparts.

- `StatByCoefficientCalculationPart { mStat, mCoefficient }` — coefficient × a
  unit stat.
- `SubPartScaledProportionalToStat { mDataValue, mRatio }` — a data value scaled
  to a stat (e.g. an `APRatio` value with ratio ~0.01, scaled to AP).
- The scaling stat is tied to the description's `%i:scaleY%` tag through
  `mStyleTagIfScaled`.

Location: the TFT map bin (`map22.bin.json`) holds shared calculations;
per-champion calculations are reached through `__linked` references. The `mStat`
enum is partly decoded — `mStat=2` appears in the basic-attack calculation with
coefficient 1, consistent with attack damage.

> **Example** — an ability reading `@ModifiedDamage@ (%i:scaleAP%)` has a
> `GameCalculation` of two summed parts:
>
> - stat part: `mStat × coefficient` — here `AD × 1`
> - AP part: `APRatio × 0.01 × AP`
>
> The `scaleAP` tag in the text marks the AP part.

Source: cdragon bin (extracted). Structure confirmed; the full per-champion
store is not yet walked.

## Pipelines

The per-kind pipeline shapes are fixed in ADR 0004 (damage: bonus,
amplification, critical strike, mitigation; heal: amplification, anti-heal;
shield: amplification; mana: per-attack and from damage-taken). Their internal
ordering and coefficients are pinned by calibration against the live game.

> **Example** — illustrative; the stage order is the candidate to confirm at
> calibration. A 300 base hit, +50% amp, a crit, into 100 armor:
>
> - base: **300**
> - amplification (×1.5): **450**
> - critical strike (×1.30): **585**
> - mitigation (×100/200): **293 dealt**

## Sources

- Mitigation, mana, crit (community references, patch-sensitive):
  [TFT:Mana](https://wiki.leagueoflegends.com/en-us/TFT:Mana),
  [TFT:Critical strike](https://wiki.leagueoflegends.com/en-us/TFT:Critical_strike),
  [armor & magic resist](https://www.tacter.com/tft/guides/how-armor-and-magic-resistance-works-in-teamfight-tactics-eecf98c2).
- Scaling formula (game data): cdragon
  `game/data/maps/shipping/map22/map22.bin.json` and
  `game/data/characters/<champ>/skins/*.bin.json`.
