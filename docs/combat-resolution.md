# Combat resolution

How a run turns two compositions into an outcome. Every number here is in the
engine, and the ones the game fixes are shown next to what the game says.

## Determinism

Nothing is rolled. A crit is an expected value — `1 + critChance × critDamage`
— so every hit carries the weighted average of a nominal and a critical one.
Time is an integer count of milliseconds, which lets two events on the same
instant compare exactly equal and keeps their ordering stable.

The same input produces the same outcome, every run.

## Monte Carlo

A deterministic run answers what a composition does on average. Rolling each
chance instead, many times over, answers how often — a distribution rather than
a number. It is a mode of its own, and none of it exists yet.

The shape is already right: `CritPolicy` takes a chance and a damage figure, and
`expectedCrit` sits beside `neverCrit` and `alwaysCrit` — the two bounds — in the
same file. A rolling policy is a fourth one.

The wiring is not. `auto-attack.ts` imports `expectedCrit` directly instead of
receiving a policy, so the choice has to travel from `simulate()` down to the
hit. `SpellRegistry` already takes that path.

One caveat on what a distribution would show today: a crit is the only chance in
the model — `Math.random` appears nowhere in `src` — so the whole spread would
come from that alone. Targeting adds a second source once positions exist: a
unit's role weights how likely it is to be targeted — a tank more, an assassin
less — and equal candidates still have to be separated somehow.

## Time

|                      |                                                                           |
| -------------------- | ------------------------------------------------------------------------- |
| One tick             | One millisecond                                                           |
| Auto-attack interval | `1 / attack speed` seconds                                                |
| Safety cap           | Sixty seconds. Only `time-to-kill` can reach it, and it reports a timeout |

## Damage

A hit resolves in one pass, in this order:

1. **Amplify** — the amount is multiplied by `1 + damage amp`, then by the crit
   factor.
2. **Mitigate** — physical damage against armor, magic damage against magic
   resist, true damage against nothing: the multiplier is
   `100 / (100 + resist)`. The game states the same thing as a reduction of
   `resist / (100 + resist)`.
3. **Reduce** — durability and every damage reduction each contribute
   `1 - value`, and the terms multiply.
4. **Absorb** — what survives meets shields before health.

A resistance floors at zero instead of going negative: driven below it, the stat
mitigates nothing rather than amplifying the hit. The game does the same.

Reductions multiply rather than sum, so partial reductions never add up to
immunity.

## Shields

Damage meets shields before health, oldest pool first. A pool ends when it is
spent or when it expires, whichever comes first — the spending is tracked on the
pool itself, not by the effect vocabulary.

## Healing

A heal raises health and clamps at the maximum: no overheal, and no conversion
into a shield. Nothing reduces incoming healing — the game's Wound has no
expression here.

## Mana

A unit casts when its mana reaches its maximum.

| Source            | The engine                                                                     | The game                                                            |
| ----------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Per attack        | A number on the unit. Nothing derives it from a role yet                       | 10 for assassins, marksmen and fighters, 7 for casters, 5 for tanks |
| Per second        | A number on the unit, applied once a second                                    | —                                                                   |
| From damage taken | 1% of pre-mitigation plus 3% of post-mitigation, capped at 42.5, behind a flag | The same numbers, for tanks                                         |

Two things the game does and the engine does not:

| The game                                                          | The engine                                                              |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Locks mana for about a second after a cast, longer for some units | Nothing suspends mana gain                                              |
| Carries overflow into the next cast                               | A cast resets mana to its post-cast modifier value and drops the excess |

## Ending a run

| Reason    | When                                                       |
| --------- | ---------------------------------------------------------- |
| `kill`    | The target's health reaches zero and the mode lets it die  |
| `timer`   | The window closed first                                    |
| `timeout` | `time-to-kill` reached the sixty-second cap without a kill |
