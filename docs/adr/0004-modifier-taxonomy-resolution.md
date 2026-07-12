# ADR 0004 — Modifier taxonomy and resolution model

**Status:** Accepted · 2026-06

## Context

ADR 0002 makes every combat effect a modifier: the engine resolves modifiers and
holds no champion- or set-specific logic. This requires a fixed modifier
vocabulary and fixed resolution rules.

The vocabulary is established from champion spells, the category with the widest
variety of effects. Their patterns across sets 15/16/17 are recorded in the
modifier cartography (`docs/data/modifier-archetypes.md`): a small set of effect
families recurs while variable names change almost entirely each set.

## Decision

1. **Shape.** A modifier is one effect _kind_, from a scaling _source_, with a
   _temporality_, optionally parameterized by count, space, or threshold, and
   valued as a per-star array.
   - kind (closed set): damage, heal, shield, damage-reduction, stat-mod,
     crowd-control, mana-generation.
   - source (open set of stats): flat, AD, AP, %max-HP, armor, magic-resist,
     attack-speed.
   - temporality: instant, duration, periodic.

2. **Scaling.** Whether a value scales, and on which stat, is defined by the
   ability's description template (`@X@` vs `@ModifiedX@` with `%i:scaleY%` tags)
   and the bin calculation (`GameCalculation`), not by the variable name.

3. **Resolution.** Each effect kind has its own resolution pipeline — for damage:
   bonus, amplification, critical strike, mitigation; for heal: amplification,
   anti-heal; for shield: amplification; for mana: per-attack, per-second, from
   damage-taken, and post-cast (amended with the Set 15 roles revamp, verified
   against the official announcement and the game data). The pipeline shapes are
   fixed here. Coefficients within each pipeline are determined by calibration
   against the live game and are not fixed by this record.
   Ordering is not calibration-determined the way this record originally framed
   it: every stage resolves as one multiplicative product, so no live
   observation can distinguish an order (#51, 2026-07-12). Ordering becomes a
   live question — and a calibration target — only once a non-multiplicative
   (e.g. flat additive) stage exists; #74 (spell pipeline calibration) is the
   natural point to revisit it.

4. **Extension.** The taxonomy is extended when a later-implemented category
   presents an effect it cannot express.

## Consequences

- A new set is data: the engine encodes effect kinds, not champions.
- Vocabulary traces to the cartography, coefficients to the bin calculations.
- Coefficients stay open until calibration; the engine carries provisional
  values until then. Ordering stays open indefinitely under an
  all-multiplicative pipeline — it is not a pending calibration, it is a
  non-question until a non-multiplicative stage lands.
- The cartography becomes a dated research note referencing this record.
- Calibration results live in `docs/data/calibration-log.md` (#51), dated and
  graded by evidence source; this record's coefficients are illustrative until
  that log resolves them.
