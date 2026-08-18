# ADR 0006 — Three moments, two of them served

**Status:** Accepted · 2026-08

## Context

The product is opened at three moments: before a game, after one, and during
one. They differ in how much time the player has, and in how a board reaches the
app.

During a game is the most valuable and the most constrained. Two independent
walls close it.

No export of a running board exists. The client's team planner code carries ten
champion slots and nothing else — no items, no augments, no star levels, no
positions — and it is pasted into the client rather than produced by it. Typing a
board instead is not an alternative: ten units with their items, augments and
positions are forty to sixty separate facts, against a budget of ten seconds.

Policy closes the same moment from the other side. Riot prohibits third-party
apps and overlays, during a game, from tracking an opponent's champions and from
presenting real-time data that changes what a player does. Analysis before and
after a game is named as encouraged instead.
See <https://developer.riotgames.com/docs/tft>.

After a game, `tft-match-v1` returns the whole lobby. Each participant carries
units with `character_id`, `tier` and `items`, a list of `augments`, and traits
with the tier Riot computed. It carries no positions, and it holds one state
only: the board at elimination.

Before a game, nothing is imported. A board is composed, or taken from a list of
ready-made ones.

## Decision

The product is one mode, opened at three moments. Speed comes from what the app
fills in by itself, never from a second screen.

Nothing is built that reads a game in progress. That moment is out of scope, and
stays out while both walls stand.

After a game is the moment that imports. A match record fills both boards.
Positions are placed by hand, laid out left to right by `range` as a starting
point.

Reading a match record binds the product to Riot's developer policies.

## Consequences

The catalog has to carry Riot's `character_id`. No entry in `data/` does, and an
id map is what every import turns on.

A team planner code is read against a list Riot owns, in which a champion's value
is its position. Rebuilding that order from `data/` shifts every champion after
the first divergence, without an error. The order table is an output of the
extraction chain, remade each set.

A match record answers what a final board could have done. It answers nothing
about an earlier round, because no earlier state is recorded.

The interface carries a signed-in state, since importing needs an account.

A lobby holds seven opposing boards. Choosing among ready-made opponents is one
gesture, whether they come from a match or from a curated list.

Positions are carried by no source. Every import ends on the same manual step.
