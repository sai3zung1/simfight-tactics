import { test, expect } from "bun:test";
import {
  processCast,
  processManaRegen,
  pushCastIfReady,
  shouldScheduleManaRegen,
} from "./casting";
import { createEventQueue } from "../loop/event-queue";
import { NO_SPELL_ID } from "../spell/contract";
import type { CombatState } from "../loop/combat-state";
import type { Combatant } from "../stats/combatant";
import type { CombatantId } from "../stats/combatant-id";
import type { ResolvedStats } from "../stats/resolved-stats";
import type { CastEvent, ManaRegenEvent } from "../loop/combat-event";
import type { SpellId } from "../../domain/primitives";
import type {
  ResolvedSpellParameters,
  SpellContext,
  SpellRegistry,
} from "../spell/contract";
import type { Ticks } from "../loop/time";

const makeCombatant = (
  id: string,
  stats: Partial<ResolvedStats> = {},
  overrides: Partial<Combatant> = {},
): Combatant => ({
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
  stats: {
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
  },
  ...overrides,
});

const CASTER_GENERATION = {
  perAttack: 7,
  perSecond: 2,
  gainsFromDamageTaken: false,
};

const makeState = (attacker: Combatant, target: Combatant): CombatState => ({
  attacker,
  target,
  damageDealtBy: { [attacker.id]: 0, [target.id]: 0 },
  castsBy: { [attacker.id]: 0, [target.id]: 0 },
});

const regenTick = (combatant: Combatant, time: number): ManaRegenEvent => ({
  kind: "mana-regen",
  time: time as Ticks,
  combatant: combatant.id,
});

const cast = (caster: Combatant, time: number): CastEvent => ({
  kind: "cast",
  time: time as Ticks,
  caster: caster.id,
});

test("only units whose ticking can pay out join the regen schedule", () => {
  expect(shouldScheduleManaRegen(makeCombatant("a"))).toBe(false);
  expect(
    shouldScheduleManaRegen(
      makeCombatant("a", { manaGeneration: CASTER_GENERATION }),
    ),
  ).toBe(true);
  const noBarWithBonus = makeCombatant(
    "a",
    { mana: { min: 0, start: 0, max: 0 } },
    {
      manaGains: {
        "on-attack": 0,
        "per-second": 1,
        "post-cast": 0,
        "on-damage-taken": 0,
      },
    },
  );
  expect(shouldScheduleManaRegen(noBarWithBonus)).toBe(false);
});

test("a regen tick pays one interval's worth and reschedules itself", () => {
  const caster = makeCombatant("attacker", {
    manaGeneration: CASTER_GENERATION,
  });
  const state = makeState(caster, makeCombatant("target"));
  const queue = createEventQueue();

  processManaRegen(regenTick(caster, 1000), state, queue);

  expect(caster.currentMana).toBe(2);
  const next = queue.popNext();
  expect(next?.kind).toBe("mana-regen");
  expect(next?.time).toBe(2000 as Ticks);
});

test("a regen tick that fills the gauge emits a same-tick cast", () => {
  const caster = makeCombatant(
    "attacker",
    { manaGeneration: CASTER_GENERATION },
    { currentMana: 98 },
  );
  const state = makeState(caster, makeCombatant("target"));
  const queue = createEventQueue();

  processManaRegen(regenTick(caster, 1000), state, queue);

  const first = queue.popNext();
  expect(first?.kind).toBe("cast");
  expect(first?.time).toBe(1000 as Ticks);
});

test("a stunned combatant's full gauge does not get a cast pushed", () => {
  const c = makeCombatant(
    "attacker",
    {},
    {
      currentMana: 100,
      activeCrowdControl: [{ cc: "stun", blockedThrough: 1000 as Ticks }],
    },
  );
  const queue = createEventQueue();

  pushCastIfReady(c, 500 as Ticks, queue);

  expect(queue.popNext()).toBeUndefined();
});

test("a silenced combatant's full gauge does not get a cast pushed", () => {
  const c = makeCombatant(
    "attacker",
    {},
    {
      currentMana: 100,
      activeCrowdControl: [{ cc: "silence", blockedThrough: 1000 as Ticks }],
    },
  );
  const queue = createEventQueue();

  pushCastIfReady(c, 500 as Ticks, queue);

  expect(queue.popNext()).toBeUndefined();
});

test("a disarmed combatant's full gauge still casts normally", () => {
  const c = makeCombatant(
    "attacker",
    {},
    {
      currentMana: 100,
      activeCrowdControl: [{ cc: "disarm", blockedThrough: 1000 as Ticks }],
    },
  );
  const queue = createEventQueue();

  pushCastIfReady(c, 500 as Ticks, queue);

  expect(queue.popNext()?.kind).toBe("cast");
});

test("a stunned combatant still perceives mana normally — only its own attack and cast are gated", () => {
  const caster = makeCombatant(
    "attacker",
    { manaGeneration: CASTER_GENERATION },
    { activeCrowdControl: [{ cc: "stun", blockedThrough: 5000 as Ticks }] },
  );
  const state = makeState(caster, makeCombatant("target"));
  const queue = createEventQueue();

  processManaRegen(regenTick(caster, 1000), state, queue);

  expect(caster.currentMana).toBe(2);
});

test("a cast credits its caster and spends the gauge", () => {
  const attacker = makeCombatant("attacker", {}, { currentMana: 120 });
  const state = makeState(attacker, makeCombatant("target"));

  processCast(cast(attacker, 500), state);

  expect(state.castsBy[attacker.id]).toBe(1);
  expect(state.castsBy[state.target.id]).toBe(0);
  // Pins the measured post-cast bar state: excess lost, restart at exactly
  // zero (docs/data/calibration-log.md, A1).
  expect(attacker.currentMana).toBe(0);
});

test("a cast credits only its caster, never the other combatant", () => {
  const target = makeCombatant("target", {}, { currentMana: 100 });
  const state = makeState(makeCombatant("attacker"), target);

  processCast(cast(target, 0), state);

  expect(state.castsBy[target.id]).toBe(1);
  expect(state.castsBy[state.attacker.id]).toBe(0);
});

test("post-cast bonuses set the gauge's landing value", () => {
  const attacker = makeCombatant(
    "attacker",
    {},
    {
      currentMana: 100,
      manaGains: {
        "on-attack": 0,
        "per-second": 0,
        "post-cast": 10,
        "on-damage-taken": 0,
      },
    },
  );
  const state = makeState(attacker, makeCombatant("target"));

  processCast(cast(attacker, 500), state);

  expect(attacker.currentMana).toBe(10);
});

test("a cast event finding an already-spent gauge is dropped", () => {
  const attacker = makeCombatant("attacker", {}, { currentMana: 50 });
  const state = makeState(attacker, makeCombatant("target"));

  processCast(cast(attacker, 500), state);

  expect(state.castsBy[attacker.id]).toBe(0);
  expect(attacker.currentMana).toBe(50);
});

test("dispatches the registered spell with a read-only view and resolved params", () => {
  let seen: { ctx: SpellContext; params: ResolvedSpellParameters } | undefined;
  const spellId = "fixture" as SpellId;
  const registry: SpellRegistry = {
    [spellId]: (ctx, params) => {
      seen = { ctx, params };
      return [];
    },
  };
  const attacker = makeCombatant(
    "attacker",
    { attackDamage: 120 },
    { currentMana: 100, spellId, spellParameters: { base: 42 } },
  );
  const target = makeCombatant("target", {}, { currentHp: 300 });
  const state = makeState(attacker, target);

  processCast(cast(attacker, 500), state, registry);

  expect(seen?.ctx.caster.stats.attackDamage).toBe(120);
  expect(seen?.ctx.opponent.hp.current).toBe(300);
  expect(seen?.ctx.opponent.hp.max).toBe(1000);
  expect(seen?.params.base).toBe(42);
});

test("a cast whose spell is not registered is a no-op — counted, gauge spent, nothing applied", () => {
  const attacker = makeCombatant(
    "attacker",
    {},
    { currentMana: 100, spellId: "unregistered" as SpellId },
  );
  const target = makeCombatant("target", {}, { currentHp: 300 });
  const state = makeState(attacker, target);

  // Empty registry (the default): the miss is the steady state, never an error.
  processCast(cast(attacker, 500), state);

  expect(state.castsBy[attacker.id]).toBe(1);
  expect(attacker.currentMana).toBe(0);
  expect(target.currentHp).toBe(300);
});

test("produces effects but applies none — resolution is #69, so the opponent's HP is untouched", () => {
  const spellId = "burst" as SpellId;
  const registry: SpellRegistry = {
    [spellId]: () => [
      {
        recipient: "opponent",
        modifier: {
          kind: "damage",
          damageType: "magic",
          amount: { base: 500 },
          temporality: { kind: "instant" },
        },
      },
    ],
  };
  const attacker = makeCombatant("attacker", {}, { currentMana: 100, spellId });
  const target = makeCombatant("target", {}, { currentHp: 300 });
  const state = makeState(attacker, target);

  processCast(cast(attacker, 500), state, registry);

  expect(state.castsBy[attacker.id]).toBe(1);
  expect(target.currentHp).toBe(300);
});
