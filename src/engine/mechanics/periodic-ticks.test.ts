import { test, expect } from "bun:test";
import { processPeriodicTick, schedulePeriodicTicks } from "./periodic-ticks";
import { applyTimedModifier } from "./timed-modifiers";
import { NO_SPELL_ID } from "../spell/contract";
import type { Modifier } from "../../domain/catalog/modifier";
import type { CombatEvent, PeriodicTickEvent } from "../loop/combat-event";
import type { CombatState } from "../loop/combat-state";
import { createEventQueue, type EventQueue } from "../loop/event-queue";
import type { Combatant } from "../stats/combatant";
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
