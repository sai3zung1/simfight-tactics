# Combat resolution

How two compositions become an outcome. Every number here is in the engine, and
the ones the game fixes are shown next to what the game says.

## Resolution

An outcome is a distribution. A single pass answers what a board does on average
and never how often, and the difference is the whole question: a board that wins
narrowly and one that wins every time share an average.

Chance sits in more than one place. A crit lands or it does not. Targeting is the
second source — a unit's role weights how likely it is to be targeted, a tank
more and an assassin less, and equal candidates still have to be separated
somehow. Averaging the first and picking the second by rule would settle both, by
inventing a certainty the game does not have.

A run is therefore many runs over one board, and a seed is what makes one of them
repeatable. Repeatability comes from the seed, never from removing the chance.

Time is an integer count of milliseconds, which lets two events on the same
instant compare exactly equal and keeps their ordering stable.

**None of this is wired.** The engine resolves once, taking a crit as an expected
value — `1 + critChance × critDamage`, the weighted average of a nominal and a
critical hit — and carries no source of chance at all: `Math.random` appears
nowhere in `src`.

`CritPolicy` is the seam a rolling policy lands on, beside `expectedCrit`,
`neverCrit` and `alwaysCrit` in the same file. What is missing is the path:
`auto-attack.ts` imports `expectedCrit` directly instead of receiving a policy,
so the choice has to travel from `simulate()` down to the hit. `SpellRegistry`
already takes that path.

## Time

|                      |                                                                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| One tick             | One millisecond                                                                                                                     |
| Auto-attack interval | `1 / attack speed` seconds                                                                                                          |
| **Overtime**         | **Nowhere.** Past a threshold the game escalates a fight until it resolves, so no round ever runs out of time. Nothing expresses it |
| Safety cap           | Sixty seconds, standing in for overtime. Only `time-to-kill` can reach it, and it reports a timeout — a reason the game never gives |

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
into a shield. Nothing turns damage dealt into healing, and nothing reduces
incoming healing: the game's Wound has no expression here.

## Mana

A unit casts when its mana reaches its maximum.

| Source            | The engine                                                                     | The game                                                            |
| ----------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Per attack        | Fixed by the unit's role                                                       | 10 for assassins, marksmen and fighters, 7 for casters, 5 for tanks |
| Per second        | A number on the unit, applied once a second                                    | —                                                                   |
| From damage taken | 1% of pre-mitigation plus 3% of post-mitigation, capped at 42.5, behind a flag | The same numbers, for tanks                                         |

Two things the game does and the engine does not:

| The game                                                          | The engine                                                              |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Locks mana for about a second after a cast, longer for some units | Nothing suspends mana gain                                              |
| Carries overflow into the next cast                               | A cast resets mana to its post-cast modifier value and drops the excess |

## Ending a fight

The game ends a fight three ways and only three: a winner, a loser, or a draw.
Overtime is what guarantees it — a fight that would otherwise stall is escalated
until one side falls, so a round never ends because time ran out.

What the tool **measures** is a separate question. Asking how fast a board kills
and asking how much damage it deals inside a window are two readings of the same
fight, not two ways of ending one.

**The engine holds the two in one type.** `StopCondition` picks a mode, and the
mode decides the reading, the time limit and whether the target may die at all:

| Mode             | Time limit       | Target dies | Reason if the limit is reached |
| ---------------- | ---------------- | ----------- | ------------------------------ |
| `time-to-kill`   | sixty-second cap | yes         | `timeout`                      |
| `fixed-duration` | the given window | **no**      | `timer`                        |
| `first-trigger`  | the given window | yes         | `timer`                        |

A kill reports `kill` in all three. Two of the three reasons describe the tool
running out of patience rather than a fight ending, and `fixed-duration` keeps
the target alive on purpose so a kill cannot cut the measurement short.

Separating the outcome from the measurement window is what this page will
describe once the engine does it.
