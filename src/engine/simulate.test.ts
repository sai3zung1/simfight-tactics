import { test, expect } from "bun:test";
import { simulate, runLoop } from "./simulate";
import { createEventQueue } from "./event-queue";
import type { CombatEvent } from "./combat-event";
import type { Ticks } from "./time";
import type { CombatConfig } from "../domain/combat/combat-config";
import type { StopCondition } from "../domain/combat/stop-condition";
import type { BoardSide } from "../domain/combat/board-side";
import type { UnitId } from "../domain/primitives";
import type { CombatantId } from "./combatant-id";

// Fixtures: a minimal CombatConfig. `simulate` resolves both sides against a
// fixed provisional stat profile (provisional-stats.ts) — only `starLevel`
// matters here; items/traits/augments aren't read yet.
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

// This slice's tests only exercise timing, not who is involved — attacker
// and target are placeholders, not read by anything yet.
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

test("time_to_kill ends on the target's death, reporting the kill instant", () => {
  const r = simulate(config({ mode: "time_to_kill" }));
  expect(r.stopReason).toBe("kill");
  expect(r.totalDamageDealt).toBeGreaterThan(0);
  expect(r.totalDamageTaken).toBe(0);
  expect(r.effectiveDurationSeconds).toBeGreaterThan(0);
  expect(r.effectiveDurationSeconds).toBeLessThan(60);
});

test("fixed_duration runs the full duration -> timer, target treated as immortal", () => {
  const r = simulate(config({ mode: "fixed_duration", durationSeconds: 8 }));
  expect(r.stopReason).toBe("timer");
  expect(r.effectiveDurationSeconds).toBe(8);
  expect(r.totalDamageDealt).toBeGreaterThan(0);
});

test("first_trigger runs to the timer when the target survives that long -> timer", () => {
  const r = simulate(config({ mode: "first_trigger", durationSeconds: 5 }));
  expect(r.stopReason).toBe("timer");
  expect(r.effectiveDurationSeconds).toBe(5);
});

test("deterministic: same config yields an identical result", () => {
  const c = config({ mode: "fixed_duration", durationSeconds: 8 });
  expect(simulate(c)).toEqual(simulate(c));
});
