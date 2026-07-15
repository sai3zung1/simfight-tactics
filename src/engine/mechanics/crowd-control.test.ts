import { test, expect } from "bun:test";
import { applyCrowdControl, processCrowdControlExpiry } from "./crowd-control";
import { processCast } from "./casting";
import { createEventQueue } from "../loop/event-queue";
import { NO_SPELL_ID } from "../spell/contract";
import type { Combatant } from "../stats/combatant";
import type { CombatState } from "../loop/combat-state";
import type { CombatantId } from "../stats/combatant-id";
import type { ResolvedStats } from "../stats/resolved-stats";
import type { CrowdControlExpiryEvent } from "../loop/combat-event";
import type { CrowdControl } from "../../domain/catalog/modifier";
import type { Ticks } from "../loop/time";

const makeCombatant = (
  id: string,
  stats: Partial<ResolvedStats> = {},
  overrides: Partial<Combatant> = {},
): Combatant => {
  const resolvedStats: ResolvedStats = {
    hp: 1000,
    armor: 0,
    magicResist: 0,
    durability: 0,
    mana: { min: 0, start: 0, max: 100 },
    manaGeneration: { perAttack: 0, perSecond: 0, gainsFromDamageTaken: false },
    attackDamage: 100,
    abilityPower: 1,
    attackSpeed: 1,
    critChance: 0,
    critDamage: 0,
    damageAmp: 0,
    ...stats,
  };
  return {
    id: id as CombatantId,
    canDie: true,
    currentHp: 1000,
    currentMana: 0,
    damageReductions: [],
    activeCrowdControl: [],
    spellId: NO_SPELL_ID,
    spellParameters: {},
    manaGains: {
      "on-attack": 0,
      "per-second": 0,
      "post-cast": 0,
      "on-damage-taken": 0,
    },
    stats: resolvedStats,
    resolvedStats,
    permanentModifiers: [],
    starLevel: 1,
    timedModifiers: [],
    ...overrides,
  };
};

const makeState = (attacker: Combatant, target: Combatant): CombatState => ({
  attacker,
  target,
  damageDealtBy: { [attacker.id]: 0, [target.id]: 0 },
  castsBy: { [attacker.id]: 0, [target.id]: 0 },
});

const expiry = (
  combatant: Combatant,
  cc: CrowdControl,
  time: number,
): CrowdControlExpiryEvent => ({
  kind: "crowd-control-expiry",
  time: time as Ticks,
  combatant: combatant.id,
  cc,
});

test("applying a crowd-control effect records it with the right end tick", () => {
  const c = makeCombatant("attacker");
  const queue = createEventQueue();

  applyCrowdControl(c, "stun", 0 as Ticks, 3000 as Ticks, queue);

  expect(c.activeCrowdControl).toEqual([
    { cc: "stun", blockedThrough: 3000 as Ticks },
  ]);
});

test("applying an attack-blocking effect schedules its expiry one tick after it ends", () => {
  const c = makeCombatant("attacker");
  const queue = createEventQueue();

  applyCrowdControl(c, "stun", 0 as Ticks, 3000 as Ticks, queue);

  const scheduled = queue.popNext();
  expect(scheduled?.kind).toBe("crowd-control-expiry");
  expect(scheduled?.time).toBe(3001 as Ticks);
});

test("stun cancels the combatant's own pending auto-attack, not the opponent's", () => {
  const attacker = makeCombatant("attacker");
  const target = makeCombatant("target");
  const queue = createEventQueue();
  queue.push({
    kind: "auto-attack",
    time: 500 as Ticks,
    attacker: attacker.id,
    target: target.id,
  });
  queue.push({
    kind: "auto-attack",
    time: 600 as Ticks,
    attacker: target.id,
    target: attacker.id,
  });

  applyCrowdControl(attacker, "stun", 0 as Ticks, 3000 as Ticks, queue);

  const first = queue.popNext();
  expect(first?.kind).toBe("auto-attack");
  if (first?.kind === "auto-attack") expect(first.attacker).toBe(target.id);
  const second = queue.popNext();
  expect(second?.kind).toBe("crowd-control-expiry");
  expect(queue.popNext()).toBeUndefined();
});

test("silence leaves a pending auto-attack untouched", () => {
  const attacker = makeCombatant("attacker");
  const target = makeCombatant("target");
  const queue = createEventQueue();
  queue.push({
    kind: "auto-attack",
    time: 500 as Ticks,
    attacker: attacker.id,
    target: target.id,
  });

  applyCrowdControl(attacker, "silence", 0 as Ticks, 3000 as Ticks, queue);

  const first = queue.popNext();
  expect(first?.kind).toBe("auto-attack");
  expect(first?.time).toBe(500 as Ticks);
  const second = queue.popNext();
  expect(second?.kind).toBe("crowd-control-expiry");
});

test("expiry re-arms the attack when it was the stun that blocked it", () => {
  const attacker = makeCombatant("attacker");
  const target = makeCombatant("target");
  const state = makeState(attacker, target);
  const queue = createEventQueue();

  processCrowdControlExpiry(expiry(attacker, "stun", 3001), state, queue);

  const next = queue.popNext();
  expect(next?.kind).toBe("auto-attack");
  if (next?.kind === "auto-attack") {
    expect(next.attacker).toBe(attacker.id);
    expect(next.target).toBe(target.id);
    expect(next.time).toBe(3001 as Ticks);
  }
});

test("expiry re-arms a disarmed target's attack, against the attacker", () => {
  const attacker = makeCombatant("attacker");
  const target = makeCombatant("target");
  const state = makeState(attacker, target);
  const queue = createEventQueue();

  processCrowdControlExpiry(expiry(target, "disarm", 3001), state, queue);

  const next = queue.popNext();
  expect(next?.kind).toBe("auto-attack");
  if (next?.kind === "auto-attack") {
    expect(next.attacker).toBe(target.id);
    expect(next.target).toBe(attacker.id);
  }
});

test("silence expiring never restarts an attack chain it never stopped", () => {
  const attacker = makeCombatant("attacker");
  const target = makeCombatant("target");
  const state = makeState(attacker, target);
  const queue = createEventQueue();

  processCrowdControlExpiry(expiry(attacker, "silence", 3001), state, queue);

  expect(queue.popNext()).toBeUndefined();
});

test("a still-active second stun blocks the re-arm even though this one just expired", () => {
  const attacker = makeCombatant("attacker");
  const target = makeCombatant("target");
  attacker.activeCrowdControl.push({
    cc: "stun",
    blockedThrough: 5000 as Ticks,
  });
  const state = makeState(attacker, target);
  const queue = createEventQueue();

  processCrowdControlExpiry(expiry(attacker, "stun", 3001), state, queue);

  expect(queue.popNext()).toBeUndefined();
});

test("a unit that never attacks doesn't get an attack re-armed", () => {
  const attacker = makeCombatant("attacker", { attackSpeed: 0 });
  const target = makeCombatant("target");
  const state = makeState(attacker, target);
  const queue = createEventQueue();

  processCrowdControlExpiry(expiry(attacker, "stun", 3001), state, queue);

  expect(queue.popNext()).toBeUndefined();
});

test("expiry fires a cast immediately when the gauge was already full", () => {
  const attacker = makeCombatant("attacker", {}, { currentMana: 100 });
  const target = makeCombatant("target");
  const state = makeState(attacker, target);
  const queue = createEventQueue();

  processCrowdControlExpiry(expiry(attacker, "silence", 3001), state, queue);

  const next = queue.popNext();
  expect(next?.kind).toBe("cast");
  if (next?.kind === "cast") {
    expect(next.caster).toBe(attacker.id);
    expect(next.time).toBe(3001 as Ticks);
  }
});

test("expiry does nothing for the cast when the gauge isn't full", () => {
  const attacker = makeCombatant("attacker", {}, { currentMana: 50 });
  const target = makeCombatant("target");
  const state = makeState(attacker, target);
  const queue = createEventQueue();

  processCrowdControlExpiry(expiry(attacker, "silence", 3001), state, queue);

  expect(queue.popNext()).toBeUndefined();
});

test("two attack-blocking effects expiring on the same tick only re-arm the attack once", () => {
  const attacker = makeCombatant("attacker");
  const target = makeCombatant("target");
  const state = makeState(attacker, target);
  const queue = createEventQueue();

  processCrowdControlExpiry(expiry(attacker, "stun", 3001), state, queue);
  processCrowdControlExpiry(expiry(attacker, "disarm", 3001), state, queue);

  const first = queue.popNext();
  expect(first?.kind).toBe("auto-attack");
  expect(queue.popNext()).toBeUndefined();
});

test("two effects that both find the gauge full on the same tick still resolve only one cast", () => {
  // Each expiry rechecks independently and finds the gauge still full — the
  // same double-gain shape `processCast`'s own guard already exists for
  // (casting.test.ts, "a cast event finding an already-spent gauge is
  // dropped"); no dedup logic needed here, only proof the interaction holds.
  const attacker = makeCombatant("attacker", {}, { currentMana: 100 });
  const target = makeCombatant("target");
  const state = makeState(attacker, target);
  const queue = createEventQueue();

  processCrowdControlExpiry(expiry(attacker, "silence", 3001), state, queue);
  processCrowdControlExpiry(expiry(attacker, "stun", 3001), state, queue);

  for (let e = queue.popNext(); e !== undefined; e = queue.popNext()) {
    if (e.kind === "cast") processCast(e, state, queue);
  }

  expect(state.castsBy[attacker.id]).toBe(1);
});

test("full lifecycle: apply then expire re-arms the attack exactly at the boundary", () => {
  const attacker = makeCombatant("attacker");
  const target = makeCombatant("target");
  const state = makeState(attacker, target);
  const queue = createEventQueue();
  queue.push({
    kind: "auto-attack",
    time: 700 as Ticks,
    attacker: attacker.id,
    target: target.id,
  });

  applyCrowdControl(attacker, "stun", 0 as Ticks, 3000 as Ticks, queue);
  const scheduledExpiry = queue.popNext();
  expect(scheduledExpiry?.kind).toBe("crowd-control-expiry");
  expect(queue.popNext()).toBeUndefined();

  processCrowdControlExpiry(
    scheduledExpiry as CrowdControlExpiryEvent,
    state,
    queue,
  );

  const rearmed = queue.popNext();
  expect(rearmed?.kind).toBe("auto-attack");
  if (rearmed?.kind === "auto-attack") {
    expect(rearmed.attacker).toBe(attacker.id);
    expect(rearmed.time).toBe(3001 as Ticks);
  }
});
