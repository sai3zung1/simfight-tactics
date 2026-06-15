# Contributing

## Workflow

Work is tracked as GitHub issues on the
[project board](https://github.com/users/sai3zung1/projects/3). Each ticket is
referenced by its issue number, written `SFT-<n>` (issue #11 → `SFT-11`).

**One ticket → one branch → one PR.**

### Working on a ticket

```bash
# 1. Create a branch linked to the issue.
#    The link comes from this command, NOT from the branch name.
gh issue develop <n> --base main --name "SFT-<n>-<slug>" --checkout

# 2. Commit — Conventional Commits, scoped to the ticket, subject only.
git commit -m "<type>(SFT-<n>): <subject>"

# 3. Push.
git push -u origin "SFT-<n>-<slug>"

# 4. Open the PR. `Closes #<n>` links it to the issue and auto-closes
#    the issue when the PR is merged.
gh pr create --base main --title "<type>(SFT-<n>): <subject>" --body "Closes #<n>"
```

`<type>` is one of `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`.

### What links what

| Link                             | Created by                                           |
| -------------------------------- | ---------------------------------------------------- |
| Branch ↔ issue                   | `gh issue develop <n>` (issue's _Development_ panel) |
| PR ↔ issue + auto-close on merge | `Closes #<n>` in the PR body                         |
| PR ↔ branch                      | automatic                                            |

A branch **name** never creates a link — only the commands above do. The one
non-negotiable step is `Closes #<n>` in the PR body.

> No CLI? On the issue page, use **Create a branch** (links the branch), then
> write `Closes #<n>` in the PR description.

### Rules

- [Conventional Commits](https://www.conventionalcommits.org/), enforced by
  commitlint (body lines ≤ 100 chars). Add a body only for a non-obvious _why_.
- CI (lint, format:check, typecheck, build) must be green before merge.
- **Squash-merge** pull requests.

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

### Naming & structure

- **Files / folders**: kebab-case (`base-stats.ts`, `combat-config.ts`; folders
  `catalog/`, `combat/`).
- **Types, interfaces, branded IDs**: PascalCase (`Unit`, `BaseStats`, `UnitId`).
- **Variables, functions**: camelCase. JSON keys mirror the TS types
  (`attackDamage`, `damageProfile`).
- **Data files**: one per entity type, plural (`champions.json`, `items.json`) —
  never split by a sub-property (cost, trait); those stay queryable fields.
- **Docs vs data**: prose lives in `docs/` (ADRs, data dictionary); values live
  in `src/data/`.

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
