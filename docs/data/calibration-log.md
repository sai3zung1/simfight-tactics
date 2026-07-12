# Combat calibration log

**Status:** Calibration log · opened 2026-07-11 · rows closed 2026-07-12, live
upgrade pass pending · companion to issue #51,
[ADR 0004](../adr/0004-modifier-taxonomy-resolution.md) and
[combat-resolution.md](./combat-resolution.md).

> ADR 0004 fixes the pipeline shapes and leaves their coefficients open. This
> log pins each open value: one row per unknown, carrying the value the engine
> runs on, what the sources predict, and the resolution with its evidence
> grade. The regression tests read the Resolution column and pin each value at
> its recorded grade.

## How a row resolves

- **Engine now** — the value the engine runs on, with its code location.
- **Expected** — what the sources predict, with source and confidence; `—` when
  nothing predicts it.
- **Resolution** — the settled value, dated, tagged with its evidence grade.

Supersession order: live measure > game data (cdragon) > official source >
owner rule (high) > community/wiki > engine convention/derivation. A row fills
at its best available grade instead of blocking on game access; a higher grade
supersedes without re-litigation. An **owner rule** is a high-confidence owner
reserve adopted as the sim's rule; it never upgrades itself into a measured
fact — the tag keeps the evidence class visible.

**Live upgrade pass.** One in-game session before the Set 17 rotation
(~late August; Set 18 PBE 2026-07-28 + ~1 month, UE5 migration) lifts the
adopted rows to measure grade — protocol under Session C. Missed, the adopted
grades stand and re-pin on Set 18.

**Measuring method.** Set 17 live, sessions recorded and read frame by frame.
The client displays rounded numbers and per-hit damage reads as an HP-bar
delta, so every comparison carries a rounding tolerance — never strict
equality. A row constrains the unit only where the mechanic is role-bound (the
Caster per-second flow, the Tank damage-taken origin); anything else measures
on any unit with the needed part.

**Scope (decided 2026-07-11).**

- Coefficients only. Pipeline ordering is descoped: every stage is
  multiplicative today, so ordering changes no result and cannot be observed.
  Reopens with the first additive stage (spells/items; #74 is the natural
  host).
- Crit: the engine keeps deterministic expected value. Live behaviour on
  record — auto-attacks crit at random; a spell cannot crit unless a trait or
  item enables it, and it then applies the unit's crit chance (rare abilities
  crit naturally — per-unit exceptions). The encoding question is settled (C5).
- `TICKS_PER_SECOND` is an internal precision grid, not a mirror of the game
  clock; its only requirement is that no recorded value needs finer than 1 ms
  (checked under Post-measurement).

**Priors still load-bearing** — a prior ranks hypotheses, never fills a cell;
an item-borne behaviour is an opt-in, paid advantage and predicts nothing
about champion defaults:

- **C2** — the shape (pre + post + cap) is designed: post-only would starve a
  tank stacking its own resists, the cap kills burst abuse. The structure is
  trusted; only the three numbers are tuning values.
- **C3** — additive reduction is degenerate (two 50% sources = immunity):
  multiplicative is the only sane design.

---

## Session A — mana & cast · closed 2026-07-11

| ID  | Unknown                                                                    | Engine now                                                                                                        | Expected (source · confidence)                                                                                                                                                                           | Resolution                                                                                                                                                                         |
| --- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Post-cast bar state — is any excess kept, and where does the bar rest?     | the cast discards the whole gauge; the bar lands on the post-cast modifier sum, 0 with no items · `casting.ts:86` | — (Set 12 carried the overflow; unconfirmed post-Set-15)                                                                                                                                                 | `0` — nothing kept, every unit restarts at zero · measured, owner · 2026-07-11                                                                                                     |
| A2  | Mana lock — does a baseline lock still exist, on which units, how long?    | `1 s`, global, every unit · `mana.ts:30`                                                                          | 1 s default traces to a 2019 Riot dev statement (Set 1 era), repeated undated by the wiki · stale; the only post-revamp official mention is per-unit ("some units with extended Mana Locks", patch 15.4) | no baseline lock — the no-gain window is the cast itself, gains resume at cast end, every role · measured, owner, high · 2026-07-11; extended locks stay per-unit (open, see gaps) |
| A3  | Mana lock scope — which gain origins a lock blocks, on units that have one | all four · `mana.ts:52`                                                                                           | ManaRegen blocked during a lock (Riot patch 15.4 bugfix · official, high); other origins —                                                                                                               | all origins silent during the cast window · measured, owner, high · 2026-07-11                                                                                                     |

**Measured.**

- **A1** — 2026-07-11, Set 17 live (patch number to note): every observed unit
  restarts at exactly 0, excess included — one zero read settles the carry and
  the landing value at once. Valid given at least one observed unit overshot
  its threshold at cast time. Confirms the engine. The base-game landing value
  is no engine constant — it falls out of the empty post-cast modifier fold;
  the slot behind it (`manaGains["post-cast"]`) is item-scoped future-proofing
  (see the post-cast gap).
- **A2 · A3** — 2026-07-11, Set 17 live (owner · high; samples across roles and
  pool sizes): no baseline post-cast lock exists. The no-gain window is the
  cast itself — no origin pays out from cast start to cast end — and gains
  resume immediately at cast end, every role. Which units carry an official
  "extended Mana Lock" (patch 15.4) is per-unit data; the ≤ 20-pool lock is an
  owner rule (high, adopted 2026-07-11) — the sim's default the day a
  small-pool unit is composed, until a measure or an official source supersedes
  it. Reopens per-unit only: the day an extended-lock unit enters the composed
  sample, re-run the origin checklist on it (per-attack, per-second,
  damage-taken, item flat).

## Session B — steady flow · closed 2026-07-12

| ID  | Unknown                                                                                                                        | Engine now                                                                                         | Expected (source · confidence)                                                                                                                                          | Resolution                                                                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| B1  | Caster per-second cadence — discrete 1 s steps vs continuous accrual; first payout timing; does the grid restart after a cast? | `+2` each `1 s` tick, first at 1 s, grid independent of casts · `casting.ts:27`, `simulate.ts:147` | 2 / s (Riot roles article · high for the value); delivery cadence unsourced anywhere (web pass 2026-07-11) — the tooltip's "every second" leans discrete, tooltip-grade | discrete +2 steps, first tick at t = 1 s — engine confirmed · measured, owner, high · 2026-07-11; post-cast grid adopted · engine convention (continued grid, missed payouts lost) · 2026-07-12 — live pass: cast ends 10.3 s, next tick 11.0 or 11.3? |

**Measured.**

- **B1** — 2026-07-11 (owner · high; Caster, no items): discrete delivery — the
  bar steps +2 on whole seconds, first tick at t = 1 s, repeated until full;
  the cast fires the instant the pool hits 100%. Confirms the engine on all
  three counts (`casting.ts:27`, `simulate.ts:147`, same-tick cast emission).
  The same read settles C7: the first auto-attack lands at combat start. The
  post-cast grid stayed unobserved — adopted as engine convention (see the
  row).

## Session C — damage & cadence · closed 2026-07-12 (adopted grades)

| ID  | Unknown                                                               | Engine now                                                         | Expected (source · confidence)                                                                                                                                                                                                                                                                                                              | Resolution                                                                                                                                                                                                                                                   |
| --- | --------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C1  | Mitigation formula, identical armor/MR                                | `100/(100+resist)` · `resolve-damage.ts:52`                        | same — multi-source convergence, linear-EHP property, resists floor at 0, no change signal (pass 2026-07-12 · community, corroborated)                                                                                                                                                                                                      | adopted 2026-07-12 · community, corroborated — engine already implements it; live pass spot-checks via C2's protocol                                                                                                                                         |
| C2  | Tank damage→mana — needs a Tank target, the only role with the origin | 1% pre + 3% post, cap 42.5 / hit · `mana.ts:19`                    | mechanism official, numbers nowhere official (Riot article names no coefficient); 1/3/42.5 is a single wiki lineage every echo copies, and it reads as an edit of the pre-revamp universal formula (1% pre + **7%** post, same 42.5 cap — only 7→3 changed), so it may be retuned continuity or a half-edited relic (pass 2026-07-12 · low) | adopted 2026-07-12 · wiki lineage, low — engine already implements it; absent from cdragon `en_us.json` (checked; lives in game constants, map bin a future avenue). Live pass discriminates: 3% vs 7% post; 1% pre survived?; cap binds the instance total? |
| C3  | DR stacking — lanes multiplicative?                                   | multiplicative (durability × reductions) · `resolve-damage.ts:103` | — (engine convention)                                                                                                                                                                                                                                                                                                                       | adopted 2026-07-12 · engine convention + designer prior (additive is degenerate); live pass = two-source check                                                                                                                                               |
| C4  | Crit multiplier on a crit                                             | `1 + chance × damage` (expected value) · `crit-policy.ts:20`       | base 25%, ×(1 + 0.40) — the note's +30% was the V11.12 (2021) value; current wiki reads +40%, undated (pass 2026-07-12 · community, patch-sensitive)                                                                                                                                                                                        | closed 2026-07-12 · game data — the game's own champion stats carry `critChance 0.25`, `critMultiplier 1.4` (cdragon latest; 8 no-crit specials at 0/null, one per-unit 1.3); residue for the live pass: combat applies the stored value 1:1                 |
| C5  | `critDamage` encoding — bonus vs full multiplier                      | stored as bonus over nominal · `crit-policy.ts:18`                 | deduced: measured multiplier (C4) vs cdragon stored value                                                                                                                                                                                                                                                                                   | closed 2026-07-12 · game data — cdragon stores the **full multiplier** (`critMultiplier: 1.4`), the engine stores the bonus (0.4): conventions differ, the adapter maps `critMultiplier − 1 → critDamage` (ADR 0005; else every crit lands ×2.4)             |
| C6  | Attack interval — is the delivered cadence exactly `1/AS`?            | `1 / AS` · `auto-attack.ts:19`                                     | definitional identity (AS = attacks per second); exact vs frame-quantized delivery is unsourced                                                                                                                                                                                                                                             | adopted 2026-07-12 · definitional — exact `1/AS`; frame-quantization → live pass                                                                                                                                                                             |
| C7  | Opening attack at combat start                                        | both openings at `t=0` (provisional) · `simulate.ts:141`           | —                                                                                                                                                                                                                                                                                                                                           | first swing at combat start · measured, owner, high (Session B read) · 2026-07-11; also a model commitment — no walk phase, combat starts at the first swing (owner · 2026-07-12)                                                                            |
| C8  | Impact offset — wind-up / projectile travel                           | instant, not modelled                                              | —                                                                                                                                                                                                                                                                                                                                           | closed 2026-07-12 · accepted abstraction (owner): no movement or distance in the model, impacts instantaneous; known divergence from live. Revisit only if durations/travel enter the model (spells)                                                         |
| C9  | Per-attack gain timing — on swing vs on impact                        | on swing, at resolution · `auto-attack.ts:69`                      | —                                                                                                                                                                                                                                                                                                                                           | on the swing, not the impact · owner rule, high · 2026-07-12 — engine confirmed                                                                                                                                                                              |
| C10 | Per-attack role values                                                | 10 / 7 / 5 · `provisional-stats.ts`                                | 10 Fighter·Marksman·Assassin, 7 Caster, 5 Tank (Riot roles article · official)                                                                                                                                                                                                                                                              | closed 2026-07-12 · official source; patch-drift checks are data validation at composition (#39/#40), not calibration                                                                                                                                        |

**Live upgrade pass protocol.** One recording: an attacker with known AD
against a Tank with known armor and magic resist (units are picked from the
data, not edited; the sim-side comparison re-enters those stats by hand — #39
stays a non-prerequisite). Spawn the pair adjacent to null the walk.

- **C2** — one hit is one equation with two unknowns (`gain = pre×raw +
post×raw×mitigation`), so the split needs **two hits at different
  mitigation** — same raw damage, the target's armor changed between reads —
  giving two equations and both coefficients. Then one oversized hit probes
  the cap.
- **C1** — falls out of C2's reads: HP delta ÷ AD on non-crit hits = the
  mitigation multiplier; once against armor, once against magic resist, to
  confirm the two formulas match.
- **C4** — crit chance is not freely dialable live: repeat until crits land (or
  raise the chance with an item) and compare a crit hit to a non-crit hit on
  the same target.
- **C6** — frame-count between two consecutive mana jumps on the attacker (C9:
  mana steps on the swing): the delivered interval vs `1/AS`.
- **C3** — stack two independent reduction sources (item / trait); combined
  factor vs their product.
- **B1** — if the Tank casts during the session: cast ends at 10.3 s — next
  regen tick at 11.3 s (restarted grid) or 11.0 s (continued grid)?

---

## Post-measurement

- **Grid check (`TICKS_PER_SECOND`)** — resolved 2026-07-12: every recorded
  value sits on the 1 s grid or is a ratio; nothing needs finer than 1 ms, the
  1000 grid stands. Re-derives automatically at the live upgrade pass.
- **Same-tick tie-break** — on a shared tick the attacker's hit resolves before
  the target's (`simulate.ts:132`, marked "#51 may revisit"). Recorded as an
  engine convention, no measurement row: an exact live tie cannot be reliably
  produced. Revisit only if a live observation contradicts it.
- **Gaps left open on purpose, each with its trigger:**
  - attack-speed cap — the engine has none → an AS-raising modifier;
  - resist shred / sunder — not modelled → an item or spell that shreds;
  - pipeline ordering — unobservable while all-multiplicative → the first
    additive stage;
  - post-cast landing slot — `manaGains["post-cast"]` is ground for a Blue
    Buff-family return; the whole post-cast item family is historical at
    16.13, no live feeder → that item's ticket, the day a set brings one back;
  - cast window — a live cast takes real time and neither attacks nor mana
    gains land inside it; the engine casts instantaneously and blocks
    nothing → spell modeling brings cast durations; per-unit extended mana
    locks and the ≤ 20-pool owner rule ride with it.

**Engine close-out (remaining #51 work).** Remove `MANA_LOCK_SECONDS` and its
plumbing — A2 showed the global post-cast lock models a mechanic that does not
exist; the real blocker is the cast window, which arrives with spell
durations · freeze regression assertions on the Resolution column, each at its
recorded grade · remove the `provisional (#51)` tags from the engine · the
`critMultiplier − 1 → critDamage` adapter contract (C5) binds the extraction
when it lands ([combat-resolution.md](./combat-resolution.md) carries it).

## Sources

Same as [combat-resolution.md](./combat-resolution.md): Riot "Roles Revamped"
(official — roles, per-attack values, Tank-only damage generation); cdragon
`en_us.json` patch 16.13 (role field, item variables); wiki cross-check
(damage-taken coefficients, overflow, mana lock — patch-sensitive); community
references (mitigation, crit — patch-sensitive).

Game data (added 2026-07-12): cdragon `latest/cdragon/tft/en_us.json`
(pulled 2026-07-12 — Set 17 champion stats: `critChance`, `critMultiplier`,
`initialMana`/`mana`; no damage→mana coefficients in this file).

Tank damage→mana lineage (added 2026-07-12):
[Roles Revamped (Riot)](https://teamfighttactics.leagueoflegends.com/en-us/news/game-updates/roles-revamped-and-item-changes/)
(official — mechanism only, no numbers);
[TFT:Mana wiki](https://wiki.leagueoflegends.com/en-us/TFT:Mana) (sole lineage
for 1% pre + 3% post, cap 42.5; the pre-revamp universal formula was 1% pre +
7% post with the same 42.5 cap — every other hit copies the wiki text).

Crit dating (added 2026-07-12):
[TFT:Critical strike wiki](https://wiki.leagueoflegends.com/en-us/TFT:Critical_strike)
(base 25%, +40% bonus — undated; its patch history dates the +30% to V11.12,
2021); corroborated by
[Fandom](<https://leagueoflegends.fandom.com/wiki/Critical_strike_(Teamfight_Tactics)>).

Mana lock dating (added 2026-07-11):
[Riot August, 2019](https://x.com/RiotAugust/status/1142858049683464192)
(origin of the 1 s default — Set 1 era);
[TFT patch 15.4 notes](https://teamfighttactics.leagueoflegends.com/en-us/news/game-updates/teamfight-tactics-patch-15-4-notes/)
(official, post-revamp: per-unit extended locks; ManaRegen blocked during a
lock); [TFT:Mana wiki](https://wiki.leagueoflegends.com/en-us/TFT:Mana)
(repeats the 1 s text, undated).
