import { test, expect } from "bun:test";
import {
  processCast,
  processManaRegen,
  shouldScheduleManaRegen,
} from "./casting";
import { createEventQueue } from "../loop/event-queue";
import type { CombatState } from "../loop/combat-state";
import type { Combatant } from "../stats/combatant";
import type { CombatantId } from "../stats/combatant-id";
import type { ResolvedStats } from "../stats/resolved-stats";
import type { CastEvent, ManaRegenEvent } from "../loop/combat-event";
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
  manaLockedUntil: 0 as Ticks,
  damageReductions: [],
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

test("a regen tick during the lock pays nothing but keeps ticking", () => {
  const caster = makeCombatant(
    "attacker",
    { manaGeneration: CASTER_GENERATION },
    { manaLockedUntil: 5000 as Ticks },
  );
  const state = makeState(caster, makeCombatant("target"));
  const queue = createEventQueue();

  processManaRegen(regenTick(caster, 1000), state, queue);

  expect(caster.currentMana).toBe(0);
  expect(queue.popNext()?.kind).toBe("mana-regen");
});

test("a cast credits its caster, spends the gauge and starts the lock", () => {
  const attacker = makeCombatant("attacker", {}, { currentMana: 120 });
  const state = makeState(attacker, makeCombatant("target"));

  processCast(cast(attacker, 500), state);

  expect(state.castsBy[attacker.id]).toBe(1);
  expect(state.castsBy[state.target.id]).toBe(0);
  // Excess above the threshold is lost (no overflow carry, #51).
  expect(attacker.currentMana).toBe(0);
  expect(attacker.manaLockedUntil).toBe(1500 as Ticks);
});

test("a cast credits only its caster, never the other combatant", () => {
  const target = makeCombatant("target", {}, { currentMana: 100 });
  const state = makeState(makeCombatant("attacker"), target);

  processCast(cast(target, 0), state);

  expect(state.castsBy[target.id]).toBe(1);
  expect(state.castsBy[state.attacker.id]).toBe(0);
});

test("post-cast bonuses land despite the fresh lock", () => {
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
  expect(attacker.manaLockedUntil).toBe(0 as Ticks);
});
