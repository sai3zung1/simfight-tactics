# CLAUDE.md

`README.md` runs the project. `CONTRIBUTING.md` carries the conventions.
`docs/architecture.md` says what each area may read.

Three rules that bind an agent here and are written nowhere else:

- `bun run gate` is green before every commit, not only before the pull
  request.
- The docs are the reference and the code transcribes them. Where a `docs/`
  page and the code disagree, fix the code or flag the page — never silently
  side with the code.
- A `docs/` page carries the model, never the current wiring. Where the game
  has something the engine does not, the page carrying that model says so in
  place; `docs/effect-families.md` holds the gaps in the effect vocabulary.
