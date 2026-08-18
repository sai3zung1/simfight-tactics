# ADR 0007 — A delta belongs to a lineage

**Status:** Accepted · 2026-08

## Context

The product's question is comparative. A board is judged against another board or
against a variant of itself, and one result does not settle it.

What gets compared is not one fight against another. A run is many iterations of
one **configuration** — a board with its star levels, items, augments, positions
and declared inputs — and what it yields per measure is an aggregate over those
iterations: a central figure, and how wide it came out (ADR 0004). A delta is the
difference between two such aggregates, one per configuration.

Aggregates overlap or they do not. A difference narrower than the width of the
two it separates is not a difference.

Two runs in sequence are not two versions of one thing. A configuration where a
unit carries the damage and one where the same unit holds a trait share that unit
and answer different questions. Subtracting one aggregate from the other yields a
number that describes nothing.

The engine is exact and its input is not. A board rebuilt from a match record has
no positions (ADR 0006), and one typed in is approximate.

## Decision

A delta is the difference between the aggregates of two configurations, and it
exists only between a configuration and one derived from it. Derivation is
declared by duplicating a configuration, never inferred from the order runs
happened in.

The reference is the configuration as it arrived. Designating a run as the
reference holds it there across further changes.

A delta carries the difference in inputs beside the difference in aggregates.

Where the difference in inputs is large, no delta is shown. Two results are shown
instead.

The product states numbers. It does not name a winner and it does not word a
verdict. What is known about an aggregate — how many iterations it took, how wide
it came out — is stated as a number as well.

## Consequences

Duplicating a configuration is the central gesture of the interface rather than a
convenience on the side.

Error that applies to both sides of a lineage cancels in their difference. An
approximate board yields a usable difference and unusable absolute figures, which
is what makes an imported or hand-entered board worth running at all.

Two configurations with no common ancestor still run side by side, and get two
results.

Both sides of a comparison are run over the same iteration count, since a
difference between aggregates of different widths is not a difference between
configurations.

The size above which an input difference stops carrying a delta is not fixed
here.

An aggregate outlives the run that produced it, since a later run is measured
against it.
