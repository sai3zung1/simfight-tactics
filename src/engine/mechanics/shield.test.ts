import { test, expect } from "bun:test";
import { applyShield, processShieldExpiry } from "./shield";
import { resolveCombatant, type Combatant } from "../stats/combatant";
import type { CombatantId } from "../stats/combatant-id";
import type { ShieldExpiryEvent } from "../loop/combat-event";
import type { CombatState } from "../loop/combat-state";
import { createEventQueue } from "../loop/event-queue";
import { NEVER_EXPIRES, secondsToTicks, TICK_ZERO } from "../loop/time";
import { PROVISIONAL_FIGHTER_STATS } from "../provisional/provisional-stats";

const makeCombatant = (): Combatant =>
  resolveCombatant(
    PROVISIONAL_FIGHTER_STATS,
    1,
    "attacker" as CombatantId,
    [],
    false,
  );

const stateWith = (c: Combatant): CombatState => ({
  attacker: c,
  target: c,
  damageDealtBy: { [c.id]: 0 },
  castsBy: { [c.id]: 0 },
});

const expiryAt = (seconds: number, c: Combatant): ShieldExpiryEvent => ({
  kind: "shield-expiry",
  time: secondsToTicks(seconds),
  combatant: c.id,
});

test("a permanent-for-combat shield pushes a pool and schedules no expiry", () => {
  const c = makeCombatant();
  const queue = createEventQueue();

  applyShield(c, 300, TICK_ZERO, NEVER_EXPIRES, queue);

  expect(c.shields).toEqual([{ remaining: 300, expiresAt: NEVER_EXPIRES }]);
  expect(queue.popNext()).toBeUndefined();
});

test("a timed shield pushes a pool and schedules its expiry", () => {
  const c = makeCombatant();
  const queue = createEventQueue();

  applyShield(c, 300, TICK_ZERO, secondsToTicks(4), queue);

  expect(c.shields).toEqual([{ remaining: 300, expiresAt: secondsToTicks(4) }]);
  expect(queue.popNext()).toEqual({
    kind: "shield-expiry",
    time: secondsToTicks(4),
    combatant: c.id,
  });
});

test("shields are additive and independent: each application is its own pool", () => {
  const c = makeCombatant();
  const queue = createEventQueue();

  applyShield(c, 300, TICK_ZERO, NEVER_EXPIRES, queue);
  applyShield(c, 200, TICK_ZERO, NEVER_EXPIRES, queue);

  expect(c.shields).toHaveLength(2);
  expect(c.shields.map((s) => s.remaining)).toEqual([300, 200]);
});

test("a shield expiry drops the pool whose window has closed", () => {
  const c = makeCombatant();
  const queue = createEventQueue();
  applyShield(c, 300, TICK_ZERO, secondsToTicks(4), queue);

  processShieldExpiry(expiryAt(4, c), stateWith(c));

  expect(c.shields).toHaveLength(0);
});

test("two pools sharing an expiry tick both go, and the duplicate event is inert", () => {
  const c = makeCombatant();
  const queue = createEventQueue();
  applyShield(c, 300, TICK_ZERO, secondsToTicks(4), queue);
  applyShield(c, 200, TICK_ZERO, secondsToTicks(4), queue);

  const state = stateWith(c);
  processShieldExpiry(expiryAt(4, c), state);
  expect(c.shields).toHaveLength(0);
  // The twin event finds nothing left to prune.
  processShieldExpiry(expiryAt(4, c), state);
  expect(c.shields).toHaveLength(0);
});

test("an expiry prunes the closed pool and leaves a still-live one standing", () => {
  const c = makeCombatant();
  const queue = createEventQueue();
  applyShield(c, 300, TICK_ZERO, secondsToTicks(4), queue); // closes at 4s
  applyShield(c, 200, TICK_ZERO, secondsToTicks(8), queue); // still open at 4s

  processShieldExpiry(expiryAt(4, c), stateWith(c));

  expect(c.shields).toHaveLength(1);
  expect(c.shields[0].remaining).toBe(200);
});
