import { test, expect } from "bun:test";
import { processPeriodicTick, schedulePeriodicTicks } from "./periodic-ticks";
import { applyTimedModifier, processModifierExpiry } from "./timed-modifiers";
import { processShieldExpiry } from "./shield";
import { NO_SPELL_ID } from "../spell/contract";
import type { Modifier } from "../../domain/catalog/modifier";
import type { CombatEvent, PeriodicTickEvent } from "../loop/combat-event";
import type { CombatState } from "../loop/combat-state";
import { createEventQueue, type EventQueue } from "../loop/event-queue";
import { applyDamage, refoldStats, type Combatant } from "../stats/combatant";
import type { CombatantId } from "../stats/combatant-id";
import type { ResolvedStats } from "../stats/resolved-stats";
import { NEVER_EXPIRES, addTicks, type Ticks } from "../loop/time";

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
    shields: [],
    ...overrides,
  };
};

const makeState = (attacker: Combatant, target: Combatant): CombatState => ({
  attacker,
  target,
  damageDealtBy: { [attacker.id]: 0, [target.id]: 0 },
  castsBy: { [attacker.id]: 0, [target.id]: 0 },
});

const NOW = 500 as Ticks;

const periodicDamage = (
  seconds: number,
  interval: number,
  base = 100,
  sources?: ["abilityPower"],
): Modifier => ({
  kind: "damage",
  damageType: "magic",
  amount: sources === undefined ? { base } : { base, sources },
  temporality: { kind: "periodic", seconds, interval, mode: "instance" },
});

const drain = (queue: EventQueue): CombatEvent[] => {
  const events: CombatEvent[] = [];
  for (let e = queue.popNext(); e !== undefined; e = queue.popNext()) {
    events.push(e);
  }
  return events;
};

const tickAt = (
  modifier: Modifier,
  time: Ticks,
  source: Combatant,
  target: Combatant,
): PeriodicTickEvent => ({
  kind: "periodic-tick",
  time,
  source: source.id,
  target: target.id,
  modifier,
});

test("a periodic effect expands into its ticks wholesale, the first one interval in", () => {
  const source = makeCombatant("attacker");
  const target = makeCombatant("target");
  const queue = createEventQueue();
  const modifier = periodicDamage(4, 1);

  schedulePeriodicTicks(modifier, source, target, NOW, queue);

  const events = drain(queue);
  expect(events).toHaveLength(4);
  events.forEach((event, i) => {
    expect(event).toEqual({
      kind: "periodic-tick",
      time: addTicks(NOW, ((i + 1) * 1000) as Ticks),
      source: source.id,
      target: target.id,
      modifier,
    });
  });
});

test("the closing tick lands exactly on the window's end: ticks × amount stays whole", () => {
  const source = makeCombatant("attacker");
  const target = makeCombatant("target");
  const queue = createEventQueue();

  schedulePeriodicTicks(periodicDamage(4, 2), source, target, NOW, queue);

  const times = drain(queue).map((e) => e.time);
  expect(times).toEqual([
    addTicks(NOW, 2000 as Ticks),
    addTicks(NOW, 4000 as Ticks),
  ]);
});

test("two casts expand into two independent series, never merged", () => {
  const source = makeCombatant("attacker");
  const target = makeCombatant("target");
  const queue = createEventQueue();
  const modifier = periodicDamage(3, 1);

  schedulePeriodicTicks(modifier, source, target, NOW, queue);
  schedulePeriodicTicks(
    modifier,
    source,
    target,
    addTicks(NOW, 500 as Ticks),
    queue,
  );

  expect(drain(queue)).toHaveLength(6);
});

test("a periodic crowd-control is a loud author bug: no per-tick duration exists", () => {
  const source = makeCombatant("attacker");
  const target = makeCombatant("target");
  const cc: Modifier = {
    kind: "crowd-control",
    cc: "stun",
    temporality: {
      kind: "periodic",
      seconds: 9,
      interval: 3,
      mode: "instance",
    },
  };

  expect(() =>
    schedulePeriodicTicks(cc, source, target, NOW, createEventQueue()),
  ).toThrow();
});

test("a window shorter than its interval is a loud author bug, never a silent no-op", () => {
  const source = makeCombatant("attacker");
  const target = makeCombatant("target");

  expect(() =>
    schedulePeriodicTicks(
      periodicDamage(1, 2),
      source,
      target,
      NOW,
      createEventQueue(),
    ),
  ).toThrow();
});

test("a non-positive interval is a loud author bug", () => {
  const source = makeCombatant("attacker");
  const target = makeCombatant("target");

  expect(() =>
    schedulePeriodicTicks(
      periodicDamage(4, 0),
      source,
      target,
      NOW,
      createEventQueue(),
    ),
  ).toThrow();
});

test("a per-star window reaching scheduling is a loud spell-author bug", () => {
  const source = makeCombatant("attacker");
  const target = makeCombatant("target");
  const unresolved: Modifier = {
    kind: "damage",
    damageType: "magic",
    amount: { base: 100 },
    temporality: {
      kind: "periodic",
      seconds: { 1: 3, 2: 4, 3: 5 },
      interval: 1,
      mode: "instance",
    },
  };

  expect(() =>
    schedulePeriodicTicks(unresolved, source, target, NOW, createEventQueue()),
  ).toThrow();
});

test("a damage tick rides the full pipeline: mitigation, tally, the victim's mana and response cast", () => {
  const source = makeCombatant("attacker");
  const target = makeCombatant(
    "target",
    {
      magicResist: 25,
      manaGeneration: {
        perAttack: 0,
        perSecond: 0,
        gainsFromDamageTaken: true,
      },
    },
    { currentMana: 99 },
  );
  const state = makeState(source, target);
  const queue = createEventQueue();
  const modifier = periodicDamage(4, 1);

  const signal = processPeriodicTick(
    tickAt(modifier, NOW, source, target),
    state,
    queue,
  );

  expect(signal).toBeUndefined();
  // 100 into 25 magic resist → 80 dealt.
  expect(target.currentHp).toBe(920);
  expect(state.damageDealtBy[source.id]).toBe(80);
  // 1% × 100 pre-mitigation + 3% × 80 dealt = 3.4 — fractional, zero-loss:
  // the gauge crosses its threshold and the response cast fires.
  expect(target.currentMana).toBeCloseTo(102.4);
  expect(queue.popNext()?.kind).toBe("cast");
});

test("a killing tick stops the run at its instant", () => {
  const source = makeCombatant("attacker");
  const target = makeCombatant("target", {}, { currentHp: 50 });
  const state = makeState(source, target);

  const signal = processPeriodicTick(
    tickAt(periodicDamage(4, 1), NOW, source, target),
    state,
    createEventQueue(),
  );

  expect(signal).toEqual({ time: NOW });
});

test("a tick re-reads the source's live sheet: a mid-window buff moves later ticks", () => {
  const source = makeCombatant("attacker");
  const target = makeCombatant("target");
  const state = makeState(source, target);
  const queue = createEventQueue();
  const modifier = periodicDamage(4, 1, 100, ["abilityPower"]);

  processPeriodicTick(tickAt(modifier, NOW, source, target), state, queue);
  // 100 × ability power 1, no resist → 100 dealt by the first tick.
  expect(target.currentHp).toBe(900);

  // An ability-power buff lands between two ticks of the same window.
  applyTimedModifier(
    source,
    {
      kind: "stat-mod",
      target: "abilityPower",
      amount: { base: 1 },
      temporality: { kind: "instant" },
    },
    addTicks(NOW, 500 as Ticks),
    NEVER_EXPIRES,
    queue,
  );

  processPeriodicTick(
    tickAt(modifier, addTicks(NOW, 1000 as Ticks), source, target),
    state,
    queue,
  );
  // The second tick re-resolves at ability power 2 → 200, never the cast-time 100.
  expect(target.currentHp).toBe(700);
  expect(state.damageDealtBy[source.id]).toBe(300);
});

const periodicStatMod = (
  mode: "instance" | "accrual",
  base: number,
  target: "armor" | "attackSpeed" = "armor",
  sources?: ["abilityPower"],
): Modifier => ({
  kind: "stat-mod",
  target,
  amount: sources === undefined ? { base } : { base, sources },
  temporality: { kind: "periodic", seconds: 5, interval: 1, mode },
});

test("an accrual stat-mod tick stacks for the run: entries never expire", () => {
  const source = makeCombatant("attacker");
  const target = makeCombatant("target");
  const state = makeState(source, target);
  const queue = createEventQueue();
  const ramp = periodicStatMod("accrual", 0.08, "attackSpeed");

  processPeriodicTick(tickAt(ramp, NOW, source, target), state, queue);
  processPeriodicTick(
    tickAt(ramp, addTicks(NOW, 1000 as Ticks), source, target),
    state,
    queue,
  );

  // Two independent permanent-for-combat entries, additively folded.
  expect(target.stats.attackSpeed).toBeCloseTo(1.16);
  expect(target.timedModifiers).toHaveLength(2);
  expect(
    target.timedModifiers.every((entry) => entry.expiresAt === NEVER_EXPIRES),
  ).toBe(true);
  // Nothing infinite is scheduled: the queue holds no expiry for these.
  expect(queue.popNext()).toBeUndefined();
});

test("an instance stat-mod tick lives one interval: the boundary refreshes, never doubles", () => {
  const source = makeCombatant("attacker");
  const target = makeCombatant("target");
  const state = makeState(source, target);
  const queue = createEventQueue();
  const pulse = periodicStatMod("instance", 40);
  const boundary = addTicks(NOW, 1000 as Ticks);

  processPeriodicTick(tickAt(pulse, NOW, source, target), state, queue);
  expect(target.stats.armor).toBe(40);
  // The residue's expiry is scheduled at the next tick's boundary.
  expect(queue.popNext()).toEqual({
    kind: "modifier-expiry",
    time: boundary,
    combatant: target.id,
  });

  // At the boundary both fire: the next tick's residue lands, the old one is
  // pruned by time — whichever order, the fold ends carrying exactly one.
  processPeriodicTick(tickAt(pulse, boundary, source, target), state, queue);
  processModifierExpiry(
    { kind: "modifier-expiry", time: boundary, combatant: target.id },
    state,
  );

  expect(target.timedModifiers).toHaveLength(1);
  expect(target.stats.armor).toBe(40);
});

test("an accrual shield tick cumulates: what damage ate stays eaten, the rest stacks", () => {
  const source = makeCombatant("attacker");
  const target = makeCombatant("target");
  const state = makeState(source, target);
  const queue = createEventQueue();
  const bulwark: Modifier = {
    kind: "shield",
    amount: { base: 200 },
    temporality: { kind: "periodic", seconds: 5, interval: 1, mode: "accrual" },
  };

  processPeriodicTick(tickAt(bulwark, NOW, source, target), state, queue);
  // Between two ticks, damage erodes the pool — the lane's own behavior.
  applyDamage(target, 50);
  processPeriodicTick(
    tickAt(bulwark, addTicks(NOW, 1000 as Ticks), source, target),
    state,
    queue,
  );

  // 200 - 50 eaten + 200 fresh = 350 alive, across two never-expiring pools.
  const remaining = target.shields.reduce((sum, p) => sum + p.remaining, 0);
  expect(remaining).toBe(350);
  expect(target.currentHp).toBe(1000);
  expect(queue.popNext()).toBeUndefined();
});

test("an instance shield tick restarts the pool each interval: the leftover fades", () => {
  const source = makeCombatant("attacker");
  const target = makeCombatant("target");
  const state = makeState(source, target);
  const queue = createEventQueue();
  const pulse: Modifier = {
    kind: "shield",
    amount: { base: 200 },
    temporality: {
      kind: "periodic",
      seconds: 5,
      interval: 1,
      mode: "instance",
    },
  };
  const boundary = addTicks(NOW, 1000 as Ticks);

  processPeriodicTick(tickAt(pulse, NOW, source, target), state, queue);
  applyDamage(target, 50);

  processPeriodicTick(tickAt(pulse, boundary, source, target), state, queue);
  processShieldExpiry(
    { kind: "shield-expiry", time: boundary, combatant: target.id },
    state,
  );

  // The eroded 150 faded with its window; only the fresh 200 stands.
  expect(target.shields).toHaveLength(1);
  expect(target.shields[0].remaining).toBe(200);
});

test("a mana-generation tick folds the gain and starts the regen chain", () => {
  const source = makeCombatant("attacker");
  const target = makeCombatant("target");
  const state = makeState(source, target);
  const queue = createEventQueue();
  const flow: Modifier = {
    kind: "mana-generation",
    trigger: "per-second",
    amount: { base: 4 },
    temporality: { kind: "periodic", seconds: 5, interval: 1, mode: "accrual" },
  };

  processPeriodicTick(tickAt(flow, NOW, source, target), state, queue);

  expect(target.manaGains["per-second"]).toBe(4);
  // The recipient wasn't ticking: the fold alone pays nothing, so the tick
  // also arms the first regen event.
  expect(queue.popNext()?.kind).toBe("mana-regen");
});

test("a damage-reduction tick folds into the recipient's reduction lane", () => {
  const source = makeCombatant("attacker");
  const target = makeCombatant("target");
  const state = makeState(source, target);
  const damp: Modifier = {
    kind: "damage-reduction",
    amount: { base: 0.25 },
    temporality: { kind: "periodic", seconds: 5, interval: 1, mode: "accrual" },
  };

  processPeriodicTick(
    tickAt(damp, NOW, source, target),
    state,
    createEventQueue(),
  );

  expect(target.damageReductions).toEqual([0.25]);
});

test("a residue tick banks the flat re-read amount: later source changes never retro-move it", () => {
  const source = makeCombatant("attacker", { abilityPower: 2 });
  const target = makeCombatant("target");
  const state = makeState(source, target);
  const queue = createEventQueue();
  const scaled = periodicStatMod("accrual", 10, "armor", ["abilityPower"]);

  processPeriodicTick(tickAt(scaled, NOW, source, target), state, queue);
  // 10 × source ability power 2 = 20, banked flat into the residue.
  expect(target.stats.armor).toBe(20);

  // The source's sheet moves after the tick; the banked residue must not.
  applyTimedModifier(
    source,
    {
      kind: "stat-mod",
      target: "abilityPower",
      amount: { base: 3 },
      temporality: { kind: "instant" },
    },
    addTicks(NOW, 500 as Ticks),
    NEVER_EXPIRES,
    queue,
  );
  refoldStats(target);

  expect(target.stats.armor).toBe(20);
});

test("a heal tick restores up to the effective max, re-read against the source", () => {
  const source = makeCombatant("attacker", { abilityPower: 2 });
  const target = makeCombatant("target", {}, { currentHp: 700 });
  const state = makeState(source, target);
  const heal: Modifier = {
    kind: "heal",
    amount: { base: 100, sources: ["abilityPower"] },
    temporality: {
      kind: "periodic",
      seconds: 3,
      interval: 1,
      mode: "instance",
    },
  };

  processPeriodicTick(
    tickAt(heal, NOW, source, target),
    state,
    createEventQueue(),
  );

  // 100 × source ability power 2 = 200 healed → 900.
  expect(target.currentHp).toBe(900);

  processPeriodicTick(
    tickAt(heal, addTicks(NOW, 1000 as Ticks), source, target),
    state,
    createEventQueue(),
  );
  // 900 + 200 caps at the 1000 max — the surplus is lost.
  expect(target.currentHp).toBe(1000);
});
