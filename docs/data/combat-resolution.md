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

## Mana generation (Set 15 roles revamp)

In force since TFT15.1 (2025-07-29, Set 15) and unchanged through the current
set (Set 17, patch 16.13). It replaced the pre-Set-15 system where every unit
generated mana from damage taken (1% pre- plus 7% post-mitigation).

The role is per-champion data (`role` in cdragon `en_us.json`: damage-type
prefix x role, e.g. `APCaster`, `ADTank`; a few special units carry `null`).

- Per attack, flat by role: 10 (Fighter, Marksman/"Carry", Assassin/"Reaper"),
  7 (Caster), 5 (Tank).
- Per second: Casters generate 2 (role perk). Since Set 15, items grant a
  distinct `ManaRegen` stat — read as per-second, pinned at calibration.
- From damage taken: Tanks only — 1% of pre-mitigation plus 3% of
  post-mitigation, capped ~42.5 per instance.
- Specialist: unique generation (some units have no mana at all).
- After casting: mana empties; overflow past the threshold carries into the
  next bar — a Set 12 introduction (excess mana was simply lost before). No
  generation for ~1s after a cast (mana lock; per-champion exceptions).
  Carry dated by Set 12 coverage; the rest wiki-sourced — patch-sensitive.

Item channels. The cdragon `items` array spans every set (`apiName` prefix
`TFTn_` = Set n, `TFT_` = core namespace reused across sets): presence in the
data is not liveness in the current set; liveness resolves at composition.

- Live at patch 16.13 (Set 17, cross-checked vs wiki): per-attack flat
  (`FlatManaRestore` — Shojin 5), regen stat (`ManaRegen` — Shojin 1,
  Blue Buff 5).
- Historical, recurring across sets (the post-cast family): post-cast refund
  (`ManaRefund`, Blue Buff of the sets 10-14 era; `PostCastMana`, Set 5
  shadow Blue Buff), post-cast refill over time (`ManaRefill`, Set 16
  Piltover item), max-mana reduction (`ManaReduction`, same eras), flat
  starting mana (`Mana`; champion `initialMana` is the structural
  counterpart, all sets).

> **Example** — at patch 16.13, a Caster (7 per attack, 2 per second) holding
> Spear of Shojin (`FlatManaRestore` 5, `ManaRegen` 1): +12 mana per attack,
> +3 mana per second.

Source: Riot "Roles Revamped" article (official — roles, per-attack values,
Tank-only damage generation, Set 15 scope); cdragon `en_us.json` patch 16.13
(role field, item variables, apiName set prefixes); wiki cross-check
(damage-taken coefficients, overflow, mana lock — patch-sensitive).
Coefficients and the regen unit confirm at calibration.

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

- Mitigation, crit (community references, patch-sensitive):
  [TFT:Critical strike](https://wiki.leagueoflegends.com/en-us/TFT:Critical_strike),
  [armor & magic resist](https://www.tacter.com/tft/guides/how-armor-and-magic-resistance-works-in-teamfight-tactics-eecf98c2).
- Mana:
  [Roles Revamped](https://teamfighttactics.leagueoflegends.com/en-us/news/game-updates/roles-revamped-and-item-changes/)
  (Riot, official), cdragon `cdragon/tft/en_us.json` patch 16.13 (roles, item
  variables); cross-check
  [TFT:Mana](https://wiki.leagueoflegends.com/en-us/TFT:Mana) (community,
  patch-sensitive); overflow carry dating:
  [Set 12 mana overflow](https://www.zleague.gg/theportal/team-fight-tactics-tft-huge-mana-change-explained/).
- Scaling formula (game data): cdragon
  `game/data/maps/shipping/map22/map22.bin.json` and
  `game/data/characters/<champ>/skins/*.bin.json`.
