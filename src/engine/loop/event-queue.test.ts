import { test, expect } from "bun:test";
import { createEventQueue, type EventQueue } from "./event-queue";
import type { CombatEvent } from "./combat-event";
import type { CombatantId } from "../stats/combatant-id";
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

const castEvent = (time: number): CombatEvent => ({
  kind: "cast",
  time: time as Ticks,
  caster: "attacker" as CombatantId,
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

test("a cast pre-empts any other kind scheduled on the same tick", () => {
  const q = createEventQueue();
  const attack = event(30);
  const cast = castEvent(30);
  q.push(attack); // pushed first — would win a plain arrival-order tie
  q.push(cast);
  expect(q.popNext()).toBe(cast);
  expect(q.popNext()).toBe(attack);
});

test("same-tick, same-kind events still tie on arrival order", () => {
  const q = createEventQueue();
  const first = castEvent(30);
  const second = castEvent(30);
  q.push(first);
  q.push(second);
  expect(q.popNext()).toBe(first);
  expect(q.popNext()).toBe(second);
});

test("cancel drops every pending event the predicate matches", () => {
  const q = createEventQueue();
  const keep = event(10);
  const drop1 = event(20);
  const drop2 = event(30);
  q.push(keep);
  q.push(drop1);
  q.push(drop2);

  q.cancel((e) => e.time === (20 as Ticks) || e.time === (30 as Ticks));

  expect(q.popNext()).toBe(keep);
  expect(q.popNext()).toBeUndefined();
});

test("cancel matching nothing leaves the queue untouched", () => {
  const q = createEventQueue();
  q.push(event(10));
  q.push(event(20));

  q.cancel((e) => e.time === (999 as Ticks));

  expect(drainTimes(q)).toEqual([10, 20]);
});

test("has reports whether a pending event matches, without consuming it", () => {
  const q = createEventQueue();
  q.push(event(10));

  expect(q.has((e) => e.time === (10 as Ticks))).toBe(true);
  expect(q.has((e) => e.time === (999 as Ticks))).toBe(false);
  // Purely a lookup: the matching event is still there afterwards.
  expect(q.popNext()?.time).toBe(10 as Ticks);
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
