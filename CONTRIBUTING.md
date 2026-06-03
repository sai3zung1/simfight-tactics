# Contributing

## Workflow

- Branch from `main`: `type/short-slug` (e.g. `feat/engine-event-loop`).
- [Conventional Commits](https://www.conventionalcommits.org/), enforced by
  commitlint (body lines ≤ 100 chars).
- Open a PR and reference its issue (`Closes #NN`). CI — lint, typecheck,
  format, build — must be green before merge.
- Work is tracked on the
  [project board](https://github.com/users/sai3zung1/projects/3).

## Commands

```bash
bun install
bun run dev        # dev server
bun run build      # typecheck + build
bun run lint       # eslint
bun run typecheck  # tsc
bun run format     # prettier --write
```

## Code conventions

### Domain entities (`src/domain/`)

- `type` over `interface` — closed shapes, no declaration merging.
- `readonly` on every field; `readonly T[]` and `Readonly<Record<K, V>>`.
- Reference entities by **branded IDs** (`UnitId`, `ItemId`, …), never bare `string`.
- A sub-structure gets its own file when it has substance (≥ 4 fields) or is reused.
- No trivial accessor wrappers; co-locate only type guards, smart constructors,
  and real domain logic.

### Principles

- **Make illegal states unrepresentable.** Encode constraints in types
  (`StarLevel = 1 | 2 | 3`).
- **Parse, don't validate.** Validate once at the pipeline boundary; downstream
  trusts the types.
- **Total functions.** Defined for every input — return `T | undefined`, never
  throw on a valid input.
- **Pure domain.** `src/domain/` has no I/O, no React, no side effects.
- **YAGNI.** No speculative structure (e.g. `Modifier` stays opaque until the
  real data dictates its shape).
- **`as const`** on generated data literals, so the type contract survives.

### Comments

Explain **why**, not **what**: rationale, trade-offs, gotchas, and invariants
that the compiler cannot check. Never restate the code. Describe _shape_, not
concrete values — specific numbers rot between sets.
