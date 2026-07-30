# Contributing

## Setup

Bun runs everything. CI pins `1.3.14`.

```sh
bun install
bunx playwright install --with-deps chromium
```

`bun install` also wires the git hooks. The Playwright browser is a separate
download: installing the package alone leaves it without a binary, and the
story tests run in a real one.

## Commands

```sh
bun run dev          # dev server
bun run storybook    # component workshop
bun run gate         # what CI checks
```

Run `bun run gate` before opening a pull request. CI runs the same steps plus
the build.

## Branches, commits, pull requests

A branch is named after the ticket it carries: `SFT-<ticket>-<slug>`. Paired
tickets share one branch and one pull request.

Commits follow Conventional Commits, with the ticket number as the scope:

```text
feat(SFT-49): mana generation and casting
```

`commitlint` enforces the format; it does not enforce the scope. A commit
without its ticket number cannot be traced back to why it happened.

Pull requests use the template and close their ticket with `Closes #<ticket>`.

## Conventions

Self-contained: a ticket number and a repo path are the only references that
survive.

### Comments

The default is none — a comment is an exception, maintained like code, and a
false one costs more than an absent one.

Explain **why**, not **what**: rationale, trade-offs, gotchas, and invariants
that the compiler cannot check. Never restate the code. Describe _shape_, not
concrete values — specific numbers rot between sets. No blanket doc on exports
or files.

Three questions first. Would a rename, an extraction or a narrower type remove
the need? Fix the code instead. Does a test name, an error message or a story
description already carry it? Leave it there. Can every claim be checked
against the code? If not, do not write it.

### Documentation

One reader: a developer fluent in the stack, with no context on this project.
Nothing is written for anyone else.

The default is no page. A page is an exception, maintained like code, and a
false one costs more than an absent one.

Three kinds, never mixed in one page. **Explanation** — why a decision was
taken, and what the structure is. **Reference** — facts to look up.
**How-to** — a repeated gesture, in order.

`README.md` is a map, not a page: what the project is, how to run it, where
things live. Anything it starts to explain belongs elsewhere. The same holds
for any index — it points, it does not carry.

Three questions first. Does a type, a test name, a story or an error message
already carry it? Leave it there. Would clearer code remove the need? Fix the
code instead. Can every claim be checked against the code? If not, do not
write it — and a page whose claims stop checking out is deleted, not patched.

Split on cadence, not on subject: what changes together stays on one page.
