# Simfight Tactics

> **Feel is doubt. Stats are clues. Simulation is the proof.**

A client-side **1v1 Teamfight Tactics combat simulator** for competitive
players. Feed it a full combat configuration — champions, star levels, items,
traits, and augments on both sides — and get measurable results instead of
guesswork.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)
![License](https://img.shields.io/badge/license-PolyForm%20NC-blue)

## What it does

Configure both sides of a fight and run a deterministic simulation. The tool
**reports, it does not judge**: DPS, total damage dealt and taken, effective
duration, and stop reason. You compare scenarios by running them again.

- **Decision-first** — answers "which item / star / trait actually wins this fight?"
- **Precise in, precise out** — every effect modeled faithfully, no role-based shortcuts.
- **Instant** — simulated time is virtual; every run completes in milliseconds.

## Status

🚧 **In development (pre-MVP).** The domain type system is in place; the data
pipeline, simulation engine, and UI are in progress. Work is tracked on the
[project board](https://github.com/users/sai3zung1/projects/3).

## Tech stack

| Layer         | Choice                                 |
| ------------- | -------------------------------------- |
| Language      | TypeScript                             |
| UI            | React 19 + Vite                        |
| Styling       | Tailwind CSS                           |
| Runtime / pkg | Bun                                    |
| Backend       | None — 100% client-side                |
| Data          | Community Dragon → typed TS, committed |

## Architecture

- **Modifier-based engine.** Every effect (item, trait, augment, set mechanic)
  is a modifier applied to a champion's neutral base state. The engine knows no
  specific set — a new set is _data_, not code.
- **Event-driven resolution.** Combat advances as discrete events (attacks,
  casts, procs, ticks), not on a fixed time-step.
- **Static data pipeline.** Source data is parsed and normalized into typed TS
  files at build time — no runtime dependency on external services.
- **Pure domain layer.** `src/domain/` is types and pure functions only: no I/O,
  no React.

See [`docs/adr/`](./docs/adr) for the reasoning behind these choices.

## Project structure

```text
src/
  domain/          # pure types + logic (no I/O, no React)
    primitives.ts  # branded IDs, shared leaf types
    catalog/       # game entities: Unit, Item, Trait, Augment, Spell, BaseStats
    combat/        # combat inputs: BoardSide, StopCondition, CombatConfig
  data/            # generated typed data per set (pipeline output)
docs/adr/          # architecture decision records
```

## Getting started

```bash
bun install
bun run dev        # start the dev server
```

## Contributing

Conventions, workflow, commands, and code standards live in
[`CONTRIBUTING.md`](./CONTRIBUTING.md).

## License

[PolyForm Noncommercial 1.0.0](./LICENSE) — source-available for personal,
research, and noncommercial use. Commercial use is not permitted.

© 2026 sai3zung1
