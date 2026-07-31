# Architecture

The areas of the source tree, what each is for, and what it may read.

The unit here is the folder. A new file inside one of them changes nothing on
this page; a new folder does.

## `src/domain`

The types TFT is described with. No logic, and nothing outside `src/domain` is
imported.

|                 |                                                                                                                         |
| --------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `catalog/`      | what a set is made of: the stat schema, the closed effect vocabulary, and the units, spells, items, augments and traits |
| `combat/`       | what a run is made of: the two sides, the configuration, the stop conditions, the result                                |
| `primitives.ts` | branded ids and per-star values, shared by both                                                                         |

## `src/engine`

Resolution. Reads the domain, and knows no set — except `provisional/`, which
imports one until the catalog lands.

|                |                                                                                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loop/`        | the entry point `simulate()`, the time-ordered event queue, and engine time                                                                                    |
| `mechanics/`   | one module per thing a fight does — attacking, casting, mana, damage, shields, crowd control, expiry. `process-event.ts` dispatches to them, closed on `never` |
| `spell/`       | `contract.ts` is the signature a spell satisfies; the rest turns the modifiers a spell returns into effects on a target                                        |
| `stats/`       | base stats down to the numbers a hit uses                                                                                                                      |
| `provisional/` | stand-in data until the catalog lands                                                                                                                          |

## `src/sets`

Set content, as data. Reads the domain, plus `engine/spell/contract` — nothing
else in the engine.

One folder per set. Inside it, a registry of the spells a run can look up, and
one file per spell carrying its parameters and the modifiers it returns.

## `src/ui`

Components, one folder each.

A contract may read the domain: `text` draws its stat keywords from the stat
schema, so a stat the schema does not have cannot be styled.

## `src/styles`

`main.css` clears Tailwind's default scales and defines a closed set in their
place: type, spacing, radii, easing, and a palette that runs down to the domain
— one colour per damage type, per unit cost, per augment tier. `fonts.css`
carries the faces.

## Root

`index.html` and `src/main.tsx` mount `src/app.tsx`. Configuration sits at the
root: one `tsconfig` per surface, plus Vite, ESLint, the git hooks, and
`.github/` for CI and the templates.
