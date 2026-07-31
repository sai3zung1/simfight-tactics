# ADR 0002 — Deterministic resolution first, sampling as a second mode

**Status:** Accepted · 2026-07

## Context

TFT combat carries chance. A crit either lands or it does not, and the outcome
of a fight moves with it.

The product answers one question — what is best here — and an answer that moves
between runs does not settle a comparison. There are two ways to get a settled
number out of a chance: sample it many times and average the results, or compute
the average once.

Sampling also answers something averaging cannot. A board that wins slightly
more than half its fights and one that wins all of them can share an average,
and only sampling separates them.

## Decision

Resolution is deterministic, and sampling is a mode built on top rather than the
way the engine works.

A crit is an expected value: every hit carries `1 + critChance × critDamage`,
the weighted average of a nominal hit and a critical one. `Math.random` appears
nowhere in `src`.

Engine time is an integer count of milliseconds, branded as `Ticks`. Two events
falling on the same instant compare exactly equal, and that detectable tie is
what makes their ordering stable rather than incidental.

## Consequences

The same input produces the same outcome, every run. A difference between two
boards is a real difference and not noise, which is what makes a comparison
worth showing at all.

The bounds come free. `CritPolicy` takes a chance and a damage figure, so
`expectedCrit` sits beside `neverCrit` and `alwaysCrit` — the worst and the best
case of the same fight, at no extra cost. Spell damage already asks for
`neverCrit`, since spells do not crit.

Variance is invisible. The engine says what a board does on average and never
how often, so a fragile board and a reliable one with the same average read
alike. That is the half sampling is for.

Sampling is a fourth policy rather than a second engine, but the policy has to
reach the hit. `auto-attack.ts` reaches for `expectedCrit` directly, so the
choice has to travel from `simulate()` down to the hit. The spell registry
already takes that path, and is the shape to follow.
