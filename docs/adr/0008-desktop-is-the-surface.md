# ADR 0008 — Desktop is the surface

**Status:** Accepted · 2026-08

## Context

Nothing in the repository had ever said which screen the product is for.
Measured: `responsive`, `mobile`, `viewport` and `breakpoint` appear nowhere in
`docs/`, `README.md`, `CONTRIBUTING.md` or `CLAUDE.md`. A ticket was nearly
written to add breakpoints, which would have settled the question by
implementation instead of by decision.

The question is live on both sides.

TFT ships a mobile client and a large share of the game is played on it. ADR 0006
keeps two of the three moments — before a game and after one — and a player who
finishes a game on a phone is holding, at that moment, the device this product
would be opened on.

Against that stands what the interface has to be. `docs/product.md` makes one
rule structural: scrolling is searching, and the interface is built so there is
nothing to scroll. What has to fit without scrolling is two boards of four rows
by seven columns, the catalog that fills them, the items, augments, wisps and
traits each side carries, and the readout that comes back. On a wide screen that
is already the hardest constraint the product sets itself. At phone width it is
not the same constraint, and what would satisfy it is not the same application.

Composing is the whole product. A phone-sized version of it is a second product,
not a narrower one.

## Decision

The surface is desktop. Mobile is a non-goal, not a deferred goal.

Nothing is built responsive — no breakpoints, no touch targets, no phone layout —
and no ticket assumes one.

One door stays open, and it is named here rather than left to be rediscovered:
**reading a result is not composing a board.** Slice 14 fills both boards from a
match record, and the readout of an imported match is the one surface that would
work on a phone, because it asks the player to read rather than to place. If
mobile is reopened, it is reopened for that view alone. For any other, the
paragraph above is what has to be defeated first.

## Consequences

Layout primitives are written against one class of screen, which is what keeps
the primitives ticket a component and not a system.

The gesture budget in `docs/product.md` — an empty app to a first result, a
result to its variant — is counted with a mouse and a keyboard. Whatever checks
that budget checks it on that basis and on no other.

A phone visitor gets a page that does not fit. That is a chosen cost, recorded
here so that meeting it later is not mistaken for a defect.

Riot's developer policies are untouched by this. They constrain when the product
is opened, not what it is opened on.
