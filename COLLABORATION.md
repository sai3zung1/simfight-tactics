---
date: 2026-05-15
status: active
version: 0.7.0
description: "Collaboration protocol between the founder and Claude / Claude Code. How to open, conduct, and close a working session."
---

> Session protocol. Companion to `PROJECT_CONTEXT.md` (strategic constitution) and `ROADMAP.md` (execution journal). Paste this file at the start of each session, alongside the other two.

## 1. Documentation Set Overview

| File                           | Nature                                                                                                                   | Lifecycle                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `PROJECT_CONTEXT.md`           | Strategic constitution: identity, market, scope, principles, stack, architecture, risks, acted decisions, open questions | Stable. Meaningful version bumps only.                  |
| `ROADMAP.md`                   | Sequenced steps, statuses, parking lot                                                                                   | Live. Updated each session.                             |
| `COLLABORATION.md` (this file) | Session protocol, request taxonomy, closing ritual                                                                       | Evolves as the working method matures.                  |
| `DECISIONS_LOG.md` (later)     | Chronological journal of decisions that contradict or refine earlier ones                                                | Append-only. Created at the first such decision.        |
| `CLAUDE.md` (later)            | Operational technical rules for Claude Code                                                                              | Stable once set. Created during step 1 of `ROADMAP.md`. |

## 2. Session Opening

At the start of a session with Claude, load at least `PROJECT_CONTEXT.md`, `ROADMAP.md` with a short directive of the following form:

> Context files attached below. Resuming on step X of `ROADMAP.md`.
> **Type**: decision | execution | exploration | validation
> **Request**: [...]
> **Expected format** (optional): [...]

### Request Types

The `Type` field tells Claude what shape of response to produce. Without it, Claude defaults to a generic mode that may not match the need.

- **decision** — a choice to settle. Claude lays out the options and recommends one with rationale. Response is structured around the trade-off.
- **execution** — the founder knows what they want. Claude helps produce (code, structure, text, draft document). Response is the deliverable, with minimal preamble.
- **exploration** — no expected answer. Think together, surface angles, stress-test assumptions. Response can be wider and more associative.
- **validation** — the founder has a position. Claude attacks it: weaknesses, blind spots, counter-arguments. Response is adversarial by design, not consensual.

### Expected Format (Optional)

Used when the founder already knows the form they want: max length, table, code draft ready to paste into Claude Code, bullet list, single-paragraph synthesis, etc. Specifying it upstream avoids Claude defaulting to a form that requires reformatting downstream.

## 3. Mid-Session Signals

Two short signals the founder can invoke at any moment between Session Opening and Session Closing. Used punctually, on risk-sensitive moments — not as a per-message prefix, which would habituate Claude to the pattern and dilute its effect.

- **`calibration check`** — used when asking an open-ended or speculative question (e.g. "anything else to add", "what else should we consider"). Forces Claude to distinguish: "I have a real signal here" vs "I'm producing because asked." A reply of "I have nothing useful to add on this" is a valid and welcome answer to this signal.

- **`hold or fold`** — used after Claude appears to reverse a position under pushback. Forces Claude to either (a) cite the specific new information that justified the reversal, or (b) acknowledge the reversal was driven by pushback alone and restore the original position.

These signals address two distinct failure modes documented in Anthropic's published research on sycophancy: confabulation when asked open-ended questions, and position reversal under pressure. The signals are deployed by the founder because Claude cannot reliably self-detect these patterns in real time.

## 4. Session Closing

### Closing Ritual

Triggered by the founder with: **"closing recap"**.

Before any file update, Claude proposes a structured recap in four categories:

- **Settled** — decisions settled during the session. Destination: section 10 of `PROJECT_CONTEXT.md`.
- **Open** — questions raised without resolution. Destination: section 11 of `PROJECT_CONTEXT.md`.
- **To Explore** — topics surfaced in passing, not yet actionable. Destination: Parking Lot of `ROADMAP.md`.
- **Roadmap** — status changes and sub-steps to add. Destination: relevant steps of `ROADMAP.md`.

The founder validates or amends each line. **Files are only updated after explicit validation.** This guardrail prevents Claude from prematurely closing a topic that the founder still considered in exploration.

### File Updates

Once the recap is validated:

- Update statuses in `ROADMAP.md` (`pending` → `in_progress` → `done`)
- Add sub-steps under any step that revealed additional work
- Move validated `settled` items into section 10 of `PROJECT_CONTEXT.md`
- Move validated `open` items into section 11 of `PROJECT_CONTEXT.md`
- Append validated `to explore` items to the Parking Lot of `ROADMAP.md`
- Bump the `version` field on each modified file: patch level for corrections, minor level for structural additions.
- Bump the `date` field on each modified file.

## 5. Document Hygiene

- Keep each document short and factual. Documentation is not a narrative journal. Any line that does not help resume work efficiently should be cut.
- Version with Git as soon as the repository exists (step 1 of `ROADMAP.md`), to track evolution of all three files independently.
- When a decision in `PROJECT_CONTEXT.md` is contradicted or refined later, create `DECISIONS_LOG.md` and start recording chronologically. Until that first contradiction, the section 10 table is sufficient.
