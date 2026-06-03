# ADR 0001 — Community Dragon as the combat data source

**Status:** Accepted · 2026-05

## Context

The simulator needs real combat data: HP, AD, attack speed, mana, range, spell
scalings, item modifiers. Data Dragon (Riot's official CDN) exposes only id,
localized name, tier, and image for TFT entities — none of the combat data.
Riot's own documentation notes its TFT spell and item data is inaccurate.

## Decision

Use **Community Dragon** as the source of truth, parsed by a build-time pipeline
into typed TypeScript data files committed to the repository.

## Consequences

- **Pro:** game-accurate data; the app is fully offline after build, with no
  runtime dependency on Riot or Community Dragon.
- **Con:** community-maintained, so it can lag on a fresh set. The pipeline must
  be re-run each patch.
