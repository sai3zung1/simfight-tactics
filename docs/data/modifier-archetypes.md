# Modifier archetypes — spell cartography (sets 15/16/17)

> Empirical input for the taxonomy freeze (#14): cross-set cartography of
> ability-variable patterns. Names churn ~90% per set; archetypes do not.

## Scope

Playable-champion cut of the three snapshots listed in [Sources](#sources):
227 champions, 1,356 ability-variable occurrences, 886 distinct names.
Champion category only — cost 1–5 with at least one trait; this drops item
anvils, loot props, PVE monsters, summons and dev leftovers. Converges with
the per-set vocabulary of the [Set 17 dictionary](./set-17-dictionary.md).

## Families

Cartographed 2026-06-12. 13 families cover 90.7% of occurrences with one
ordered rule list.

| Family       | Occ. | %    | 15/16/17    | Representative names                   |
| ------------ | ---- | ---- | ----------- | -------------------------------------- |
| damage       | 488  | 36.0 | 134/220/134 | Damage, ADDamage, APDamage, BaseDamage |
| duration     | 184  | 13.6 | 36/94/54    | Duration, ShieldDuration, StunDuration |
| count        | 107  | 7.9  | 26/49/32    | NumAttacks, NumEnemies, NumBounces     |
| heal         | 103  | 7.6  | 38/43/22    | APHealing, PercentMaxHealthHealing     |
| spatial      | 88   | 6.5  | 20/50/18    | HexRange, HexRadius, AoERadius         |
| stat-mod     | 74   | 5.5  | 30/28/16    | Resists, Omnivamp, ArmorReduction      |
| shield       | 59   | 4.4  | 12/27/20    | Shield, APShield, PercentHealthShield  |
| attack-speed | 54   | 4.0  | 18/23/13    | AttackSpeed, BonusAS, ASSlow           |
| ratio-scalar | 35   | 2.6  | 11/16/8     | FalloffPercent, MRReduction            |
| mana         | 19   | 1.4  | 8/9/2       | ManaPerKill, UltimateManaGain          |
| cc-debuff    | 13   | 1.0  | 4/7/2       | ShredAmount, SunderRatio, HexKnockback |
| chance       | 6    | 0.4  | 1/2/3       | ProcChance                             |
| unclassified | 126  | 9.3  | 33/59/34    | see below                              |

## Scaling sources (inside damage / heal / shield)

| Family | flat | AD  | AP  | %HP | base/bonus |
| ------ | ---- | --- | --- | --- | ---------- |
| damage | 311  | 58  | 48  | 21  | 50         |
| heal   | 35   | —   | 12  | 52  | 4          |
| shield | 42   | —   | 5   | 7   | 5          |

"Flat" means the _name_ carries no scaling marker; actual scaling may live in
the description interpolation (`@ModifiedDamage@`). To resolve before freeze.

## Archetypes hidden in the unclassified tail

- **damage-reduction** — Durability, FlatDR, PassiveDR (~15 occ).
- **cadence / over-time** — TickRate, UltimateCadence, BoltCooldown,
  NovaRepeatTimer: periodic generation from any source.
- **threshold / execute** — StardustThreshold1-8, SoulBreakpoint,
  GarenExecute: stack breakpoints and execution thresholds.

Residue after absorption (~5%): champion-specific flavor counters
(MeepsPerAstro, TakedownsToDrone, missiles/arrows/pages — disguised counts)
and tooltip-only artifacts.

## Candidate dictionary skeleton

effect (damage | heal | shield | damage-reduction | stat-mod | cc)
× scaling source (flat | AD | AP | %HP)
× temporality (instant | duration | cadence)
× count × space × threshold
— star-level value arrays as the instantiation axis.

## Items & augments cartography (Set 17 active pools, cross-checked vs 15/16)

Cartographed 2026-06-12 from the same snapshots. Per-set scoping comes from
`setData.items` / `setData.augments` (apiName lists resolved against the
global `items` array).

- **Families close.** No new combat family beyond the spell-derived skeleton.
  Reinforced: cadence (ICD, Interval, Period), threshold (StackCap, Tier).
  New out-of-scope marker: **economy** (Gold, XP, Rerolls) — dominant in
  augments, no DPS impact. Generic `Amount` is a naming convention, not a
  family. Effect keys are 10–11% hashed (vs 0% for spells); `tags` are mostly
  hashed → item cuts use apiName prefixes, not tags.
- **Stability, quantified.** Items: 262 of Set 17's 687 active refs exist in
  all three sets; the 401 set-only refs are mechanic props (MarketOffering,
  ChampionItem, trait items), not gameplay items — the durable core is
  components/craftables/radiants/artifacts (#13 scope). Augments: 68% of the
  active pool predates Set 17; 35 entries are set-bound (#28 keeps the
  durable, combat-impacting core).

## Open before freeze (#14)

1. Resolve "flat" vs interpolated scaling in ability descriptions.
2. ~~Items/augments cartography~~ — done above; families close.

## Sources

Retrieved 2026-06-12 from
`https://raw.communitydragon.org/<patch>/cdragon/tft/en_us.json`, terminal
live patch of each set (16.12 = Set 17 live patch at retrieval).

| Set | Patch | Base mutator | sha256                                                             |
| --- | ----- | ------------ | ------------------------------------------------------------------ |
| 15  | 15.23 | TFTSet15     | `1aad252b59dc21c7846cb5d6861ab9765ff0087f04268a7cd94a50e15760b313` |
| 16  | 16.7  | TFTSet16     | `a7ede29ec65c27df6a53a023a30c686f05e411c21c81d70d31262c5f2912a659` |
| 17  | 16.12 | TFTSet17     | `6217094da92aea660695139f3203d5cef3d66c1afaf3f29170744e72194c9173` |
