import { test, expect } from "bun:test";
import { createEventQueue, type EventQueue } from "./event-queue";
import type { CombatEvent } from "./combat-event";
import type { CombatantId } from "./combatant-id";
import type { Ticks } from "./time";

// Fixtures build a CombatEvent at a given tick. Tests cast directly; the engine's
// real producer of `Ticks` is `secondsToTicks`. The queue only ever looks at
// `time`, so attacker/target are placeholders.
const event = (time: number): CombatEvent => ({
  kind: "auto-attack",
  time: time as Ticks,
  attacker: "attacker" as CombatantId,
  target: "target" as CombatantId,
});

// Drain the queue, collecting the popped times in order.
const drainTimes = (q: EventQueue): number[] => {
  const out: number[] = [];
  for (let e = q.popNext(); e !== undefined; e = q.popNext()) out.push(e.time);
  return out;
};

test("empty queue pops undefined", () => {
  expect(createEventQueue().popNext()).toBeUndefined();
});

test("pops earliest time first, regardless of push order", () => {
  const q = createEventQueue();
  const e10 = event(10);
  const e20 = event(20);
  const e30 = event(30);
  q.push(e30);
  q.push(e10);
  q.push(e20);
  expect(q.popNext()).toBe(e10);
  expect(q.popNext()).toBe(e20);
  expect(q.popNext()).toBe(e30);
});

test("same-tick events pop in push order (seq tiebreaker)", () => {
  const q = createEventQueue();
  const first = event(30);
  const second = event(30);
  q.push(first);
  q.push(second);
  expect(q.popNext()).toBe(first);
  expect(q.popNext()).toBe(second);
});

test("deterministic: identical pushes yield identical pop order", () => {
  const scenario = [30, 10, 30, 20, 10];
  const run = (): number[] => {
    const q = createEventQueue();
    for (const t of scenario) q.push(event(t));
    return drainTimes(q);
  };
  expect(run()).toEqual(run());
});
