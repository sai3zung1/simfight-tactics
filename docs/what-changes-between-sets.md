# What changes between sets

TFT replaces its content on a rotation. What a set rewrites, what it reuses and
what it never touches follow rules of their own, and those rules decide what is
worth building once against what has to be rebuilt every time.

This page carries the rules. It never carries a set's contents — those are data.

## By family

| Family           | A rotation…      | The rule                                                                                                                                |
| ---------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Base items       | barely touches   | Eight components, every pair yielding one item. The grid is fixed, and an item replaced in it never returns to it                       |
| Other item types | adds and removes | Leaving the base grid is not leaving the game: a retired item can reappear as an artifact, a radiant or an emblem                       |
| Augments         | draws and adds   | A historical pool. Absent from one set, back two sets later, unchanged                                                                  |
| Units, traits    | rewrites whole   | Near-total recomposition every time. Their shape holds; nothing built against their contents does                                       |
| Stat schema      | leaves alone     | Grows by addition and never turns over                                                                                                  |
| Star levels      | leaves alone     | One to three is universal. Four is reachable only through an augment, on a 1-cost at gold and a 2-cost at prismatic                     |
| Unit costs       | leaves alone     | One to five is the grid. Sets carrying a seventh cost have existed, so it is a strong default rather than a law                         |
| Effect families  | leaves alone     | Seven kinds have covered every effect so far: damage, heal, shield, crowd control, stat modification, damage reduction, mana generation |
| Effect naming    | rewrites whole   | Each set names its variables afresh. The project normalises them into its own vocabulary instead of adopting them                       |

Two examples worth carrying, because they are the rules rather than the
contents. Zephyr was replaced by Evenshroud on Belt + Cloak and never returned
as a base item — but it exists today as an artifact, reachable through a
specific augment. And four stars is not a set-defined subset: it is Worth the
Wait, gold on a 1-cost and prismatic on a 2-cost.

## Where the code lags the game

| The game has                                                       | The code does not                                                        |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Omnivamp, carried by items like Hextech Gunblade and Bloodthirster | No field for it in `BaseStats`, and none in `MODIFIABLE_STATS`           |
| A vocabulary the project would normalise into its own              | `ParameterName` is an open `string`; each spell names its own parameters |

## What this orders

Everything a rotation leaves alone is built once. Everything it rewrites is
rebuilt at every rotation, and anything built on top of it is written off with
it.
