# ADR 0001 — One modifier vocabulary, no set logic in the engine

**Status:** Accepted · 2026-06

## Context

TFT combat draws its effects from many sources — champion spells, items,
traits, augments, set mechanics — and fires them on discrete triggers: an
attack lands, a cast completes, a timed effect expires, an over-time effect
ticks. Every set replaces most of that content while the shapes of the effects
recur.

An engine that names those sources cannot survive the churn: each set would add
branches, and the branches would outlive the set that needed them.

## Decision

Every effect is a `Modifier` drawn from a closed vocabulary, and the engine
resolves that vocabulary only.

A spell is a pure function of the combat context returning modifiers (`SpellFn`
in `src/engine/spell/contract.ts`). It receives stats and hp, nothing it can
write to. Spells reach the engine through a registry handed to `simulate()`,
which defaults to empty: the engine runs with no set loaded.

Triggers are events on a time-ordered queue rather than a polled loop. Each
event kind has exactly one handler, dispatched through an exhaustive switch.

## Consequences

The vocabulary is the ceiling. Anything a set needs that no modifier kind can
express takes an engine change rather than a data change — which is why what
the vocabulary admits is a decision of its own.

A new modifier kind or event kind stops compiling everywhere it has to be
handled: `apply-effects.ts` and `process-event.ts` both close their switch on
`never`. That check belongs to the compiler, not to review.

Resolution lives in one place, so a resolution bug is one bug instead of one
per champion — and one bug that reaches every unit at once.

Adding a set will be adding data, but not yet. Two lookups are involved and
only one of them is code: `src/sets/fixture/registry.ts` maps a spell id to its
function — the vocabulary being expressed, which stays code. The other, which
unit casts which spell and with which numbers, is data. Its types already exist
(`Unit.spellId`, `Spell.parameters`); the data does not.

Until it does, `src/engine/provisional/` stands in for the catalog and imports
`src/sets/fixture/` to do it, inverting the dependency this record sets out. It
is quarantined under that name and removed by #39.
