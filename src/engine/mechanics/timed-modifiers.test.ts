import { test, expect } from "bun:test";
import { applyTimedModifier, processModifierExpiry } from "./timed-modifiers";
import { resolveCombatant, type Combatant } from "../stats/combatant";
import { createEventQueue } from "../loop/event-queue";
import type { CombatState } from "../loop/combat-state";
import type { CombatantId } from "../stats/combatant-id";
import type { Modifier } from "../../domain/catalog/modifier";
import type { ModifierExpiryEvent } from "../loop/combat-event";
import { NEVER_EXPIRES, secondsToTicks, TICK_ZERO } from "../loop/time";
import { PROVISIONAL_FIGHTER_STATS } from "../provisional/provisional-stats";

// A flat, timed attack-damage buff — the demonstrator's shape (#70).
const bonusAd = (amount: number, seconds: number): Modifier => ({
  kind: "stat-mod",
  target: "attackDamage",
  amount: { base: amount },
  temporality: { kind: "duration", seconds },
});

// A flat, permanent-for-combat attack-damage buff (#71, D2).
const permanentAd = (amount: number): Modifier => ({
  kind: "stat-mod",
  target: "attackDamage",
  amount: { base: amount },
  temporality: { kind: "instant" },
});

// A flat, timed max-HP buff — the reconciliation demonstrator (#71, D3).
const bonusHp = (amount: number, seconds: number): Modifier => ({
  kind: "stat-mod",
  target: "hp",
  amount: { base: amount },
  temporality: { kind: "duration", seconds },
});

// A timed damage-reduction and per-second mana gain — the D1 demonstrators:
// refoldStats re-derives every view, not just the stat fold.
const bonusReduction = (amount: number, seconds: number): Modifier => ({
  kind: "damage-reduction",
  amount: { base: amount },
  temporality: { kind: "duration", seconds },
});
const bonusPerSecondMana = (amount: number, seconds: number): Modifier => ({
  kind: "mana-generation",
  trigger: "per-second",
  amount: { base: amount },
  temporality: { kind: "duration", seconds },
});

// A real combatant so the fold runs against actual resolved stats; the fighter
// profile's star-1 attack damage is the pre-buff baseline every case reverts to.
// No permanent modifiers and cannot die: the fold starts from the resolved base.
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

const expiryAt = (seconds: number, c: Combatant): ModifierExpiryEvent => ({
  kind: "modifier-expiry",
  time: secondsToTicks(seconds),
  combatant: c.id,
});

test("applying a timed modifier folds it into stats and schedules its expiry", () => {
  const c = makeCombatant();
  const queue = createEventQueue();
  const base = c.stats.attackDamage;

  applyTimedModifier(c, bonusAd(40, 4), TICK_ZERO, secondsToTicks(4), queue);

  expect(c.stats.attackDamage).toBe(base + 40);
  expect(queue.popNext()).toEqual({
    kind: "modifier-expiry",
    time: secondsToTicks(4),
    combatant: c.id,
  });
});

test("when the expiry fires, the modifier is pruned and stats revert", () => {
  const c = makeCombatant();
  const queue = createEventQueue();
  const base = c.stats.attackDamage;
  applyTimedModifier(c, bonusAd(40, 4), TICK_ZERO, secondsToTicks(4), queue);

  processModifierExpiry(expiryAt(4, c), stateWith(c));

  expect(c.timedModifiers).toHaveLength(0);
  expect(c.stats.attackDamage).toBe(base);
});

test("timed modifiers stack additively and expire independently", () => {
  const c = makeCombatant();
  const queue = createEventQueue();
  const base = c.stats.attackDamage;
  applyTimedModifier(c, bonusAd(40, 4), TICK_ZERO, secondsToTicks(4), queue);
  applyTimedModifier(c, bonusAd(30, 8), TICK_ZERO, secondsToTicks(8), queue);
  expect(c.stats.attackDamage).toBe(base + 70);

  const state = stateWith(c);
  // The 4s buff ends first; the 8s buff still stands.
  processModifierExpiry(expiryAt(4, c), state);
  expect(c.timedModifiers).toHaveLength(1);
  expect(c.stats.attackDamage).toBe(base + 30);

  // The 8s buff ends; back to the pre-buff baseline.
  processModifierExpiry(expiryAt(8, c), state);
  expect(c.timedModifiers).toHaveLength(0);
  expect(c.stats.attackDamage).toBe(base);
});

test("a permanent-for-combat modifier folds in, schedules no expiry, and no prune removes it", () => {
  const c = makeCombatant();
  const queue = createEventQueue();
  const base = c.stats.attackDamage;

  applyTimedModifier(c, permanentAd(40), TICK_ZERO, NEVER_EXPIRES, queue);

  expect(c.stats.attackDamage).toBe(base + 40);
  // A NEVER_EXPIRES entry queues nothing — nothing infinite enters the loop.
  expect(queue.popNext()).toBeUndefined();

  // Even a prune at a far-future tick leaves the entry standing.
  processModifierExpiry(expiryAt(9999, c), stateWith(c));
  expect(c.timedModifiers).toHaveLength(1);
  expect(c.stats.attackDamage).toBe(base + 40);
});

test("an hp buff expiring clamps current HP under the new max, and never kills (D3)", () => {
  const c = makeCombatant(); // fighter star-1: max 550, current 550
  const queue = createEventQueue();
  const base = c.stats.hp;

  applyTimedModifier(c, bonusHp(200, 4), TICK_ZERO, secondsToTicks(4), queue);
  expect(c.stats.hp).toBe(base + 200);
  expect(c.currentHp).toBe(base + 200); // carried up with the max

  // Spend part of the buffed pool — still above the un-buffed max — then expire.
  c.currentHp = base + 100;
  processModifierExpiry(expiryAt(4, c), stateWith(c));
  expect(c.stats.hp).toBe(base);
  expect(c.currentHp).toBe(base); // clamped down to the new max, alive
});

test("an hp buff expiring leaves an already-low current HP untouched", () => {
  const c = makeCombatant();
  const queue = createEventQueue();
  applyTimedModifier(c, bonusHp(200, 4), TICK_ZERO, secondsToTicks(4), queue);

  c.currentHp = 100; // well under even the un-buffed max
  processModifierExpiry(expiryAt(4, c), stateWith(c));
  expect(c.currentHp).toBe(100); // no clamp applies
});

test("a timed damage-reduction folds into its lane and reverts on expiry (D1)", () => {
  const c = makeCombatant();
  const queue = createEventQueue();
  expect(c.damageReductions).toEqual([]);

  applyTimedModifier(
    c,
    bonusReduction(0.2, 4),
    TICK_ZERO,
    secondsToTicks(4),
    queue,
  );
  expect(c.damageReductions).toEqual([0.2]);

  processModifierExpiry(expiryAt(4, c), stateWith(c));
  expect(c.damageReductions).toEqual([]);
});

test("a timed mana-generation folds into its trigger bucket and reverts on expiry (D1)", () => {
  const c = makeCombatant();
  const queue = createEventQueue();
  expect(c.manaGains["per-second"]).toBe(0);

  applyTimedModifier(
    c,
    bonusPerSecondMana(3, 4),
    TICK_ZERO,
    secondsToTicks(4),
    queue,
  );
  expect(c.manaGains["per-second"]).toBe(3);

  processModifierExpiry(expiryAt(4, c), stateWith(c));
  expect(c.manaGains["per-second"]).toBe(0);
});

test("two modifiers sharing an expiry tick both go, and the duplicate event is inert", () => {
  const c = makeCombatant();
  const queue = createEventQueue();
  const base = c.stats.attackDamage;
  applyTimedModifier(c, bonusAd(40, 4), TICK_ZERO, secondsToTicks(4), queue);
  applyTimedModifier(c, bonusAd(30, 4), TICK_ZERO, secondsToTicks(4), queue);

  const state = stateWith(c);
  const expiry = expiryAt(4, c);
  // First event prunes both same-tick entries at once.
  processModifierExpiry(expiry, state);
  expect(c.timedModifiers).toHaveLength(0);
  expect(c.stats.attackDamage).toBe(base);
  // The twin event finds nothing to prune and leaves stats untouched.
  processModifierExpiry(expiry, state);
  expect(c.stats.attackDamage).toBe(base);
});
