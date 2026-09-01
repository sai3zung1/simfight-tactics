# ADR 0010 — Riot is the only source

**Status:** Accepted · 2026-08 — supersedes the second decision clause of
`docs/adr/0003-empty-mechanics-come-from-the-client.md`

## Context

ADR 0003 makes the shipped client the source of a mechanic whose object is empty
everywhere else, and keeps published aggregations in use beside it for what they
do carry — names, taxonomy, tooltips, and the constants an entry inlines — read
first.

`data/manifest.json` names four of them for the capture in place: lolchess for
units, abilities and the set's wisp and augment pools; metatft for trait
descriptions, augment stages and the augment category taxonomy; CommunityDragon
for Riot's own data republished; tactics.tools, read to date the others rather
than to value them.

Two things make that arrangement cost more than it returns.

A published source moves on a schedule that is not this project's. A set rotates
every four to six months, and `docs/product.md` puts seven days between a set
reaching PBE and the tool simulating it. Nothing obliges a third party to be
ready inside that window, and a chain that waits on one has a deadline it does
not control.

The coverage is also already breaking. ADR 0003 records, measured on 2026-08-05,
that the toolchain the published layers are built on is the one that stopped
reaching TFT's packaging when the game moved to Unreal: the curated bundle
carries no items, augments or playable units for Set 18, the raw map data
carries unit shop records without stats or spells, and character records are
absent from the tree entirely. Republished Riot data is still a third party's
reading of it.

## Decision

What Riot ships is the only source, and the shipped client is what Riot ships.
A published aggregation is not read, and nothing in `data/` is sourced from one.

A value, a name, a taxonomy or an asset the client does not expose is not
fetched elsewhere. It stays absent and is marked as absent, the way `null`
already marks a question the extraction asked and could not answer.

ADR 0003's first clause stands: a mechanic whose object is empty in every source
is extracted from the client. What this record removes is the fallback that one
kept open beside it.

## Consequences

Everything the four sources supplied is provisional until the client is read for
it. `data/set-18/wisps.json` is the largest block — it stands at `partial`, with
163 of the 181 charms the client defines carried by published sources.

The art goes with it. `src/assets/icons/ATTRIBUTION.md` records that all 636
files come from lolchess or CommunityDragon, and that the 36 trait icons are not
Riot files at all but lolchess's own vectorisations. Every family is re-taken
from the client, and the trait icons change from SVG to the raster textures Riot
ships.

The augment category taxonomy leaves with metatft, whose scheme it is rather
than Riot's. Resolving the client's own hashed labels is what replaces it, and
until that lands the slot is empty rather than filled by someone else's
classification.

Dating a capture stops leaning on another build's publication. The client states
its own version, in `Engine/Build/Build.version`.

`data/` as it stands was built on the four sources and predates this record.
This record does not rewrite it; it states what has to come back from the client
before the capture is Riot's alone.
