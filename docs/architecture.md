# Architecture

Where things live.

## `src/domain`

The types TFT is described with. No logic, and no import from anywhere else in
`src`.

|                                             |                                                                       |
| ------------------------------------------- | --------------------------------------------------------------------- |
| `primitives.ts`                             | branded ids, star levels, per-star values                             |
| `catalog/base-stats.ts`                     | the stat schema a unit carries                                        |
| `catalog/modifier.ts`                       | the closed effect vocabulary, and the stats a modifier can reach      |
| `catalog/spell.ts`                          | a spell and its named parameters                                      |
| `catalog/unit.ts`                           | role, cost, damage profile                                            |
| `catalog/item.ts`, `augment.ts`, `trait.ts` | the three carriers of modifiers                                       |
| `combat/board-side.ts`                      | one side of a fight: a unit, its star, its items, traits and augments |
| `combat/combat-config.ts`                   | what a run is given                                                   |
| `combat/stop-condition.ts`                  | when a run ends                                                       |
| `combat/simulation-result.ts`               | what a run returns                                                    |

## `src/engine`

Resolution. Reads the domain, knows no set.

|                                                                         |                                               |
| ----------------------------------------------------------------------- | --------------------------------------------- |
| `loop/simulate.ts`                                                      | the entry point: a config in, a result out    |
| `loop/event-queue.ts`, `combat-event.ts`, `combat-state.ts`             | the time-ordered queue and what it advances   |
| `loop/time.ts`                                                          | engine time, an integer count of milliseconds |
| `loop/stop-signal.ts`                                                   | how a run decides it is over                  |
| `mechanics/process-event.ts`                                            | one handler per event kind, closed on `never` |
| `mechanics/auto-attack.ts`, `casting.ts`, `mana.ts`                     | what a unit does with its turn                |
| `mechanics/resolve-damage.ts`, `shield.ts`, `crit-policy.ts`            | how a hit lands                               |
| `mechanics/crowd-control.ts`, `timed-modifiers.ts`, `periodic-ticks.ts` | what lasts and what expires                   |
| `spell/contract.ts`                                                     | the signature a spell has to satisfy          |
| `spell/apply-effects.ts`, `deliver.ts`                                  | how a spell's modifiers reach their target    |
| `stats/resolved-stats.ts`, `effective-stats.ts`, `combatant.ts`         | base stats to the numbers a hit uses          |
| `provisional/`                                                          | stand-in data until the catalog lands         |

## `src/sets`

Set content, as data. Reads the domain, plus the spell contract in
`src/engine/spell` — nothing else in the engine.

|                       |                                                                  |
| --------------------- | ---------------------------------------------------------------- |
| `fixture/registry.ts` | the spells a run can look up                                     |
| `fixture/spells/`     | one file per spell: its parameters, and the modifiers it returns |

## `src/ui`

Components. Four files to a folder — `<name>.contract.ts` for the axes and
defaults, `<name>.classes.ts`, `<name>.tsx`, and `storybook/<name>.stories.tsx`.

`atoms/` holds `button`, `text` and `text-field`. A contract may read the domain
— `text` draws its stat keywords from the stat schema, so a stat the schema does
not have cannot be styled.

## `src/styles`

`main.css` clears Tailwind's default scales and defines a closed set in their
place: type, spacing, radii, easing, and a palette that runs down to the domain
— one colour per damage type, per unit cost, per augment tier. `fonts.css`
carries the faces.

## Root

`index.html` and `src/main.tsx` mount `src/app.tsx`. Configuration sits at the
root: one `tsconfig` per surface, `vite.config.ts`, `eslint.config.js`,
`lefthook.yml` for the git hooks, and `.github/` for CI and the templates.
