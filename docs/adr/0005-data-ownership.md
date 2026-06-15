# ADR 0005 — Data ownership: owned schema, swappable source

**Status:** Accepted · 2026-06

## Context

ADR 0001 selected Community Dragon as the combat data source and framed it as
the source of truth — a reasonable conflation when it was the only available
data and the project had not yet committed to a data-driven design. The project
is now data-driven: the engine encodes effect kinds and a new set is data
(ADR 0002, 0004). The source of truth has accordingly moved from an external
feed to the artifact the project owns. This record relocates it and recasts the
external source as a swappable input. It supersedes the source-of-truth framing
of ADR 0001; the rest of ADR 0001 stands.

Across TFT sets, only Units and Traits are recomposed wholesale. Items,
augments, and the stat schema persist as a base — though that base can still
shift at a set boundary (e.g. a new item replacing another) and otherwise
evolves by patch. Source dependence is concentrated, not total.

## Decision

1. **Source of truth.** The project's source of truth is the normalized dataset
   it owns and commits — the schema, the semantics, and the maintained
   current-patch state. Combat values are not authored here: they originate in
   the live game. Values are restructured and interpreted, never invented or
   derived.

2. **Sources and authority.** Two external sources surface the same game truth:
   - _Official Riot_ (patch notes, site, client) — the authoritative reference
     and the source of record for new content (new set or patch). Human-readable,
     not machine-complete.
   - _Community Dragon_ — the default extraction adapter for machine-complete
     values; community-maintained and can lag. It sits behind an adapter mapping
     it to the normalized format, so it can be swapped — e.g. standalone mining
     (#36) — without altering the format or its consumers.

   Extracted values reconcile toward the official reference; where the official
   surfaces are silent (e.g. internal coefficients), the extraction stands.

3. **Set versus patch.** A new set recomposes Units and Traits wholesale and may
   alter the base (new or replaced items); the base otherwise evolves by patch.
   New content is taken first from the official channel, then completed and
   confirmed by extraction.

4. **Maintained surface.** Only the current patch is maintained and supported.
   Each patch's state is committed; version-control history is the archive. There
   is no separate snapshot store.

5. **Standalone mining.** Owning extraction end-to-end is deferred to explicit
   triggers (#36).

## Consequences

- Downstream code depends on the owned normalized dataset, never on an external
  feed directly.
- Swapping the extraction source touches only the adapter, not the normalized
  format or its consumers.
- New content lands from the official channel first, so a lagging extraction
  source does not block a fresh set or patch.
- Reproducing a past patch means checking out its commit; the project never
  depends on a source retaining history.
- The committed current state builds offline (ADR 0001); recovering a lost
  extraction source is deferred to #36's triggers.
- Each value keeps its originating surface for traceability; reconciliation and
  the exact capture mechanism belong to the pipeline implementation, not this
  record.
