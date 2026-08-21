# Product

The goal is to become the tool TFT players reach for.

Players theorycraft against builders today. A builder composes a board and shows
what was composed; it does not say what that board does. Simulation is the half
that is missing — a composition in, an outcome out.

Everything in the product answers one question: **what is best here?**

The question is the player's, and the answer is theirs. The product supplies
figures, and the outcome of a fight is one of them: which side won, how often,
and how wide each figure came out. What it does not supply is a ranking. It never
points at one of two configurations and calls it the better one, because that
reading is what the player came to do.

## Interface

Scrolling is searching, and a tool that leaves you searching has not answered.
The interface is built so there is nothing to scroll.

There is one interface. It is opened before a game, after one, and during one,
and what changes between those is how much the app fills in by itself — never
which screen is open. `docs/adr/0006-three-moments.md` says which of them it
imports for, and why there is one it will not read.

That interface is a desktop one. Two boards, the catalog that fills them and the
readout that comes back do not fit a phone under a rule that forbids scrolling,
and `docs/adr/0008-desktop-is-the-surface.md` says what it would take to reopen
the question.

Speed is won by removing a gesture, not by making one faster. A picker taken from
two seconds to one saves a second per unit; a board that arrives already filled
saves the ten.

Two budgets keep that honest, and both fail silently unless something checks
them:

|              |                                                                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| **A result** | five seconds. That is what fixes the iteration count rather than a setting, and the count is reported alongside the figures it produced |
| **A path**   | a stated number of gestures — an empty app to a first result, a result to its variant                                                   |

## What makes the MVP valid

One thing: **a full board resolves against a full board**. Not a duel, not a
board against a dummy — the fight the game actually plays.

A valid MVP is the engine no longer being touched, not a demo that runs.
Everything the game can express has to land in it, whether the interface
exercises it or not. A taunt changes nothing in a duel and still has to work,
because the alternative is reopening the engine later and discovering the MVP was
never valid. `docs/effect-families.md` records what the vocabulary does not
reach.

The set in flight is not the deadline. Finishing after it rotates costs nothing
that matters, because nothing ships before the MVP is whole: a simulator that is
right on half the fights cannot be trusted on any of them.

## Combat

Both sides are boards the player composes. Both fight, both lose units, and the
fight ends the way the game ends one — a winner, a loser or a draw.

The bottom board is the player's, and it is the attacker.

A training dummy stays useful and remains selectable, as a unit on the opposing
board rather than as a mode: measuring output against a target that does not
fight back is a question worth asking, and a board holding one answers it.

**The engine resolves one unit against one.** Positions, boards and multi-target
combat are what it still owes; `docs/combat-resolution.md` says what it does
today.

## What it does not simulate

A game of TFT. No economy, no shop, no sequence of rounds — the product resolves
**one fight**, and the state that fight starts from is stated rather than
replayed.

That state is an input surface, not a gap. A counter carried across rounds, a
choice a wisp opened, an item lent for the rest of a game: the player declares
it, the catalog enumerates the options and designates none. `requiresRunInput`
marks the entries that need it.

## Cadence

TFT replaces its content on a rotation, and a simulator that arrives three weeks
into a set arrives after its readers have formed their own answers.

The measure is the number of days between a set reaching PBE and the tool
simulating it. **Seven** is the target, and every structural decision answers to
it: what a new set costs is the product, more than what any one set contains.

Seven days is enough to compose a kind of effect. It is not enough to invent
one — which is why the vocabulary has to be complete before the first rotation
rather than after it. `docs/what-changes-between-sets.md` says which families a
rotation rewrites.
