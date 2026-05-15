---
date: 2026-05-15
status: active
version: 0.6.0
description: "Strategic constitution of the Simfight Tactics project. Stable layer of the documentation set."
---

> Strategic context document. Companion to `ROADMAP.md` (execution journal) and `COLLABORATION.md` (session protocol). Paste this file at the start of each session with Claude or Claude Code, alongside the other two.

## 1. Project Identity

### Working Name

Simfight Tactics.

### Nature

Software application for Teamfight Tactics (TFT) players.

### Product Type

1v1 combat simulator. Takes a full combat configuration as input — champions, star levels, items, traits, and augments on both sides — and produces measurable simulation results. The product does not privilege any single input dimension: items, traits, augments, and star levels are all first-class parameters.

### One-Line Vision

Enable TFT players to move from feeling to proof on any combat decision, through a precise simulator.

### Official Pitch

> Feel is doubt. Stats are clues. Simulation is the proof.

## 2. Founder Profile

- Professional stack: developer
- Passion stack: high-level TFT player (peak Challenger), formerly top 1% in MOBA
- Mindset: tryhard, cold self-assessment ability, method-driven optimization
- Planned workflow: collaboration with Claude (strategic thinking) and Claude Code (implementation)
- Status: solo founder, project at genesis stage

## 3. Market Positioning

### Target User

Competitive TFT players on a progression plateau. Typically the player who feels they are making bad combat decisions — items, traits, augments, star priorities, matchup assessments — without being able to pinpoint which ones. Not the beginner, who does not know they should doubt. Not the world-top player, whose intuition is already refined.

### Tool Hierarchy in the Ecosystem

The product situates itself at the top of a three-level hierarchy of decision aids:

1. Feel, level 1 — raw intuition, the player guesses
2. Stats, level 2 — global aggregated data (Metatft, tactics.tools, lolchess), general averages, not contextualized
3. Simulation, level 3 — this product, which simulates the player's specific situation

The product is not positioned in direct competition with existing stats tools. It sits above them, as a complement.

### Competition

| Tool                                        | Type                                           | Threat Level                                                                                                                 |
| ------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Tactician's Calculator                      | DPS simulator                                  | Low. Dormant project, unedited Nextra placeholder docs, no community presence, no visible updates for recent sets.           |
| tacticians-academy/teamfight-simulator      | Open-source TFT combat simulator in TypeScript | Low. Abandoned since March 2024 (stuck around set 11). Conceptually adjacent to Simfight Tactics. Built on Community Dragon. |
| TFTactics (Overwolf)                        | Overlay and item builder                       | Adjacent. Does not perform simulation.                                                                                       |
| Tactical Toolkit (iOS)                      | Positioning sandbox and tier list              | Adjacent. Does not perform simulation.                                                                                       |
| TFTAcademy                                  | Pro recommendations, in-game planner           | Adjacent. Different approach.                                                                                                |
| Metatft, tactics.tools, lolchess, OP.GG TFT | Global stats                                   | Complementary, not competitive.                                                                                              |

No tool occupies the exact "fast 1v1 simulator, decision-first" niche. The ecosystem is dense, but a clear window exists.

## 4. MVP Scope

### Validation Target vs Release Target

Set 17 is used as the technical validation target: full pipeline, full engine, full spell modeling, full UX, exercised on a complete real set to prove the architecture end-to-end. Public release is not planned on set 17. The release target is set 18 or a subsequent set, with the methodology already rehearsed on set 17. This decoupling protects the project from a rushed release on an aging set and allows the architecture to mature before user exposure.

The rigor of execution on set 17 is the same as if it were the release: there is no shortcut accepted on the basis that "it is only validation".

### Circle 1, MVP

The MVP must produce precise results when inputs are precise. An MVP that produces wrong numbers is not an MVP.

#### Attacker Inputs

- Champion from the current set, with star level (1, 2, or 3)
- Champion's spell, faithfully modeled — damage, scaling, cast trigger, interactions with items and traits
- Zero to three complete items, no components in v1
- Active traits
- Active augments with combat impact

#### Target Inputs

The target is symmetric to the attacker in terms of modeled mechanics. The same configuration surface applies, regardless of the champion's role (carry, bruiser, tank, support). Role-based shortcuts (such as ignoring spells on non-tank targets) are explicitly rejected, as they would silently falsify outputs for cases like a carry whose spell grants defensive stats.

- Champion with star level
- Champion's spell, faithfully modeled — damage, scaling, defensive effects (shields, dodges, heals), and all interactions
- Equipped items
- Active traits
- Active augments

#### Simulation Parameters

- `stop_condition` — user-defined before each simulation run. Three modes:
  - `time_to_kill`: target is mortal, no time limit. The simulation stops at target death. A hard safety cap of 60 simulated seconds applies; if reached, the run ends with a `timeout` flag and an explanatory message (insufficient DPS, regeneration loop, or potential bug).
  - `fixed_duration`: target is immortal, simulation runs for a user-defined duration. Output focuses on total damage exchanged.
  - `first_event`: both stop triggers active. The simulation ends at whichever occurs first (kill or timer expiration). Default mode.
- Configurable simulation duration for `fixed_duration` and `first_event` modes (default value to be defined).
- Fixed implicit assumptions: in-range from `t=0`, no movement, no retargeting, logical target dummy positioning.

#### Outputs

- Raw results of the current simulation: DPS, total damage dealt, total damage received, effective duration, stop reason (`kill`, `timer`, `timeout`).
- Other base metrics to be specified.
- No verdict. The tool does not judge, it reports. The player compares by running the simulation again.

### Circle 2, Post-MVP Priority

- Optional UX/UI configuration, to be precisely defined.
- Advanced metrics, to be precisely defined: spell casts, mana flow, damage breakdown, etc.

### Circle 3, Intentionally Empty

No long-term pre-planning. Iterate based on user feedback.

## 5. Product and UX Principles

### Context-Neutral Tool

The simulator imposes no usage context. No dedicated mode, no quick-versus-detailed toggle. The user decides when and how to use it.

### Smart Defaults

All fields are accessible. Unfilled fields take neutral values: no augment, no trait, and so on. The user launches their simulation without friction.

### Warning rather than Blocking

If fields are unfilled, the simulation runs anyway, with an informative warning indicating that precision is limited by the inputs provided. The final decision belongs to the user.

### Respect for User Autonomy

The product addresses serious players. No hand-holding. The player knows what they are doing.

### Speed of Use

UX must allow a useful simulation in a few seconds, even when the user only fills in the essentials.

## 6. Technical Stack

The stack is chosen to minimize cost, maintenance burden, and friction during the MVP and validation phases. It is a deliberately small surface, with no backend until a clear product need justifies one.

### Stack Components

| Layer        | Choice                                                                                    | Annual Cost |
| ------------ | ----------------------------------------------------------------------------------------- | ----------- |
| Language     | TypeScript                                                                                | 0           |
| UI framework | React                                                                                     | 0           |
| Build tool   | Vite                                                                                      | 0           |
| Styling      | Tailwind CSS                                                                              | 0           |
| Backend      | None in MVP; 100% client-side single-page application                                     | 0           |
| Data source  | Community Dragon, normalized into typed TypeScript data files committed to the repository | 0           |
| Hosting      | Cloudflare Pages or Vercel, free tier                                                     | 0           |
| Domain       | Registrar of choice                                                                       | ~12 EUR     |
| Versioning   | Git, GitHub                                                                               | 0           |

### Architectural Principles

- No backend in MVP. The simulation engine, the data lookups, and the UI all run client-side. A backend will be introduced only when a feature requires it (user accounts, cloud persistence, anonymized telemetry, payments).
- Static data pipeline. Community Dragon data is parsed by an update script, normalized into typed TypeScript files, and committed to the repository. The application has no runtime dependency on Riot or Community Dragon being reachable.
- TypeScript is non-negotiable given the complexity of the domain.
- The project is built from scratch. Existing precedents (notably tacticians-academy/teamfight-simulator) are not used as a code base, neither as fork nor reference, to keep architectural alignment with the principles documented here.

### Git and Commit Conventions

- Branch naming uses the `SFT-` prefix followed by an incremental ticket number and a short slug, for example `SFT-001-initial-setup`, `SFT-002-vite-bootstrap`.
- Commits follow Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`), with the ticket reference in the commit message header or footer.
- Merge strategy to be confirmed during step 1 of `ROADMAP.md`.

## 7. Simulation Engine Design

### Modifier-Based Composition

Every effect in TFT — items, traits, augments, future mechanics such as set 17 Gods — is modeled as a container of modifiers applied to a champion's neutral base state. The engine knows nothing about specific sets or specific items; it only knows how to apply modifiers in a deterministic order.

This design has three implications:

- Adding a new set requires no engine changes. Only data is added: new champion definitions (base stats and spell), new items, new traits, new augments.
- Adding an entirely new mechanic (such as the set 17 Gods) requires adding a new modifier container type. The engine pipeline does not change.
- Each modifier can be tested in isolation, which makes the engine debuggable at the atomic level.

The precise modifier taxonomy (which categories exist, how they compose, in which order they apply) is intentionally not fixed in this document. It is derived from observation of the real set data during the data pipeline normalization phase, not postulated in the abstract. See step 5 of `ROADMAP.md`.

### Event-Driven Resolution

The combat is resolved as a sequence of discrete events (auto-attacks, spell casts, item procs, periodic ticks), not as a continuous timeline or a fixed time-step. The engine advances simulated time event by event. This is the right model for TFT, where most effects fire on specific triggers rather than uniformly.

### Combat Symmetry

Both attacker and target execute their full mechanical kit during a simulation: auto-attacks, spell casts, item procs, and trait effects, on both sides. The single asymmetry is logical and tied to the `stop_condition` parameter: in `fixed_duration` mode, the target is treated as immortal to allow a complete DPS measurement; in `time_to_kill` and `first_event` modes, the target dies normally.

### Simulated Time vs Wall-Clock Time

Simulated time is a virtual counter inside the engine; it is not a real-time delay. A 10-second simulation completes in a few milliseconds of CPU time. The 60-second safety cap is a cap on simulated time, not on user-perceived wait. From the user's perspective, every simulation completes instantly. Performance is bounded by the number of events to process, which remains small even for long simulations.

## 8. Data Pipeline

### Source of Truth

Data Dragon (Riot) is explicitly rejected as a data source for combat statistics. It only exposes id, translated name, tier, and image for TFT entities — no HP, AD, AS, mana, range, scaling, spell logic, or item modifiers. Riot's own documentation acknowledges that Data Dragon spell data and item stats are inaccurate.

Community Dragon (cdragon) is the source of truth for combat statistics. It exposes detailed champion data through bin files, the same data the game itself uses, but in an unnormalized format that requires parsing work.

### Pipeline Phases

The pipeline runs as an update script committed to the repository, invoked manually on each patch (or new set release). It produces typed TypeScript data files that the application imports at build time.

1. **Acquisition.** Fetch the relevant bin files from Community Dragon for the current patch.
2. **Parsing.** Decode bin files into raw structured data: champion base stats, item modifiers, trait effects, augment effects.
3. **Normalization.** Map raw data into the project's TypeScript type system. The modifier taxonomy is finalized at this stage, on the basis of the real patterns observed in the set's items, traits, augments, units, and gods.
4. **Spell modeling.** Spell logic is written by hand in TypeScript, per champion, because no public source provides the behavioral code. Spell numerical data (damage values, scaling coefficients, mana costs) is sourced from Community Dragon and injected into the hand-written behaviors.
5. **Patch versioning.** Each pipeline run is tagged with the patch version it represents. The repository keeps a history, enabling potential replays of past patches.

### Acknowledged Cost

Spell modeling is the largest and least compressible workload of the project. Each champion requires a dedicated TypeScript implementation of its spell behavior. Set transitions multiply this cost by the number of new or modified champions. This is intrinsic to the product's value proposition and confirmed by all known prior simulator projects (Avadaa, tacticians-academy) that hit the same wall.

## 9. Identified Risks

### Technical Risk: Data Maintenance

- Community Dragon is community-maintained. It is the canonical practical source for TFT combat data, but it depends on volunteer maintenance and may lag or miss data on new sets.
- Data Dragon, by contrast, is officially maintained but unfit for combat data (only nominal metadata).
- Every patch requires re-running the data pipeline. Every new set requires major work, dominated by spell modeling.

### Technical Risk: Spell Modeling Effort

- Faithful spell modeling for every champion of the current set is the single largest technical workload of the MVP. Each champion has a unique spell with unique mechanics (dashes, AoE, chains, conditional shields, executes, CC, scaling heals, and so on).
- This risk is intrinsic to the product's positioning ("Simulation is the proof") and cannot be reduced by scope tricks. It is the cost of the value proposition.
- Two known prior projects (Avadaa's simulator, tacticians-academy) confirmed this risk by abandonment. Avadaa explicitly cited "constant work to recreate every new champion, ability and item from scratch" as the reason for not releasing publicly. Tacticians-academy stopped updating around set 11.
- To address through a clear modifier-based architecture (section 7), which allows each spell to be authored as data plus a focused TypeScript function and tested in isolation.

### Market Risk: Validation Pending

- No real market validation has been performed yet. Conviction on the need rests on the founder's personal experience.
- The founder has chosen to deprioritize market validation in favor of building. The risk is accepted consciously: if user uptake is weak post-launch, validation will be the first explanation to investigate.

### Riot Compliance

- Riot's policy allows static recommendations and skill-improvement tools. Pre-game and post-game use are explicitly encouraged.
- The choice "no verdict, just a result" naturally places the product on the right side of the line. The tool informs, it does not dictate.
- To monitor: any evolution of the product toward active in-game recommendation.

## 10. Acted Decisions

| Decision                                                                                                                               | Rationale                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focus on the DPS simulator, drop the Kovaaks-style training hub                                                                        | Riot IP legal risk and a development horizon over 12 months, incompatible with the solo founder constraint                                                                                                                                                                                                                                                                                           |
| MVP is a 1v1 duel, not a full board                                                                                                    | Scope tenable solo, covers the central use case                                                                                                                                                                                                                                                                                                                                                      |
| No hex grid in v1                                                                                                                      | UX and development cost disproportionate to the value added for the target use case                                                                                                                                                                                                                                                                                                                  |
| No configurable range, assume in-range from `t=0`                                                                                      | A clear assumption is better than a fuzzy half-parameter                                                                                                                                                                                                                                                                                                                                             |
| Traits and augments included in Circle 1, on both sides                                                                                | Without them the calculations are wrong; essential for post-game precision                                                                                                                                                                                                                                                                                                                           |
| Spells modeled for all champions on both sides, no role-based shortcut                                                                 | Role-based exclusion would silently falsify outputs (e.g. carry with defensive spell); symmetry is simpler to reason about and more correct                                                                                                                                                                                                                                                          |
| No verdict, just a raw result                                                                                                          | User respect and Riot policy compliance                                                                                                                                                                                                                                                                                                                                                              |
| Side-by-side comparison in Circle 2, not MVP                                                                                           | Technically equivalent to running the simulation twice; UX, not engine                                                                                                                                                                                                                                                                                                                               |
| Circle 3 left empty                                                                                                                    | No long-term planning before having shipped and measured                                                                                                                                                                                                                                                                                                                                             |
| Smart defaults with a warning, not blocking                                                                                            | Speed of use is the priority; the user remains master of their inputs                                                                                                                                                                                                                                                                                                                                |
| Technical stack: React, Vite, TypeScript, Tailwind, no backend in MVP, hosted on Cloudflare Pages or Vercel                            | Founder velocity on React, frictionless distribution via URL, near-zero infrastructure cost, minimal technical surface to maintain solo. See section 6.                                                                                                                                                                                                                                              |
| Stop condition is a user-defined parameter with three modes: `time_to_kill`, `fixed_duration`, `first_event` (default)                 | Each mode answers a different question type; the user knows what they want to measure                                                                                                                                                                                                                                                                                                                |
| Hard safety cap of 60 simulated seconds on `time_to_kill`                                                                              | Protects against edge cases (regeneration > damage, infinite shields) and bugs without restricting normal use                                                                                                                                                                                                                                                                                        |
| Engine architecture: modifier-based composition, event-driven resolution                                                               | Data-driven extensibility, no engine changes for new sets, atomically testable. See section 7.                                                                                                                                                                                                                                                                                                       |
| Data source: Community Dragon, not Data Dragon                                                                                         | Data Dragon TFT exposes only nominal metadata; Community Dragon is the canonical source for combat statistics                                                                                                                                                                                                                                                                                        |
| Build from scratch, no fork of tacticians-academy or other prior simulator                                                             | Founder choice for architectural alignment and zero hereditary tech debt; cost in time accepted consciously                                                                                                                                                                                                                                                                                          |
| Market validation deprioritized in favor of building                                                                                   | Founder choice; risk accepted and named                                                                                                                                                                                                                                                                                                                                                              |
| Modifier taxonomy derived from observation, not postulated in advance                                                                  | Designing the taxonomy before having seen the real set data risks producing a structure that does not match reality. Cartography first, taxonomy second. See step 5 of `ROADMAP.md`.                                                                                                                                                                                                                 |
| Set 17 used as technical validation target; release planned on set 18 or later                                                         | Decouples architecture maturation from time pressure of an aging set; allows rehearsal of the full pipeline before user exposure                                                                                                                                                                                                                                                                     |
| Git branches prefixed with `SFT-`, Conventional Commits                                                                                | Standard professional convention, ticket traceability, CI-friendly                                                                                                                                                                                                                                                                                                                                   |
| Documentation split into three files: `PROJECT_CONTEXT.md` (strategy), `ROADMAP.md` (execution), `COLLABORATION.md` (session protocol) | Different natures and different lifecycles. Git diffs stay readable, version bumps stay meaningful, the file pasted at session opening matches the session's actual purpose.                                                                                                                                                                                                                         |
| Bun adopted as runtime + package manager, Vite kept as build tool                                                                      | 2026 consensus: Bun + Vite together is the recommended stack. Bun runs TypeScript natively (relevant for the data pipeline update script of section 8), `bun install` is 6-9x faster than `npm install`, and the toolchain is unified (one binary instead of Node + npm + ts-node). Vite kept because Bun's bundler lacks React Fast Refresh, which is irreplaceable for React frontend development. |

## 11. Open Questions

- Advanced metrics for Circle 2: precise list to define
- Default combat duration for `fixed_duration` and `first_event` modes: initial value to determine
- Merge strategy on the Git workflow: squash merge or rebase merge, to be decided during step 1 of `ROADMAP.md`
