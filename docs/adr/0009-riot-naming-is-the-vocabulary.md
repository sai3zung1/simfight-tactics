# ADR 0009 — The client's names are the vocabulary

**Status:** Accepted · 2026-08

## Context

`data/` is captured content and `src/domain` is the type the application reads
it as. Until this record the capture was written to fit the domain, which
`data/manifest.json` states in its own note: field names, stat keys and union
values follow `src/domain`.

Keeping a second vocabulary costs a translation on every field, and the two did
not stay in step. Four divergences sit on the `Unit` type alone:

- `Unit.role` is one `UnitRole`; all 65 entries in `data/set-18/units.json`
  that carry a role carry an array — `["assassin"]`.
- `UnitRole` admits `specialist`; the archetypes read from the client and held
  in `data/timeless/roles.json` are tank, brawler, fighter, assassin, marksman
  and caster. The one carrying the mana figures, `brawler`, is a name no unit
  uses and the domain does not have.
- `Unit.damageProfile` is one `DamageProfile`; those same 65 entries carry an
  array — `["magic","physical"]` where Riot means hybrid.
- `BaseStats` requires `manaGeneration`. No entry carries it, on any of the 71;
  65 carry `resource`, which `BaseStats` does not declare.

No rotation introduced any of the four. Each is a thing named twice.

## Decision

Where the client exposes a name, that name is the vocabulary — in `data/`, in
`src/domain`, and in everything that reads either. The project keeps no
translation of its own.

Entry identifiers are covered: an entry is keyed by Riot's identifier rather
than by a slug of the project's making.

What the client does not expose is not covered, and that boundary is a property
of the packaging rather than a choice. A shipped Unreal build keeps the row
names of a curve table, because a curve table writes them itself; every other
object arrives with its property names stripped, which
`docs/adr/0003-empty-mechanics-come-from-the-client.md` records. Adoption
therefore reaches curve table rows, asset paths, character identifiers and the
text table, and nothing further until a property schema opens the rest. A name
the project holds where the client offers none stays the project's, and is
marked as such rather than mixed in.

This record does not touch
`docs/adr/0001-modifier-vocabulary-no-set-logic.md`. The modifier vocabulary is
what the engine resolves, not what a capture calls its fields; it stays closed
and it stays the engine's.

## Consequences

A rotation reaches further than it did. `docs/what-changes-between-sets.md`
records that each set names its variables afresh, which is the reason the
previous posture existed. Under this one a rename in the client is a rename in
the types and in everything compiled against them — loud rather than silent,
and paid once at the rotation instead of on every field of every capture.

An import stops needing a map. `docs/adr/0006-three-moments.md` records that the
catalog has to carry Riot's `character_id` and that no entry does. Keying on it
answers that, and the reading that would have added it alongside our own id
becomes part of what a capture already is.

Checking a capture against the domain becomes an equality rather than a
mapping: the two use the same key or they do not.

**The renaming of `src/domain` cannot come first.** Most of the client's names
are not known to this repository — nothing here has read a shipped build — so
the chain that reads them runs before the types can take them. Extraction
first, vocabulary second.

`data/` as it stands predates this record and follows the domain. This record
does not rewrite it; the first capture taken under the record is what replaces
it.
