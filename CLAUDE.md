# CLAUDE.md

Guidance for AI assistants working in this repo. Humans: see
[`CONTRIBUTING.md`](./CONTRIBUTING.md) — the conventions there are authoritative.

## Stack

TypeScript · React 19 · Vite · Tailwind · Bun (runtime + package manager).

## Commands

```bash
bun install
bun run dev        # dev server
bun run build      # typecheck + build
bun run lint       # eslint
bun run format     # prettier --write
```

## Rules

- Follow [`CONTRIBUTING.md`](./CONTRIBUTING.md). Do not duplicate conventions here.
- Conventional Commits, enforced by commitlint (body lines ≤ 100 chars).
- `src/domain/` stays pure: no I/O, no React, no side effects.
- Validate once at the pipeline boundary; never re-validate downstream.
- Prefer the simplest solution. No speculative abstraction or dependencies (YAGNI).
