# ADR 0003 — Build from scratch (no fork of existing simulators)

**Status:** Accepted · 2026-05

## Context

Prior open-source TFT simulators exist (notably
tacticians-academy/teamfight-simulator) but are abandoned (stuck around set 11)
and architecturally divergent from the goals here.

## Decision

Build the engine and data layer from scratch, using prior projects only as
conceptual reference — never as a fork or code base.

## Consequences

- **Pro:** no inherited tech debt; full alignment with the modifier-based design
  (ADR 0002).
- **Con:** more upfront work, accepted deliberately. Spell modeling remains the
  largest cost regardless of approach.
