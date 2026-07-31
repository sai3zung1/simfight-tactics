# Contributing

`README.md` sets the project up and lists the commands.

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

### Naming

Modules under `src/` are kebab-case: `stop-condition.ts`, `resolve-damage.ts`.
Tests sit beside what they test, as `<name>.test.ts`.

String values in unions are kebab-case too — `"time-to-kill"`,
`"on-damage-taken"` — so the vocabulary reads the same in a type and in a
payload.

Module-level constants are SCREAMING_SNAKE_CASE and exported `as const`. The
types that read them derive with `(typeof CONST)[number]` instead of being
written a second time.

Domain identifiers are branded strings, one type per entity: `UnitId`,
`SpellId`, `TraitId`.

A component is four files in its own kebab-case folder: `<name>.contract.ts`
for its axes and defaults, `<name>.classes.ts`, `<name>.tsx`, and
`storybook/<name>.stories.tsx`. Three of the four are plain modules, so the
files take the module casing; the exported component stays PascalCase.

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

An index points, it does not carry.

Three questions first. Does a type, a test name, a story or an error message
already carry it? Leave it there. Would clearer code remove the need? Fix the
code instead. Can every claim be checked? A claim about the code checks against
the code; a claim about TFT checks against the game — a public source, or the
knowledge of someone who plays it. A claim that checks against neither is not
written.

Where the game has something the code does not, the page says so in place. That
gap is what makes the page worth opening while implementing. A page whose
claims stop checking out is deleted, not patched.

Split on cadence, not on subject: what changes together stays on one page.

### Decisions

A decision gets a record in `docs/adr/` when it is not readable from the
artifact it produced. A dependency, a config file or a type is already its own
record: `package.json` says which runtime runs the project, and no page needs
to repeat it.

One defensible option is not a decision. If the alternatives were absent,
abandoned or divergent, there is nothing to record.

Context, decision, consequences — one numbered file each. A record is never
edited to fit what changed: a decision that no longer holds is superseded by a
new one, and both say so.
