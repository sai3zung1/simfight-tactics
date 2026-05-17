---
date: 2026-05-16
status: active
version: 0.1.0
description: "Code-quality conventions and principles for the Simfight Tactics codebase."
---

> Code-quality reference. Companion to `PROJECT_CONTEXT.md` (strategy), `ROADMAP.md` (execution), `COLLABORATION.md` (session protocol), and `CLAUDE.md` (operational rules for Claude Code).
>
> Read once when onboarding. Reference when reviewing code. Not pasted at session opening.

## 1. Entity File Conventions

Rules for writing entity files in `src/domain/`. Reference template: `src/domain/unit.ts`.

1. **`type` over `interface`.** Closed shape, no declaration merging. Use `interface` only where third-party extensibility is intended — rare in this codebase.

2. **`readonly` on every field.** Registry data is loaded once and never mutated. Use `readonly T[]` for arrays and `Readonly<Record<K, V>>` for maps.

3. **Branded IDs as field types.** All entity references use branded string types defined in `src/domain/primitives.ts` (`UnitId`, `ItemId`, `TraitId`, `AugmentId`, `SpellId`). Bare `string` is reserved for actual free-form text (display names, descriptions).

4. **Sub-structures in their own file** when they have substance (≥4 fields) or are reused. `BaseStats` lives in `base-stats.ts`, not inline in `unit.ts`. Trivial 2–3 field shapes can stay inline.

5. **No trivial accessor functions.** TS fields are public; wrapping `unit.stats.hp[star]` in `hpAtStar(unit, star)` adds ceremony without encapsulation. Co-locate only:
   - **Type guards** (`isUnit(v: unknown): v is Unit`) — used at pipeline boundaries
   - **Smart constructors** that enforce a real invariant
   - **Domain operations** with non-trivial logic

## 2. Code Quality Principles

### Make illegal states unrepresentable

Yaron Minsky. The type system forbids invalid states at compile time, instead of validating them at runtime.

Concrete uses already in place:

- `StarLevel = 1 | 2 | 3` — no star 4 representable
- `UnitCost = 1 | 2 | 3 | 4 | 5`
- Branded IDs — `ItemId` is not assignable to `UnitId`
- `Readonly<Record<StarLevel, number>>` — TS requires all three keys to be present

To push further: `Trait.tier` is a literal union of the actual tier breakpoints (e.g. `1 | 2 | 4 | 6`), never a loose `number`.

### Parse, don't validate

Alexis King. All validation happens **once** at the boundary (`pipeline/normalize.ts`) and produces typed objects. Past the boundary, the type system carries the proof — no re-validation.

- `pipeline/normalize.ts` is the **only** place where `as UnitId`-style assertions are acceptable
- `engine/`, `ui/`, `spells/` never `try/catch` an invalid shape — it cannot exist by construction
- The engine has zero runtime validation cost per event

### Total functions

A function must be defined for **every** value of its declared input type. Throwing on a subset of valid inputs is a partial function and a lie about the signature.

- `getUnit(id: UnitId): Unit | undefined` ✓ total
- `getUnit(id: UnitId): Unit` that throws on unknown id ✗ partial

Use `T | undefined` or a `Result<T, E>` for fallible operations. Critical in the event-driven engine: a handler that throws breaks the loop.

### Domain purity

`src/domain/` contains **zero** I/O, no React, no side effects. Types and pure functions only. This is the physical enforcement of the layer rule `domain/ → nothing`.

Consequence: `bun test src/domain/` runs in total isolation — no browser, no Vite, no fixture.

### YAGNI on `Modifier`

`PROJECT_CONTEXT.md` §10: modifier taxonomy is derived from observation at step 5, not postulated in advance.

- `modifier.ts` exports an opaque slot type until step 5
- No entity pre-cables modifier variants "in case"
- If Item/Trait/Augment need an effect slot at step 2: `readonly effects: readonly Modifier[]` — keep `Modifier`'s shape opaque

### `as const` at data boundaries

Generated data files (`src/data/set-17/*.ts`) must use `as const` on literal values; otherwise TypeScript widens `cost: 1` to `number` and the `UnitCost` contract is lost at the registry level.

The pipeline emits `as const` on every entity literal it produces.

## 3. Comments

A comment exists to express what **the code cannot express itself**:

- The **why** of a decision (rationale)
- A non-obvious **trade-off**
- A **gotcha** (historical bug, hidden constraint)
- A **link** to external context (ticket, ADR, doc section)
- An **invariant** that is not type-checkable

A comment **is not** for:

- Restating what the code shows (`// increment i` above `i++`)
- Documenting project methodology or principles being applied
- Listing project conventions (they live in this file)
- Tutorial-style explanation

Every comment is **debt** because the compiler does not verify it. Write few, write justified.

Corollary — describe **shape**, not concrete values. A comment that enumerates "stats A and B scale per star, stats X/Y/Z don't" hardcodes a Riot design that can shift between sets. It rots silently. Prefer "some stats scale per star, others are flat" — accurate as the data evolves. Specific values belong in code (types, constants) where the compiler enforces them.

Kernighan & Pike: _"Comments are most useful when they say why."_
