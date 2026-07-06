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
import { PROVISIONAL_IMMORTAL_UNIT_ID } from "../provisional/provisional-stats";
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

test("time_to_kill ends on the target's death, reporting the kill instant", () => {
  const r = simulate(config({ mode: "time_to_kill" }));
  expect(r.stopReason).toBe("kill");
  expect(r.totalDamageDealt).toBeGreaterThan(0);
  expect(r.totalDamageTaken).toBe(0);
  expect(r.effectiveDurationSeconds).toBeGreaterThan(0);
  expect(r.effectiveDurationSeconds).toBeLessThan(60);
});

test("time_to_kill runs to the 60s cap when the target can't be killed in time -> timeout", () => {
  const c: CombatConfig = {
    attacker: side(),
    target: { ...side(), unitId: PROVISIONAL_IMMORTAL_UNIT_ID },
    stopCondition: { mode: "time_to_kill" },
  };
  const r = simulate(c);
  expect(r.stopReason).toBe("timeout");
  expect(r.effectiveDurationSeconds).toBe(60);
  expect(r.totalDamageDealt).toBeGreaterThan(0);
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

test("first_trigger ends on the target's death when it dies before the timer -> kill", () => {
  const r = simulate(config({ mode: "first_trigger", durationSeconds: 30 }));
  expect(r.stopReason).toBe("kill");
  expect(r.effectiveDurationSeconds).toBeLessThan(30);
});

test("deterministic: same config yields an identical result", () => {
  const c = config({ mode: "fixed_duration", durationSeconds: 8 });
  expect(simulate(c)).toEqual(simulate(c));
});

test("an attack-damage item on the attacker raises the damage dealt", () => {
  const bare = config({ mode: "fixed_duration", durationSeconds: 8 });
  const armed: CombatConfig = {
    ...bare,
    attacker: { ...side(), itemIds: [PROVISIONAL_SWORD_ITEM_ID] },
  };
  expect(simulate(armed).totalDamageDealt).toBeGreaterThan(
    simulate(bare).totalDamageDealt,
  );
});

test("a reduction item on the target lowers the damage dealt to it", () => {
  const bare = config({ mode: "fixed_duration", durationSeconds: 8 });
  const plated: CombatConfig = {
    ...bare,
    target: { ...side(), itemIds: [PROVISIONAL_PLATING_ITEM_ID] },
  };
  expect(simulate(plated).totalDamageDealt).toBeLessThan(
    simulate(bare).totalDamageDealt,
  );
});
