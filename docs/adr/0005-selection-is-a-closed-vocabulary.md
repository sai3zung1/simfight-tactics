# ADR 0005 — A spell states who it hits, and the engine resolves it

**Status:** Accepted · 2026-08

## Context

ADR 0001 closed the vocabulary of what an effect does, and made a spell a pure
function returning modifiers. It left one axis at two values, because a fight had
two combatants: an effect lands on `"self"` or on `"opponent"`.

A board against a board breaks that. Read off the catalog, the game's answer to
_who_ is around eleven shapes — the target, what stands adjacent to it, a radius,
a line, a cone, the nearest few, a jump, a chain of bounces, a row, the lowest or
highest on a stat, and a number picked at random. Titanic Hydra hits the target
and its neighbours; Luden's Tempest hits the two enemies closest to it.

Two ways to carry that were live.

The first has the spell call functions that resolve the shape and hand back the
effects — combinators that run. It reads well and it authors fast, and it fails
on timing: a shape resolved inside the spell is resolved **at cast**. The engine
already does this and already pays for it. `schedulePeriodicTicks` queues every
tick up front with its target fixed, which is invisible against one opponent and
wrong on a board — a burn on everything within two hexes has to recompute on each
tick, because units move and units die.

The second has the spell state the shape and the engine resolve it. The
indirection is real: reading a spell no longer shows what a shape does.

A third was weighed and dropped: the spell itself as data, over an expression
language. Amounts that read the fight and conditions like _every fourth cast_ or
_below half health_ would each need that language designed, documented and
debugged. A function already expresses them, and the compiler already checks it.

## Decision

A spell stays a pure TypeScript function returning effects. What changes is one
axis.

**Who an effect lands on is a closed `Selection` vocabulary**, on the same terms
as `Modifier`: a shape the engine cannot resolve stops compiling everywhere it
has to be handled, rather than resolving wrong.

**A selection names which, never where.** Positions belong to the board and move
during a fight. A spell states the shape; resolving it against hexes belongs to
the engine, in one place.

**The vocabulary is exposed as constructors** — `primary()`, `around(primary(),
1)` — that return the shape rather than resolve it. Authoring reads as
composition; the value handed to the engine stays inert data.

**A selection resolves when the effect lands, not when the spell is cast.** Every
application re-reads the board.

The escape hatch stays first class. A spell whose amount or condition reads the
fight is written in TypeScript, as it is today.

## Consequences

`recipient` goes, and every spell carrying it changes with its tests. That is
eight fixtures today and sixty-five kits after the Set 18 catalog lands, which is
why this is decided before them rather than after.

Hex geometry is written once, in the resolver. No spell reimplements it, and a
bug in it is one bug.

A shape a future set brings is one constructor and one branch, and the compiler
names the branch. What a new set costs is what `docs/product.md` measures, and
this is most of the answer for spells.

Effects stay serialisable, which pays three times: a run replays under its seed
(ADR 0004), a spell tests without a board, and a `GameplayEffect` maps onto the
same shape if extraction ever opens the client's own (ADR 0003).

Resolving per application costs more than resolving once, and that cost is
multiplied by the iteration count sampling brings. Selection joins the hot path
this way, deliberately.
