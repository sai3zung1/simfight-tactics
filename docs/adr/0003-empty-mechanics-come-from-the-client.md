# ADR 0003 — Empty mechanics come from the client, not from published data

**Status:** Accepted · 2026-08

## Context

The catalog in `data/` was captured from published sources: aggregator sites
for names, tooltips and prose, and CommunityDragon for the values Riot ships.
Reading it entry by entry separated the gaps into kinds, and one of them is
unlike the others — an entry names a mechanic and carries nothing that computes
it. Blackthorn grants stats from a table indexed by the sacrifice's role, star
level and cost. Primal offers four Blessings. Riftbeast's Alpha Mark grants one
of ten unique buffs. Elderwood grows three plants. Emerald Aspect pairs an ally
to a champion for bonuses no source quantifies.

Measured on 2026-08-05 against both layers CommunityDragon publishes, neither
carries any of them. The curated bundle holds Set 18's traits with the constants
their breakpoints inline, and no items, augments or playable units. The raw map
data adds item and augment records, unit shop records without stats or spells,
and repeats the trait constants unchanged. Character records are absent from the
tree entirely.

The reason is structural rather than incidental. Every gap of this kind is a
sub-object the entry references and does not inline: a table, a list of choices,
a buff carried by an entity, a statline. Published layers flatten an entry and
publish what it holds directly; they do not follow its references. No amount of
waiting on them produces the missing objects, because producing them is not what
they do.

Extraction is the remaining source, and Set 18 changed what that costs. TFT left
Riot's Hextech engine for Unreal with this set, so the shipped archives are
`.pak` and IoStore containers holding `.uasset`, and the toolchain that read
`.wad` archives and their `.bin` payloads no longer reaches them. That toolchain
is also what the published layers are built on, which is why their coverage of
the set is partial rather than absent.

The alternative was never a different source. It was to leave these mechanics as
prose and declare the gap, the way `docs/effect-families.md` records what the
vocabulary cannot express. That option is cheap, and it holds for a mechanic the
engine could not run anyway. It does not hold here: an empty object is not a
missing kind of effect, it is a computation the engine can already express and
has nothing to feed. Declaring it leaves the catalog honest and the simulation
wrong.

## Decision

A mechanic whose object is empty in every published source is extracted from the
shipped client.

Published aggregations stay in use for what they do carry — names, taxonomy,
tooltips, and the constants an entry inlines. They are read first, and they are
not the ceiling: where an entry names a mechanic and carries nothing that
computes it, the client is the source rather than the last word being prose.

Extraction reads the Unreal packaging with a UE asset parser, and it is
read-only. What lands in `data/` is derived values; no shipped file is
redistributed.

Its scope is the referenced sub-objects, enumerated before the work starts, and
not the catalog. An entry whose values are merely stale is not in scope — the
set patches daily while it is on PBE, and structure is the deliverable rather
than the current number.

A capture is a dated snapshot and it is frozen. Retaking it is an event, not a
schedule.

## Consequences

The toolchain is ours to maintain, and it breaks when the packaging changes.
That is a measured risk rather than a theoretical one: an engine migration is
what broke the previous one, mid-set.

A value obtained this way cannot be checked against a published source, because
no published source has it. It checks against the game, which makes observation
the reviewer of this path rather than a second source.

What the client does not encode is not reachable this way either. A mechanic the
simulation resolves rather than the data declares stays a question that only
watching a fight answers.

Riot stores property names as hashes, so an extracted object arrives with its
values and not always with their names. Recovering a name is a separate step,
and an object can be complete and still unreadable until it is taken.

This record decides where values come from. It does not decide what shape they
take once they arrive, and an extracted object still has to land in a vocabulary
the engine reads.
