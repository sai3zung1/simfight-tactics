# What a capture must carry

What the extraction chain has to bring back from an installed client, and what
demands it. Read before an extraction ticket is written, so that what the chain
fetches is decided by what the product reads rather than by what happened to be
easy to reach.

Most rows name the ticket or the page that demands them. Demand is not the
standard, though: `docs/product.md` sets it at everything the game can express
landing in the engine, **whether the interface exercises it or not**. So a row
earns its place either because something asks for it or because the game
expresses it, and a row of the second kind says so instead of waiting for a
ticket to justify it.

`docs/adr/0009-riot-naming-is-the-vocabulary.md` makes the client's own name for
a thing the vocabulary, so the names below are the ones `data/` carries today and
not the ones a capture will carry. They are read, not chosen.
`docs/adr/0010-riot-is-the-only-source.md` removes the published sources, so
every row descends from the client or it is absent.

## Two kinds of extraction

**Continuous** — re-read at every rotation, and at every patch that moves a
number. Entries, their values, their text, their identifiers and their art.
`docs/what-changes-between-sets.md` says which families a rotation rewrites, and
those are the ones that come back through this door.

**One-time** — deciphered once and true until the game changes the rule itself.
A formula, a geometry, a stacking law, the meaning of an axis. These are not
values a set replaces; they are how the game works, and re-reading them every
rotation is waste. Getting one wrong is silent, because a wrong rule still
produces a number.

The column on every table below says which door a row comes through. A family
can carry both: a trait's breakpoints are continuous, and what a breakpoint's
grant means is one-time.

**One-time says when a thing is read, never where it lands.** Both kinds land in
`data/`. `docs/product.md` closes the alternative: a patch is applied in one
place, nothing under `src/` is edited to follow a patch note, and a value that
cannot be corrected without touching code is a value in the wrong place. A
formula read once and written into the engine breaks that on the first patch that
moves it — and a formula is exactly the kind of thing a balance patch moves.

Counts are Set 18, measured on the capture dated 2026-08-01. They say which rows
are sparse; they are not maintained.

## Units — 71 entries

| What                                                            | Demanded by            | In `data/` today                                                                                                                   | What has to be read                                                             | Extraction |
| --------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------- |
| Riot's character identifier                                     | #201, #296, #300, #292 | absent on all 71                                                                                                                   | the character object's own name — the join key for everything Riot ever returns | continuous |
| Name                                                            | #187, #191, #320       | 71                                                                                                                                 | the text table                                                                  | continuous |
| Cost                                                            | #187, #77, #185        | 65 — six entries have none                                                                                                         | the character object                                                            | continuous |
| Traits                                                          | #184, #221, #229       | 65, as display names                                                                                                               | the character object's trait references                                         | continuous |
| Role                                                            | #211, #180             | 65                                                                                                                                 | the character object                                                            | continuous |
| Damage profile                                                  | #182                   | 65, as a list — five carry two                                                                                                     | the character object                                                            | continuous |
| Range                                                           | #181, #299             | inside `stats`, a list — `[4, 1]` on Nidalee alone                                                                                 | the character object                                                            | continuous |
| Stats, per star                                                 | #180, #223, #224, #188 | `stats` on all 71                                                                                                                  | curve tables, indexed by star                                                   | continuous |
| Mana generation — per attack, per second, and from damage taken | #49, `docs/unit.md`    | **not on a unit.** Carried per role in `timeless/roles.json`; `BaseStats.manaGeneration` is required and present on none of the 71 | the per-role values, landed on the unit that reads them                         | continuous |
| Resource kind                                                   | #49, Slice 01          | `stats.resource` on 65                                                                                                             | the character object                                                            | continuous |
| The ability block                                               | #278, #199, #284, #285 | `ability` on 70                                                                                                                    | the text template plus the curve rows it names                                  | continuous |
| Ability variants                                                | #189                   | Lux alone, ten                                                                                                                     | the character object                                                            | continuous |
| `summoned`, `summonedBy`                                        | #185                   | 6 each                                                                                                                             | the character object                                                            | continuous |
| Summon scaling                                                  | #228                   | 3                                                                                                                                  | a curve table                                                                   | continuous |
| `combat`, `requiresRunInput`                                    | #313, #312             | 71 each                                                                                                                            | **never.** Slice 03 states it: these are readings, not data Riot ships          | —          |

## Role — 6 entries in `timeless/roles.json`, read from `CT_Role_Stats`

The client names six — tank, brawler, fighter, assassin, marksman, caster.
`docs/unit.md` names six too, and one of them differs: it says `specialist`
where the client says `brawler`. The capture's units name `specialist` — four of
them — and never `brawler`, so the role holding a set of mana figures is one no
unit asks for.

| What                                 | Demanded by         | In `data/` today                                                                                               | What has to be read                                                                                                   | Extraction |
| ------------------------------------ | ------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------- |
| The six role names                   | #203, ADR 0009      | six, one of which no unit uses                                                                                 | the client's own six, which settle the `specialist` / `brawler` split                                                 | one-time   |
| Mana per attack                      | #49, `docs/unit.md` | `manaPerAttack` on 6 — 5 for tank, 7 for caster, 10 for the rest                                               | **a value**                                                                                                           | continuous |
| Mana from damage taken               | #49, `docs/unit.md` | `manaShareOfDamageTaken` and `manaCapPerHit` on 2 of 6                                                         | **a formula to confirm** — a share of damage taken read before mitigation and before shields, capped per hit          | one-time   |
| The fighter's omnivamp               | #49, `docs/unit.md` | absent from `roles.json`; `docs/unit.md` states 10% carried by the role itself                                 | **a value**, and which role carries it                                                                                | continuous |
| Targeting weight                     | #211                | absent                                                                                                         | **a formula to confirm** — `docs/unit.md` gives the direction, a tank more likely and an assassin less, and no number | one-time   |
| How a resource other than mana fills | #49, Slice 01       | `stats.resource` on 65 units — mana, ammo, rage, manaless, and a fourth kind the client keeps and no unit uses | the rule per resource kind                                                                                            | one-time   |

## Traits — 36 entries

| What                                                                                                                                                                       | Demanded by      | In `data/` today  | What has to be read                                                                                                            | Extraction |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| Id, name, description                                                                                                                                                      | #226, #221       | 36                | the text table and its templates                                                                                               | continuous |
| Breakpoints and their values                                                                                                                                               | #226, #229, #292 | 36                | curve tables                                                                                                                   | continuous |
| Grants and parameters                                                                                                                                                      | #226, #229       | 36                | stripped objects until #206                                                                                                    | continuous |
| Roster                                                                                                                                                                     | #229, #292       | `champions` on 36 | the trait object                                                                                                               | continuous |
| Kind                                                                                                                                                                       | #226             | 36                | the trait object                                                                                                               | continuous |
| Twelve one-off keys — `advancesOn`, `startsAt`, `phases`, `variants`, `sacrifice`, `requires`, `hexes`, `blessings`, `alphaTargets`, `khazixTraits`, `thresholds`, `mount` | #226, #228       | one trait each    | each names a mechanic of a single trait; under ADR 0009 the name has to be the client's, and none of them is confirmed as such | one-time   |

## Items — 137 entries

| What                  | Demanded by      | In `data/` today                           | What has to be read                      | Extraction |
| --------------------- | ---------------- | ------------------------------------------ | ---------------------------------------- | ---------- |
| Id, name, description | #225, #220       | 137, 137, 127                              | the text table                           | continuous |
| Type                  | #225, #321       | 137                                        | the item object                          | continuous |
| Stats                 | #225, #222, #232 | 137                                        | curve tables                             | continuous |
| Components            | #225             | 59 — the eight-by-eight grid               | the item object                          | continuous |
| Grants, parameters    | #225             | 107, 34                                    | stripped objects until #206              | continuous |
| Stacks, max stacks    | #225             | 12, 7                                      | curve tables                             | continuous |
| An emblem's trait     | #225             | 20                                         | the item object                          | continuous |
| Taxonomy tag          | #200, #321       | 10, and they are **hashes** — `{b72bd3bf}` | the hash resolved against the text table | continuous |
| How a hash is made    | #200             | nothing                                    | the algorithm behind the fingerprint     | one-time   |

## Augments — 257 rows

| What                  | Demanded by | In `data/` today                       | What has to be read                                                                              | Extraction |
| --------------------- | ----------- | -------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------- |
| Id, name, description | #227, #323  | 257                                    | the text table                                                                                   | continuous |
| Tier                  | #227, #77   | 257                                    | the augment object                                                                               | continuous |
| Apparition            | #227        | 257                                    | the augment object                                                                               | continuous |
| Categories            | #321        | 257, and they are **metatft's scheme** | nothing — the scheme leaves with ADR 0010, and #200 puts Riot's own hashed taxonomy in its place | continuous |
| Grants, parameters    | #227        | 84, 35                                 | stripped objects until #206                                                                      | continuous |

## Wisps — 176 entries, against the 181 the client defines

| What                                       | Demanded by | In `data/` today                                                                                                                                           | What has to be read                                                   | Extraction |
| ------------------------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------- |
| Id, name, description                      | #228, #324  | 176                                                                                                                                                        | the text table and its templates                                      | continuous |
| Gold, and the upgraded and prismatic costs | #324        | 176                                                                                                                                                        | curve tables — the client spells the upgrade cost four different ways | continuous |
| Category, appearance window                | #324, #321  | 176, **null on fourteen**                                                                                                                                  | a stripped object until #206                                          | continuous |
| Parameters, grants                         | #228        | 156, 55                                                                                                                                                    | curve tables plus stripped objects                                    | continuous |
| The options a wisp opens                   | #316, #324  | `consumableOptions`, nested inside `params` on nine entries. `rollOptions` appears nowhere in the file, though `data/manifest.json` describes it at length | stripped objects                                                      | continuous |

## Keywords — 9 entries

| What                              | Demanded by | In `data/` today            | What has to be read                                               | Extraction |
| --------------------------------- | ----------- | --------------------------- | ----------------------------------------------------------------- | ---------- |
| Id, name, text                    | #157, #245  | 9                           | the text table's `<rules>` block                                  | continuous |
| Polarity, and what it resolves to | #270, #264  | 9                           | the text for what it states                                       | continuous |
| How each one stacks               | #270, #264  | 9, four stacking rules null | **a rule** — the game has it both ways, so it is read per keyword | one-time   |

## Assets

Every file is re-taken from the client under ADR 0010. Measured in
`src/assets/icons/`, and matching the 636 that `ATTRIBUTION.md` records.

| Family   | In the tree today                                                                                     | Read by                                                                  | Readings a component asks for                                                                                     |
| -------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Units    | 69 — 65 PNG at 128 × 128, 4 JPG, every one of them cropped to the head; **no splash art at all**      | #187 card, #170 board cell, #320 picker, #240 result panel, #188 tooltip | the cropped portrait for the board cell, the picker and the result panel; the splash for the card and the tooltip |
| Spells   | 65 — 64 JPG, 1 PNG, named by the unit's id because the ability carries no id of its own               | #188 tooltip, #278                                                       | tooltip                                                                                                           |
| Traits   | 108 — 36 × (base + two monochrome), all SVG, and **lolchess's vectorisations rather than Riot files** | #221 trait panel, #320 picker                                            | panel · picker · the two monochrome readings                                                                      |
| Items    | 137 PNG at 128 × 128                                                                                  | #220 item slot, #320 picker, #188 tooltip                                | slot · picker · tooltip                                                                                           |
| Augments | 257 PNG                                                                                               | #322 augment row, #320 picker                                            | row · picker                                                                                                      |
| Wisps    | none, and none is wanted — a wisp is text                                                             | #322, #324                                                               | —                                                                                                                 |

**A unit needs two artworks, not one image at two sizes.** What sits in the tree
is cropped to the champion's head, which serves a dense context — a board cell,
a picker row — and cannot be enlarged into a card, because the art it would need
is not in the file. The splash is the other one: rectangular, far larger, and
absent from the tree entirely. Neither derives from the other, so the chain
fetches both.

Every other family carries one artwork, and the readings a component asks for
are that file at the size the screen draws it.

## What the player declares

`docs/product.md` makes the state a fight starts from an input surface rather
than a gap: the player declares it, **the catalog enumerates the options and
designates none**. `requiresRunInput` marks which entries need it, and it is true
on 81 of the 677 across the capture.

Marking an entry is one half. The options it offers are the other, and they have
no common home.

| Family   | Entries marked | The options they offer                                                                                                                                                                                    | Extraction |
| -------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Wisps    | 34             | `consumableOptions` under `params` on nine of them; nothing on the other twenty-five                                                                                                                      | continuous |
| Augments | 33             | `rollOptions` under `params` on two of them — Magic Roll and Slightly Magic Roll; nothing on the other thirty-one                                                                                         | continuous |
| Traits   | 8              | no key named for options; each carries one key of its own — `blessings`, `alphaTargets`, `khazixTraits`, `hexes`, `mount` — and whether those enumerate what a player picks is a reading, not established | continuous |
| Items    | 4              | **no field**                                                                                                                                                                                              | continuous |
| Units    | 2              | **no field**                                                                                                                                                                                              | continuous |

An entry that needs a declaration and enumerates nothing is simulated against a
value the player knows and the app never asked for. Which options exist is read
from the client; which one applies is the player's, and the capture never
designates one.

## What the index gives without the schema

A container's file index is not behind the property block. It mounts and lists
whatever the schema is missing, and on the Live client it lists 250 489 paths.
That is enough for a real share of this page, measured rather than hoped:

- **The set's inventory, by folder.** `TFT/Plugins/GameFeatures/Set_18/Content/`
  holds `Champions` — 66 folders, one per champion — beside `Charms`, `Traits`,
  `Augments`, `Items`, `Minions`, `Encounters`, `Armies`, `Carousel`, `Shop` and
  `Rounds`. #196 asks a capture to enumerate what a set holds, and this
  enumerates it.
- **Riot's identifiers.** 99 distinct `TFT18_*` names appear in the paths, one
  per champion among them. #201 asks for the join key, and the key is in the
  path.
- **The shape of the packaging**, which the probe already reports without
  opening anything.

And it disagrees with `data/` already, which is what makes it worth reading:
three champion folders — `CrimsonRaptor`, `NunuWillump`, `Sentry` — have no
entry, and two entries — Mama Beak, Pebbles — have no folder.

What the index does **not** give is anything inside an object: a value, a
breakpoint, a grant, a description. Nor the text — no `.locres` is indexed at
all, and `Set_18/Content/L10n` is voice lines, 362 assets and their bulk data.

So the line falls between naming a thing and reading it. A capture can say what a
set holds and what Riot calls it; it cannot say what any of it does.

## When a capture lands in `data/`

`docs/product.md` settles where a patch is applied: in one place, `data/`,
through a capture or by hand. So the chain writes `data/` in the end, and the
directory it writes first holds the raw reading rather than the result.

It merges rather than overwrites, because `data/` holds what no chain produces.
The rule is readable off the tables above, and it is the whole rule:

- **The chain owns every row that names a client source.** A run replaces those,
  every time, without asking.
- **It preserves every row marked never.** `combat` and `requiresRunInput` are
  readings a person makes, on all 677 entries, and a run leaves them exactly
  where it found them.
- **It preserves every block waiting on a property schema.** The grants and
  applies the tables mark as stripped objects are hand-written until #206, and a
  run that cannot read them must not remove them either.
- **A field the chain owns and cannot read on a given run is a refusal, not an
  erasure.** #195 makes the reader refuse rather than guess; a merge that wrote
  an absence would guess by deleting.

An entry the chain reads and `data/` does not hold is added. An entry `data/`
holds and the chain does not read is a question, not a deletion: a set retires
content, and so does a reader that stopped reaching it.

## Mechanics that have to be deciphered

One-time, every one of them. A description states what an entry does and never
how the game does it: nothing in a value says who an effect reaches, how long it
takes to get there, or what shape it has when it lands. These are unanswered
across **units, traits, items and augments alike** — a trait that grants on a
radius asks the same three questions as a spell that does.

| What                                                 | Demanded by | Known today                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Who an effect lands on                               | #267, #268  | `docs/effect-families.md` lists roughly eleven shapes; no value in `data/` names one                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| How long an effect takes to reach its recipient      | #284, #268  | nothing — `docs/combat-resolution.md` records the impact offset as an accepted abstraction                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| The shape of the impact on arrival                   | #268, #284  | nothing                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| The hex board's geometry — four rows by seven a side | #167, #171  | stated in Slice 02, held in no data                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Distance and adjacency between hexes                 | #208        | nothing under `src/domain` or `src/engine`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Movement speed, and what one step costs              | #212, #217  | `movementSpeed` on 2 of the 6 roles, and every role moves                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Overtime — the threshold and how it escalates        | #215        | `docs/combat-resolution.md` records it as nowhere, with a sixty-second cap in its place                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| What the fighter's attack-speed axis counts          | #180        | `roles.json` keeps the client's keys 1, 3, 4, 5 and 10; `data/manifest.json` says the axis is not established                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Which effects take the strongest and which add       | #270        | `docs/effect-families.md` names four that take the strongest and one exception that adds                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| The property names a shipped build strips            | #206        | **Nothing deserializes without them, and neither way round holds.** Measured on the Live client: seven asset families — data table, blueprint, texture, material, mesh, font, curve table — all fail with _package has unversioned properties but mapping file is missing_, and no `.usmap` exists in either install. Reading under the property layer does not work either: a curve table serialises its row map **after** the property block, so the rows cannot be reached without knowing where that block ends. This is not the last reading the chain needs, it is the first |

## What nothing produces yet

Demanded by a ticket, produced by none.

- **The team planner list order.** #300 reads a code against a list whose order Riot owns, and `docs/adr/0006-three-moments.md` records that order table as an output of the extraction chain, remade each set. No ticket in Slice 03 produces it, and rebuilding the order from `data/` shifts every champion after the first divergence without raising an error. Continuous.
- **Riot's character identifier**, absent on all 71 — #201. Continuous.
- **The labels behind the hashed taxonomy** — #200, which ADR 0010 makes the only source of a taxonomy at all. Continuous.
- **Text as templates rather than as substituted numbers** — #199, on the 41 units carrying a value frozen at one reading. Continuous.
- **A unit's splash art** — #187 and #188 draw a card and a tooltip that the cropped portrait cannot fill, and no file in `src/assets/icons/` is one. Continuous.
- Everything in the section above it, which is the one-time half of the same list.

## Unsourced

Nothing here is demanded by a ticket or a page. It is written down so it is not
rediscovered, and it earns a row above only when something asks for it.

- Item recipe validity as the client states it, rather than as the eight-by-eight grid implies.
- Which entries a set retires, as against which it adds — a rotation reuses augments across sets, and only the client says which came back.
- Per-unit cast time, which `docs/combat-resolution.md` records as a known abstraction rather than a modelled value.
