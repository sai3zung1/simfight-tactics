import { test, expect } from "bun:test";
import { simulate, runLoop } from "./simulate";
import { createEventQueue } from "./event-queue";
import type { CombatEvent } from "./combat-event";
import type { Ticks } from "./time";
import type { CombatConfig } from "../domain/combat/combat-config";
import type { StopCondition } from "../domain/combat/stop-condition";
import type { BoardSide } from "../domain/combat/board-side";
import type { UnitId } from "../domain/primitives";

// Fixtures: a minimal CombatConfig. `simulate` ignores attacker/target content
// in #46 — they only need to satisfy the types.
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

const event = (time: number): CombatEvent => ({ time: time as Ticks });

test("runLoop processes events in order, ignoring those past endTime", () => {
  const q = createEventQueue();
  q.push(event(30));
  q.push(event(10));
  q.push(event(20));
  q.push(event(999)); // beyond endTime → must be skipped
  const seen: number[] = [];
  runLoop(q, 100 as Ticks, (e) => seen.push(e.time));
  expect(seen).toEqual([10, 20, 30]);
});

test("time_to_kill runs to the 60s cap -> timeout", () => {
  const r = simulate(config({ mode: "time_to_kill" }));
  expect(r.stopReason).toBe("timeout");
  expect(r.effectiveDurationSeconds).toBe(60);
  expect(r.totalDamageDealt).toBe(0);
  expect(r.totalDamageTaken).toBe(0);
});

test("fixed_duration runs the full duration -> timer", () => {
  const r = simulate(config({ mode: "fixed_duration", durationSeconds: 8 }));
  expect(r.stopReason).toBe("timer");
  expect(r.effectiveDurationSeconds).toBe(8);
});

test("first_trigger runs to the timer -> timer", () => {
  const r = simulate(config({ mode: "first_trigger", durationSeconds: 5 }));
  expect(r.stopReason).toBe("timer");
  expect(r.effectiveDurationSeconds).toBe(5);
});

test("deterministic: same config yields an identical result", () => {
  const c = config({ mode: "fixed_duration", durationSeconds: 8 });
  expect(simulate(c)).toEqual(simulate(c));
});
