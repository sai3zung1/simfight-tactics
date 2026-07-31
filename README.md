# Simfight Tactics

A combat simulator for Teamfight Tactics. A board goes in, an outcome comes out.

Players theorycraft against builders, and a builder only ever shows what was
composed — never what it does. This is the other half.

## Where it is

The engine resolves fights: a time-ordered event queue, auto-attacks, spells,
mana, crowd control, shields and periodic effects, ending with an outcome and a
reason for ending.

There is no interface yet. `bun run dev` serves an empty shell; the components
that exist live in Storybook.

## What is interesting in it

**Nothing is rolled.** A crit is an expected value rather than a coin flip, and
time is an integer count of milliseconds, so two events on the same instant
compare exactly equal. The same board gives the same outcome, every run —
`Math.random` appears nowhere in `src`.
See `docs/adr/0002-deterministic-resolution-first.md`.

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

## Contributing

`CONTRIBUTING.md` carries the branch, commit and pull request rules, and the
conventions the code and the pages follow.

## License

PolyForm Noncommercial 1.0.0 — see `LICENSE`.
