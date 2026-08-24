# Lifetimes

How long an effect lasts. `docs/effect-families.md` records what an effect does;
this page records when it stops, and what has to hold it until then.

One word first, because the game and the product spend it differently. A **run**
here is one simulation of one fight, repeated over its iterations — what the run
control starts. The game's own sequence of rounds is never simulated, so it is
called a **game** on this page and nothing else is.

The scales run past a fight. Three of them live inside one, and the engine
expresses those. The two above belong to a game, and they are not the engine's to
hold.

| Scale     | What it means                                     | Where it lands                                                                                                                     |
| --------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Instant   | Lands and is done — a hit, a heal                 | `Temporality` → `instant`. Nothing to undo, so nothing to hold                                                                     |
| Duration  | Runs for a number of seconds, then lifts          | `Temporality` → `duration`. The expiry is scheduled when the modifier is applied                                                   |
| Periodic  | Ticks on an interval — a burn, a regeneration     | `Temporality` → `periodic`, with `instance` for a tick that lapses and `accrual` for one that does not                             |
| **Fight** | Holds to the last hit                             | **Convention, not a value.** A modifier with no duration is never expired, which is right and is nowhere stated                    |
| Game      | Holds across rounds and ends with the game        | Not resolved — **declared**. The player states what a game accumulated, and the engine reads the total                             |
| Permanent | Accrues round after round and is never given back | Same. The difference is whether the game's end takes it back, and that difference is the player's to know rather than the engine's |

## Why the two upper scales are not the engine's

The game keeps handing out effects that outlive a fight. A wisp lends an item for
a game. A consumable is spent on a champion and stays. Veigar accrues 1.5%
ability power per kill and carries the total forward. Maokai's Old Growth banks
30 permanent health per nearby death.

None of that is a fight the product simulates. Replaying the game that produced
the total would mean simulating economy, shop and rounds — everything
`docs/product.md` says the product does not do.

So the total is stated once and read. That is what `requiresRunInput` marks in
`data/`: an entry carrying a state no calculation derives, whose options the
catalog enumerates without designating one.

## Borrowed effects

What is lent has to be told apart from what the player placed — on screen, and in
what the app clears.

Two properties, and they are one property seen from both ends:

- **A borrowed effect announces itself.** Where a wisp opens a choice — one
  option for Phantom Vest, three for Doodad Sack — the choice is taken in the app
  rather than mimed on the board, and what it grants is marked for what it is.
- **A borrowed effect takes itself back.** The run ends, the loan lapses, and no
  step is left to the player, because the step a player has to remember is the
  step a player forgets. What the player placed stays until the player clears it.

Neither is a lifetime the engine holds. Both belong to the app, and both hold
across the iterations of one run.

## What is missing to express it

One scale, not three.

`Temporality` reaches the end of a fight and stops, which is enough — the two
scales above it are input rather than resolution. What it lacks is at the bottom
of its own range: **the fight scale itself has no value**. A modifier with no
duration is never expired, and nothing distinguishes one that means _for the rest
of the fight_ from one whose duration was forgotten.
