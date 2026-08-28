# Simfight Tactics

A combat simulator: a board goes in, an outcome comes out.

Building the next generation of builder for TFT Theorycrafter.

## Where it is

The engine resolves a fight: a time-ordered event queue, auto-attacks, spells,
mana, crowd control, shields and periodic effects, ending with an outcome and a
reason for ending. It resolves one unit against one — boards, positions and
multi-target combat are what the MVP still owes, and `docs/product.md` says what
the finished thing is.

There is no interface yet. `bun run dev` serves an empty shell; the components
that exist live in Storybook.

## What is interesting in it

**An outcome is a distribution.** A board that wins narrowly and one that wins
every time share an average, and only sampling separates them — so a run is many
runs over one board, and a seed is what makes one of them repeatable. Time is an
integer count of milliseconds, so two events on the same instant compare exactly
equal and their ordering is stable. The engine still resolves once and takes a
crit as an expected value: `Math.random` appears nowhere in `src` yet.
See `docs/adr/0004-sampled-resolution.md`.

**The engine knows no set.** Every effect is a modifier drawn from one closed
vocabulary, and a set is data handed to `simulate()` — no branch per champion,
per item or per trait. A new kind of effect stops compiling everywhere it has to
be handled, so the compiler carries the check instead of review.
See `docs/adr/0001-modifier-vocabulary-no-set-logic.md`.

**The docs are the reference and the code transcribes them.** Where TFT has
something the vocabulary cannot express — Wound, taunt, Mana Reave — the page
says so instead of the code pretending otherwise.
See `docs/effect-families.md`.

The reasoning lives in `docs/`.

## Setup

Bun runs everything. CI pins `1.3.14`.

```sh
bun install
bunx playwright install --with-deps chromium
```

`bun install` also wires the git hooks. The Playwright browser is a separate
download: installing the package alone leaves it without a binary, and the story
tests run in a real one.

## Commands

```sh
bun run dev          # dev server
bun run storybook    # component workshop
bun run gate         # what CI checks
```

The extraction chain reads an installed game client, so it takes the path to one:

```sh
bun run capture --probe "C:/Riot Games/Teamfight Tactics/Live"
```

That reports what kind of packaging the client is made of — the container format,
what compresses it, whether a key is needed — without opening a single asset. It
is what says whether a reader can open a given client at all, and it is how a
change of packaging becomes loud at a rotation instead of silent.

```sh
bun run capture --capture "C:/Riot Games/Teamfight Tactics/Live" 18
```

That opens a dated capture for a set under `captures/`, which is not versioned,
and records which client it was taken from. It refuses rather than overwrite a
capture already taken that day.

## Finding your way

`docs/architecture.md` maps the source tree — what each area holds and what it
is allowed to read.

`CONTRIBUTING.md` carries the branch, commit and pull request rules, and the
conventions the code and the pages follow.

## License

PolyForm Noncommercial 1.0.0 — see `LICENSE`.
