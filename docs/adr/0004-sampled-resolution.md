# ADR 0004 — Sampled resolution, and no deterministic mode

**Status:** Accepted · 2026-08 · supersedes ADR 0002

## Context

ADR 0002 made resolution deterministic and left sampling as a second mode built
on top. It rested on one reading of the model: a crit is the only chance a fight
carries, so averaging it settles every question a comparison can ask.

That reading does not hold, and it fails on both halves.

Chance is not one source. Targeting is a second, and it is not an edge case: a
unit's role weights how likely it is to be targeted, and two equally good
candidates still have to be separated. There is no average of a tie. A
deterministic run has to pick one by rule — first in the list, lowest id — and
whatever it picks is a certainty the game does not have. The determinism would
not be a property of the model; it would be an artefact of the tie-break.

And an average is not the answer the product owes. It answers one question — what
does this board do — and hides the one a player is actually asking, which is
whether it holds up. A board that wins narrowly and one that wins every time
share an average and are not the same board.

Determinism was bought for repeatability: the same input giving the same outcome
is what makes two boards comparable rather than noisy. That is worth keeping, and
a seed buys it without buying the rest.

## Decision

Resolution is sampled. There is no deterministic mode.

A run is many iterations over one board, and the result is a distribution rather
than a number. Chance is drawn from a seeded generator, never from `Math.random`
directly: repeatability comes from the seed, and a run that cannot be replayed
cannot be debugged or compared.

Two boards compared inside one run share their seeds, so a difference between
them is a difference between the boards.

`expectedCrit` stops being the model. It survives, with `neverCrit` and
`alwaysCrit`, as a bound — an answer to _at best, at worst_, which is a question
worth asking and is not the same question.

Engine time stays an integer count of milliseconds. Two events on the same
instant compare exactly equal, and that detectable tie is what keeps their
ordering stable — which sampling needs more than determinism did, because a seed
only replays a run whose event order is reproducible.

## Consequences

The policy has to reach the hit. `auto-attack.ts` imports `expectedCrit` directly
instead of receiving one, so the choice has to travel from `simulate()` down to
the hit. `SpellRegistry` already takes that path and is the shape to follow.

Cost multiplies by the iteration count. One fight was the unit of work; now it is
one fight times N, and the per-fight cost stops being an implementation detail —
it decides how many iterations an answer can afford, and therefore how fine a
comparison the product can make. Throughput becomes a product constraint, not an
optimisation to schedule later.

The interface gains a number it did not have. How many iterations separate two
boards is a real question with a wrong answer in both directions, and something
has to choose it or expose it.

Nothing gets cheaper by being deterministic any more. A test that pinned an exact
figure has to pin a seed instead, or assert over a distribution.
