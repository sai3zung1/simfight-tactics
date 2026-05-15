# CLAUDE.md

Operational rules for Claude Code on the Simfight Tactics project. Strategy, execution status, and session protocol live in separate documents pasted at session start (see [Documentation set](#documentation-set) below).

## Stack

- Runtime and package manager: **Bun** (installed at `~/.bun/bin/`)
- Build tool: **Vite 8**
- Language: **TypeScript 6** (strict, project references)
- UI: **React 19**
- Styling: **Tailwind v4** via `@tailwindcss/vite` (no PostCSS, no `tailwind.config.js`)

The project is Bun-only. Do not introduce `npm`, `pnpm`, or `yarn` invocations.

## Scripts

| Command                 | Purpose                                     |
| ----------------------- | ------------------------------------------- |
| `bun install`           | Install dependencies and auto-install hooks |
| `bunx lefthook install` | Manually re-wire git hooks if not active    |
| `bun run dev`           | Vite dev server                             |
| `bun run build`         | `tsc -b` then Vite production build         |
| `bun run preview`       | Preview the production build locally        |
| `bun run lint`          | ESLint on the whole repo                    |
| `bun run typecheck`     | `tsc -b` (no emit, project references)      |
| `bun run format`        | Prettier write on the whole repo            |
| `bun run format:check`  | Prettier check (no write)                   |

## Git workflow

- Branches: `SFT-XXX-short-slug` (e.g., `SFT-004-spell-modeling`)
- Commits: [Conventional Commits](https://www.conventionalcommits.org) with the ticket as scope, e.g. `feat(SFT-007): add event-driven combat loop`
- Merge strategy: see ROADMAP.md step 1

### Active hooks (Lefthook)

- `commit-msg`: commitlint rejects non-conventional messages
- `pre-commit` (parallel, **fail-only**):
  - ESLint on staged JS/TS files
  - Prettier `--check` on staged JS, TS, JSON, MD, CSS, HTML, YAML files

Hooks never auto-write. If they fail, fix the issue, restage, recommit. Never bypass with `--no-verify` unless explicitly asked.

## Formatting and linting authority

- **Prettier** owns formatting. Do not invent style rules. Run `bun run format` after non-trivial edits.
- **ESLint** owns code quality. Run `bun run lint` to validate.
- **TypeScript strict mode** is enabled. Fix errors; do not suppress with `@ts-ignore` or `any` without an inline justification.

## Documentation set

The founder pastes these three files at session start, per `COLLABORATION.md` section 2. Read them before opinionating on strategic or execution matters.

- `PROJECT_CONTEXT.md` — strategic constitution: identity, market, scope, principles, stack, architecture, risks, acted decisions, open questions. Stable.
- `ROADMAP.md` — sequenced execution journal: step statuses, sub-steps, parking lot. Live, updated each session.
- `COLLABORATION.md` — session protocol: request taxonomy, mid-session signals, closing ritual.

A fourth file, `DECISIONS_LOG.md`, will be created at the first decision that contradicts or refines an earlier one.

## Closing the loop

The founder triggers a structured recap with the signal **"closing recap"**, per `COLLABORATION.md` section 4. Do not preemptively update `PROJECT_CONTEXT.md`, `ROADMAP.md`, or `COLLABORATION.md` without that signal. The recap is reviewed line by line before any file is modified.

## Known gotchas

- `.prettierignore` must be UTF-8 without BOM. PowerShell `Out-File` and `Set-Content` default to UTF-16 LE on Windows — use `[System.IO.File]::WriteAllText($path, $content, [System.Text.UTF8Encoding]::new($false))` to write it correctly.
- Bun installs to `~/.bun/bin/`, which is **not** in the Git Bash MSYS PATH on Windows. Lefthook commands prepend it inline (`PATH="$HOME/.bun/bin:$PATH" bunx ...`). Do not remove this prepend.
- Tailwind v4 is wired via the Vite plugin (`@tailwindcss/vite`), not PostCSS. There is no `tailwind.config.js` — content scanning is automatic.
