# Lifetimes

How long an effect lasts. `docs/effect-families.md` records what an effect does;
this page records when it stops, and what has to hold it until then.

The scales run past the fight. Three of them live inside one, and the engine
expresses those; the two above it belong to a run, and nothing expresses them
yet.

| Scale         | What it means                                     | Where it lands                                                                                         |
| ------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Instant       | Lands and is done — a hit, a heal                 | `Temporality` → `instant`. Nothing to undo, so nothing to hold                                         |
| Duration      | Runs for a number of seconds, then lifts          | `Temporality` → `duration`. The expiry is scheduled when the modifier is applied                       |
| Periodic      | Ticks on an interval — a burn, a regeneration     | `Temporality` → `periodic`, with `instance` for a tick that lapses and `accrual` for one that does not |
| **Combat**    | Holds to the last hit of the fight                | Convention, not a value: a modifier with no duration is never expired. Nothing says so                 |
| **Run**       | Holds across fights, and ends with the run        | **Nowhere.** The engine is handed one fight and forgets it afterwards                                  |
| **Permanent** | Accrues fight after fight and is never given back | **Nowhere.** Same reason, plus the total has to survive between two fights                             |

## Why the two upper scales matter

The game keeps handing out effects that outlive a fight. A wisp lends an item
for a run. A consumable is spent on a champion and stays until the run ends.
Veigar accrues 1.5% ability power per kill and carries the total forward.
Maokai's Old Growth banks 30 permanent health per nearby death.

They differ in one thing only — whether the run's end takes them back — and the
model has no place for either.

## What that costs the player

An effect the app cannot expire is an effect the player has to remember.

Take a wisp that lends a Bramble Vest. If the app only shows the wisp as a
picture, the player equips the vest by hand, and nothing on screen says it is on
loan. When the run ends, the vest is still sitting on the champion. The next run
starts from a board that is wrong, and every number it produces is wrong with
it — quietly, because the data is intact and only the state is stale.

Two properties follow, and they are the same property seen from both ends:

- **A borrowed effect announces its term.** Where a wisp opens a choice — one
  option for Phantom Vest, three for Doodad Sack — the choice is taken in the
  app rather than mimed on the board, and what it grants is marked for what it
  is.
- **A borrowed effect takes itself back.** The run ends, the loan lapses. No
  step is left to the player, because the step a player has to remember is the
  step a player forgets.

Accrual is the mirror case: it never lapses, so the player states it once — the
running total — and the engine reads it rather than replaying the game that
produced it. That is what `requiresRunInput` marks in `data/`.

## What is missing to express it

`Temporality` reaches the end of a fight and stops. Carrying the two scales above
it takes three things it does not have:

- an **end that is not a number of seconds** — the end of a run is an event, not
  a duration
- a **holder that outlives a fight**, since `simulate()` is given one fight and
  returns a result
- a way to tell a **borrowed** effect from an **earned** one, because they are
  written identically today and only their term differs
