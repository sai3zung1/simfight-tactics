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

> **Example** — against 100 armor, a 100 physical hit lands as
> `100 × 100/(100+100) = 50`; shredding that armor 30% (→ 70) raises it to
> `100 × 100/170 = 59`.

Source: community references. Confirm at calibration.

## Mana generation

- Per attack, flat by role: 10 (assassin, marksman, fighter), 7 (caster), 5
  (tank).
- From damage taken: 1% of pre-mitigation plus 7% of post-mitigation, capped
  ~42.5 per source.

> **Example** — a caster taking a 200 pre-mitigation hit that lands as 100 gains
> `1%×200 + 7%×100 = 9` mana from it, plus 7 from its next attack.

Source: community references; patch-sensitive. Confirm at calibration.

## Critical strike

- Base 25% chance, +30% bonus critical damage; multiplies the damage instance.

> **Example** — a 1000-damage instance that crits deals `1000 × 1.30 = 1300`.

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

> **Example** — the extracted `TotalDamage` sums
> `StatByCoefficient(mStat=2, ×1)` (a unit stat, here AD) and
> `SubPartScaledProportionalToStat(APRatio, ratio ~0.01)` (an AP term); the
> `%i:scaleAP%` tag in the description marks the same AP link.

Source: cdragon bin (extracted). Structure confirmed; the full per-champion
store is not yet walked.

## Pipelines

The per-kind pipeline shapes are fixed in ADR 0004 (damage: bonus,
amplification, critical strike, mitigation; heal: amplification, anti-heal;
shield: amplification; mana: per-attack and from damage-taken). Their internal
ordering and coefficients are pinned by calibration against the live game.

> **Example** (illustrative; the stage order is the candidate to confirm at
> calibration) — a 300-damage spell with +50% amp, critting, on a 100-armor
> target resolves as `300 × 1.5 × 1.30 × 100/(100+100) = 293`.

## Sources

- Mitigation, mana, crit (community references, patch-sensitive):
  [TFT:Mana](https://wiki.leagueoflegends.com/en-us/TFT:Mana),
  [TFT:Critical strike](https://wiki.leagueoflegends.com/en-us/TFT:Critical_strike),
  [armor & magic resist](https://www.tacter.com/tft/guides/how-armor-and-magic-resistance-works-in-teamfight-tactics-eecf98c2).
- Scaling formula (game data): cdragon
  `game/data/maps/shipping/map22/map22.bin.json` and
  `game/data/characters/<champ>/skins/*.bin.json`.
