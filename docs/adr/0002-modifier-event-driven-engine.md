# ADR 0002 — Modifier-based, event-driven engine

**Status:** Accepted · 2026-05

## Context

TFT combat mixes many effect sources (items, traits, augments, set mechanics)
and discrete triggers (attacks, casts, procs, periodic ticks). The simulator
must stay correct and extensible across sets without constant engine rewrites.

## Decision

- **Modifier-based composition** — every effect is a modifier applied to a
  champion's neutral base state. The engine knows no specific set or item, only
  how to apply modifiers in a deterministic order.
- **Event-driven resolution** — combat advances event by event, not on a fixed
  time-step.

## Consequences

- **Pro:** a new set is _data_, not code; a new mechanic is a new modifier kind,
  not an engine change.
- **Pro:** each modifier and spell is unit-testable in isolation.
- **Con:** the modifier taxonomy must be derived from real set data before it
  can be frozen (handled in the data pipeline).
