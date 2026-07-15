import { test, expect } from "bun:test";
import { simulate, runLoop } from "./simulate";
import { createEventQueue } from "./event-queue";
import type { CombatEvent } from "./combat-event";
import type { Ticks } from "./time";
import type { CombatConfig } from "../../domain/combat/combat-config";
import type { StopCondition } from "../../domain/combat/stop-condition";
import type { BoardSide } from "../../domain/combat/board-side";
import type { UnitId } from "../../domain/primitives";
import type { CombatantId } from "../stats/combatant-id";
import {
  PROVISIONAL_CASTER_UNIT_ID,
  PROVISIONAL_IMMORTAL_UNIT_ID,
  PROVISIONAL_NO_ATTACK_CASTER_UNIT_ID,
  PROVISIONAL_NO_MANA_UNIT_ID,
  PROVISIONAL_RALLY_CASTER_UNIT_ID,
  PROVISIONAL_TANK_UNIT_ID,
} from "../provisional/provisional-stats";
import {
  PROVISIONAL_SWORD_ITEM_ID,
  PROVISIONAL_PLATING_ITEM_ID,
  PROVISIONAL_ROD_ITEM_ID,
} from "../provisional/provisional-modifiers";
import { FIXTURE_SPELL_REGISTRY } from "../../sets/fixture/registry";

// Fixtures: a minimal CombatConfig. `simulate` resolves both sides against a
// fixed provisional stat profile (provisional-stats.ts) and provisional item
// modifiers (provisional-modifiers.ts) — only `starLevel` and `itemIds`
// matter here; traits/augments aren't read yet.
const side = (): BoardSide => ({
  unitId: "dummy" as UnitId,
  starLevel: 1,
  itemIds: [],
  traits: {},
  augmentIds: [],
});

const config = (stopCondition: StopCondition): CombatConfig => ({
  attacker: side(),
  target: side(),
  stopCondition,
});

// The runLoop test below exercises ordering only — its process callback
// never reads who is involved, so attacker and target are placeholders.
const event = (time: number): CombatEvent => ({
  kind: "auto-attack",
  time: time as Ticks,
  attacker: "attacker" as CombatantId,
  target: "target" as CombatantId,
});

test("runLoop processes events in order, ignoring those past timeLimit", () => {
  const q = createEventQueue();
  q.push(event(30));
  q.push(event(10));
  q.push(event(20));
  q.push(event(999)); // beyond timeLimit → must be skipped
  const seen: number[] = [];
  runLoop(q, 100 as Ticks, (e) => {
    seen.push(e.time);
    return undefined;
  });
  expect(seen).toEqual([10, 20, 30]);
});

test("time-to-kill ends on the target's death, reporting the kill instant", () => {
  const r = simulate(config({ mode: "time-to-kill" }));
  expect(r.stopReason).toBe("kill");
  expect(r.totalDamageDealt).toBeGreaterThan(0);
  // The target fought back until it died: what it landed is reported.
  expect(r.totalDamageTaken).toBeGreaterThan(0);
  expect(r.effectiveDurationSeconds).toBeGreaterThan(0);
  expect(r.effectiveDurationSeconds).toBeLessThan(60);
});

test("time-to-kill runs to the 60s cap when the target can't be killed in time -> timeout", () => {
  const c: CombatConfig = {
    attacker: side(),
    target: { ...side(), unitId: PROVISIONAL_IMMORTAL_UNIT_ID },
    stopCondition: { mode: "time-to-kill" },
  };
  const r = simulate(c);
  expect(r.stopReason).toBe("timeout");
  expect(r.effectiveDurationSeconds).toBe(60);
  expect(r.totalDamageDealt).toBeGreaterThan(0);
  // Free witness of the attacker's immortality: it absorbs 60 s of hits —
  // far beyond its own HP — and the run still reaches the cap.
  expect(r.totalDamageTaken).toBeGreaterThan(0);
});

test("fixed-duration runs the full duration -> timer, target treated as immortal", () => {
  const r = simulate(config({ mode: "fixed-duration", durationSeconds: 8 }));
  expect(r.stopReason).toBe("timer");
  expect(r.effectiveDurationSeconds).toBe(8);
  expect(r.totalDamageDealt).toBeGreaterThan(0);
});

test("first-trigger runs to the timer when the target survives that long -> timer", () => {
  const r = simulate(config({ mode: "first-trigger", durationSeconds: 5 }));
  expect(r.stopReason).toBe("timer");
  expect(r.effectiveDurationSeconds).toBe(5);
});

test("first-trigger ends on the target's death when it dies before the timer -> kill", () => {
  const r = simulate(config({ mode: "first-trigger", durationSeconds: 30 }));
  expect(r.stopReason).toBe("kill");
  expect(r.effectiveDurationSeconds).toBeLessThan(30);
});

test("deterministic: same config yields an identical result", () => {
  const c = config({ mode: "fixed-duration", durationSeconds: 8 });
  expect(simulate(c)).toEqual(simulate(c));
});

test("the attacker casts from attacking: the per-attack path end to end", () => {
  const c: CombatConfig = {
    attacker: side(),
    // A no-mana target keeps the negative witness: whatever it does, its
    // gauge cannot fill.
    target: { ...side(), unitId: PROVISIONAL_NO_MANA_UNIT_ID },
    stopCondition: { mode: "fixed-duration", durationSeconds: 15 },
  };
  const r = simulate(c);
  expect(r.attackerCasts).toBeGreaterThanOrEqual(1);
  expect(r.targetCasts).toBe(0);
});

test("the target casts from its own attacks: the per-attack path, reversed", () => {
  const r = simulate(config({ mode: "fixed-duration", durationSeconds: 15 }));
  // The fighter profile gains neither from hits taken nor per second: its
  // casts can only come from its own swings.
  expect(r.targetCasts).toBeGreaterThanOrEqual(1);
});

test("mirror duel: totalDamageDealt equals totalDamageTaken", () => {
  const r = simulate(config({ mode: "fixed-duration", durationSeconds: 10 }));
  // Identical fighters, same opening rule, no kill: the duel is symmetric
  // by construction, so the two totals must match exactly.
  expect(r.totalDamageDealt).toBeGreaterThan(0);
  expect(r.totalDamageTaken).toBe(r.totalDamageDealt);
});

test("a tank target casts from taking hits: the damage-taken path end to end", () => {
  const c: CombatConfig = {
    attacker: side(),
    target: { ...side(), unitId: PROVISIONAL_TANK_UNIT_ID },
    // 18 s discriminates the mana source: the tank's own swings alone (5 per
    // attack at 0.85/s) cannot fill the 100 gauge before ~22 s; with the
    // hits it takes converting on top, the first cast lands by ~17 s.
    stopCondition: { mode: "fixed-duration", durationSeconds: 18 },
  };
  const r = simulate(c);
  expect(r.targetCasts).toBeGreaterThanOrEqual(1);
});

test("a caster target casts without ever attacking: the regen path end to end", () => {
  const c: CombatConfig = {
    attacker: side(),
    target: { ...side(), unitId: PROVISIONAL_NO_ATTACK_CASTER_UNIT_ID },
    stopCondition: { mode: "fixed-duration", durationSeconds: 60 },
  };
  const r = simulate(c);
  // No swings (attackSpeed 0) and no gain from hits taken: only the 2/s
  // flow can have filled the gauge.
  expect(r.targetCasts).toBeGreaterThanOrEqual(1);
});

test("a tank attacker casts from taking hits: the damage-taken path, reversed", () => {
  const c: CombatConfig = {
    attacker: { ...side(), unitId: PROVISIONAL_TANK_UNIT_ID },
    target: side(),
    // 18 s discriminates the mana source: the tank's own swings alone (5 per
    // attack at 0.85/s) cannot fill the 100 gauge before ~22 s; with the
    // hits it takes converting on top, the first cast lands by ~17 s.
    stopCondition: { mode: "fixed-duration", durationSeconds: 18 },
  };
  const r = simulate(c);
  expect(r.attackerCasts).toBeGreaterThanOrEqual(1);
});

test("a unit with no mana bar never casts, however long the run", () => {
  const c: CombatConfig = {
    attacker: { ...side(), unitId: PROVISIONAL_NO_MANA_UNIT_ID },
    target: side(),
    stopCondition: { mode: "fixed-duration", durationSeconds: 30 },
  };
  const r = simulate(c);
  expect(r.attackerCasts).toBe(0);
});

test("an attack-damage item on the attacker raises the damage dealt", () => {
  const bare = config({ mode: "fixed-duration", durationSeconds: 8 });
  const armed: CombatConfig = {
    ...bare,
    attacker: { ...side(), itemIds: [PROVISIONAL_SWORD_ITEM_ID] },
  };
  expect(simulate(armed).totalDamageDealt).toBeGreaterThan(
    simulate(bare).totalDamageDealt,
  );
});

test("a reduction item on the target lowers the damage dealt to it", () => {
  const bare = config({ mode: "fixed-duration", durationSeconds: 8 });
  const plated: CombatConfig = {
    ...bare,
    target: { ...side(), itemIds: [PROVISIONAL_PLATING_ITEM_ID] },
  };
  expect(simulate(plated).totalDamageDealt).toBeLessThan(
    simulate(bare).totalDamageDealt,
  );
});

// The three runs below inject the fixture set's registry: the end-to-end
// proof of the cast-to-damage chain (cast -> spell function -> damage
// modifier -> resolve-damage -> target HP -> SimulationResult).

test("spell damage end to end, hand-derivable: casts × per-cast damage", () => {
  const c: CombatConfig = {
    // The no-attack caster isolates the spell: no swings, mana from the 2/s
    // flow alone, so the whole tally is the spell's.
    attacker: { ...side(), unitId: PROVISIONAL_NO_ATTACK_CASTER_UNIT_ID },
    target: side(),
    stopCondition: { mode: "fixed-duration", durationSeconds: 120 },
  };
  const r = simulate(c, FIXTURE_SPELL_REGISTRY);
  // Gauge fills at 2/s: casts at t=50s and t=100s. Each burst: 230 base
  // × ability power 1, into 25 magic resist (× 0.8) → 184 dealt.
  expect(r.attackerCasts).toBe(2);
  expect(r.totalDamageDealt).toBe(368);
  expect(r.stopReason).toBe("timer");
});

test("a lethal spell ends the run: the kill lands earlier than by attacks alone", () => {
  const c: CombatConfig = {
    attacker: { ...side(), unitId: PROVISIONAL_CASTER_UNIT_ID },
    target: side(),
    stopCondition: { mode: "time-to-kill" },
  };
  const bare = simulate(c);
  const armed = simulate(c, FIXTURE_SPELL_REGISTRY);
  // Same config, same mechanics: only the registry differs. Both runs kill;
  // the burst replaces several swings' worth of damage, so the armed kill
  // lands sooner.
  expect(bare.stopReason).toBe("kill");
  expect(armed.stopReason).toBe("kill");
  expect(armed.effectiveDurationSeconds).toBeLessThan(
    bare.effectiveDurationSeconds,
  );
});

test("an ability-power item raises spell damage: the cast reads the effective view", () => {
  const bare: CombatConfig = {
    attacker: { ...side(), unitId: PROVISIONAL_NO_ATTACK_CASTER_UNIT_ID },
    target: side(),
    stopCondition: { mode: "fixed-duration", durationSeconds: 60 },
  };
  const armed: CombatConfig = {
    ...bare,
    attacker: { ...bare.attacker, itemIds: [PROVISIONAL_ROD_ITEM_ID] },
  };
  // One cast each (t=50s). Bare: 230 × 1.0 × 0.8 = 184. With the rod's
  // +0.25 ability power: 230 × 1.25 × 0.8 = 230.
  expect(simulate(bare, FIXTURE_SPELL_REGISTRY).totalDamageDealt).toBe(184);
  expect(simulate(armed, FIXTURE_SPELL_REGISTRY).totalDamageDealt).toBe(230);
});

test("a timed self-buff raises the caster's own auto-attack damage over the run (#70)", () => {
  const c: CombatConfig = {
    attacker: { ...side(), unitId: PROVISIONAL_RALLY_CASTER_UNIT_ID },
    target: side(),
    stopCondition: { mode: "fixed-duration", durationSeconds: 60 },
  };
  // Same config, same swings; only the registry differs. Without it the cast is
  // a no-op; with it, rally folds a timed attack-damage buff into the caster
  // each cast, so its auto-attacks land harder for the window — the run's whole
  // damage tally is strictly higher. This is the mid-run apply + refold + expiry
  // machinery observed end to end (its revert is pinned in timed-modifiers.test).
  const bare = simulate(c);
  const armed = simulate(c, FIXTURE_SPELL_REGISTRY);
  expect(armed.attackerCasts).toBeGreaterThan(0);
  expect(armed.totalDamageDealt).toBeGreaterThan(bare.totalDamageDealt);
});
