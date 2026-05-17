---
date: 2026-05-17
status: active
version: 0.7.0
description: "Execution journal of the Simfight Tactics project. Sequenced roadmap, updated each session."
---

> Execution journal. Companion to `PROJECT_CONTEXT.md` (strategic constitution) and `COLLABORATION.md` (session protocol). Paste this file at the start of each session, alongside the other two.

## Conventions

Each step is sized to fit in one or two working sessions. Statuses (`pending`, `in_progress`, `done`) are updated at the end of each session. Sub-steps may be added if a step reveals additional work. The UX principles referenced throughout are defined in section 5 of `PROJECT_CONTEXT.md`.

## Sequenced Steps

1. **Repository Setup** — `done`
   - [x] Initialize Git repository and push to GitHub
   - [x] Setup Vite, React, TypeScript
   - [x] Configure Tailwind from the Vite template, ESLint, Prettier and Conventional Commits tooling
   - [x] Adopt branch naming with the `SFT-` prefix, for example `SFT-001-initial-setup`
   - [x] Decide on merge strategy (squash or rebase)
   - [x] Create `CLAUDE.md` with operational technical rules for Claude Code

2. **Type System Foundation: Catalog Layer** — `in_progress`
   - [x] Primitives (branded IDs, `ScalingByStar`, `StarLevel`)
   - [x] Foundational types (`BaseStats`, `Modifier` opaque slot deferred to step 5)
   - [x] Catalog entities (`Unit`, `Item`, `Trait`, `Augment`, `Spell`)
   - [x] Code-quality conventions captured in `CONVENTIONS.md`
   - Runtime types (`Event`, `CombatState`, `SimulationResult`) and input config types (`BoardSide`, `CombatConfig`) are explicitly deferred to the steps where they naturally fit (Engine MVP, UI)
   - The precise modifier taxonomy is intentionally deferred to step 5, after real set data has been observed

3. **Data Pipeline, Phase 1: Acquisition** — `pending`
   - Identify the relevant bin files in Community Dragon for the current patch
   - Write the TypeScript download script, executed via Bun
   - Test acquisition on the current set 17 patch
   - Document the exact Community Dragon paths used

4. **Data Pipeline, Phase 2: Parsing** — `pending`
   - Decode bin files into a raw intermediate structured representation
   - Identify inconsistencies and anomalies in the Riot data
   - Log all parsing issues for future debugging

5. **Data Pipeline, Phase 3: Normalization** — `pending`
   - Map raw data into the TypeScript type system defined at step 2
   - Cartograph the actual patterns of effects observed across items, traits, augments, units, and gods of set 17
   - Finalize the modifier taxonomy and composition rules based on this cartography
   - Generate typed TypeScript data files (one per category)
   - Validate completeness and coherence: every champion has base stats, every item has modifiers, etc.

6. **Data Pipeline, Phase 5: Patch Versioning** — `pending`
   - Tag each export with the patch version it represents
   - Define the repository structure to preserve historical patches

7. **Type System Foundation: Post-Pipeline Validation** — `pending`
   - Compare types in `src/domain/*.ts` (step 2) against generated `src/data/set-17/*.ts` (step 5)
   - Identify divergences: fields present in data but absent from types, fields typed but unused by the pipeline, shape mismatches
   - Update `src/domain/*.ts` to match cdragon reality where needed
   - Verify that the `Modifier` taxonomy finalized at step 5 is faithfully represented in `modifier.ts` (the `__kind: "TODO_STEP_5"` slot replaced by the real shape)
   - Create `DECISIONS_LOG.md` at the repo root if this step contradicts or refines an earlier decision (per `COLLABORATION.md` §1)
   - Update `CONVENTIONS.md` if new patterns deserve codification
   - Goal: validate the foundational type system against observed reality before building the design system that consumes it

8. **Design System Definition** — `pending`
   - Define the visual language and component primitives that will inform all subsequent UI work
   - Tokens: colors, typography scale, spacing, iconography, motion principles
   - Component primitives (buttons, selectors, cards, panels) with their states
   - Document in a consultable reference (to be decided: `DESIGN_SYSTEM.md` at the repo root or a dedicated folder in `src/ui/`)
   - Goal: every subsequent UI step consumes these primitives instead of reinventing them

9. **Simulation Engine, Minimal Viable** — `pending`
   - Implement the simplest possible event-driven loop
   - Single champion without spell, basic items only (flat AD, flat AS)
   - Immortal target, `fixed_duration` mode only
   - Output DPS and total damage
   - The goal is to validate the modifier-based architecture end-to-end, not to be complete

10. **Simulation Engine, Complete Modifiers** — `pending`
    - Implement the full set of modifier categories validated at step 5
    - Test each category in isolation
    - Pass the baseline calculations (AD scaling, AS cap, armor/MR reduction)

11. **Simulation Engine, Stop Conditions** — `pending`
    - Implement the three modes: `time_to_kill`, `fixed_duration`, `first_event`
    - Implement the 60-second hard safety cap on `time_to_kill`, with a `timeout` result flag distinct from `kill` and `timer`
    - Surface an explanatory user-facing message when the cap is reached (insufficient DPS, regeneration loop, potential bug)
    - Unit test the cap on a known case (target with healing greater than incoming damage)

12. **Data Pipeline, Phase 4: Spell Modeling, First Champion** — `pending`
    - Select a champion with a simple spell, for example a basic caster of type "deals X damage to Y targets"
    - Write the spell behavior in TypeScript
    - Integrate it into the engine
    - Validate that the simulation produces values consistent with an observed real game

13. **Data Pipeline, Phase 4: Spell Modeling, All Champions** — `pending`
    - Model every champion of set 17 (the validation target). No prioritization by competitive frequency: full coverage is required to validate the end-to-end architecture
    - The same methodology applies to subsequent sets, which are the actual release target
    - This is the longest step of the project

14. **UI, Selectors** — `pending`
    - Build the selection components for attacker and target champions
    - Build the selectors for items, traits, and augments
    - Functional only, no styling polish at this stage

15. **UI, Parameters and Results** — `pending`
    - Selector for the `stop_condition` mode
    - Duration field for `fixed_duration` and `first_event`
    - Display of simulation results
    - Inline warnings for unfilled fields

16. **UI, Polish and UX** — `pending`
    - Apply the UX principles defined in section 5 of `PROJECT_CONTEXT.md` (smart defaults, speed of use)
    - Consistent Tailwind styling
    - Responsive layout (desktop and mobile)

17. **Initial Deployment** — `pending`
    - Configure Cloudflare Pages or Vercel
    - Purchase and configure the domain
    - Basic CI/CD: push to `main` triggers a deployment

18. **First Iteration on Real Usage** — `pending`
    - Intensive personal use of the tool
    - Identify bugs, gaps, and frustrations
    - Prioritize fixes for the first user-facing iteration

## Parking Lot

Topics surfaced in passing during sessions, to explore later without polluting the active roadmap or the Open Questions of `PROJECT_CONTEXT.md`. Each entry is one line. Promoted to a roadmap step (or to an Open Question) when it becomes actionable.

- UUID-based identifier strategy for result-sharing post-MVP — independent layer above catalog IDs (URL shortening, persistence). Out of scope for MVP catalog work.
- Pipeline-omits-key invariant — when `pipeline/normalize.ts` is written, document that the `4` key of `ScalingByStar` is omitted for ineligible units, not emitted as `4: undefined`.
- Augment category tagging — if the simulation needs to discriminate hero / trait / standard augments, add a `category: AugmentCategory` field. Re-evaluate at step 5 when cdragon reveals patterns.
