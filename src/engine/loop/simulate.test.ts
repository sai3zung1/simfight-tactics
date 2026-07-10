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
  PROVISIONAL_IMMORTAL_UNIT_ID,
  PROVISIONAL_NO_ATTACK_CASTER_UNIT_ID,
  PROVISIONAL_NO_MANA_UNIT_ID,
  PROVISIONAL_TANK_UNIT_ID,
} from "../provisional/provisional-stats";
import {
  PROVISIONAL_SWORD_ITEM_ID,
  PROVISIONAL_PLATING_ITEM_ID,
} from "../provisional/provisional-modifiers";

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
