import { test, expect } from "bun:test";
import { applyEffects } from "./apply-effects";
import { NO_SPELL_ID, type SpellEffect } from "./contract";
import { createEventQueue } from "../loop/event-queue";
import type { CombatState } from "../loop/combat-state";
import type { Combatant } from "../stats/combatant";
import type { CombatantId } from "../stats/combatant-id";
import type { ResolvedStats } from "../stats/resolved-stats";
import { addTicks, secondsToTicks, type Ticks } from "../loop/time";

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

const magicHit = (base: number): SpellEffect => ({
  recipient: "opponent",
  modifier: {
    kind: "damage",
    damageType: "magic",
    amount: { base, sources: ["abilityPower"] },
    temporality: { kind: "instant" },
  },
});

const NOW = 500 as Ticks;

test("a damage effect lands the exact mitigated amount and credits the caster", () => {
  const caster = makeCombatant("attacker");
  const opponent = makeCombatant("target", { magicResist: 25 });
  const state = makeState(caster, opponent);

  const signal = applyEffects(
    [magicHit(230)],
    caster,
    opponent,
    state,
    createEventQueue(),
    NOW,
  );

  expect(signal).toBeUndefined();
  expect(opponent.currentHp).toBe(816);
  expect(state.damageDealtBy[caster.id]).toBe(184);
  expect(state.damageDealtBy[opponent.id]).toBe(0);
});

test("the cast reads the effective view: raised ability power moves the damage", () => {
  const caster = makeCombatant("attacker", { abilityPower: 1.25 });
  const opponent = makeCombatant("target", { magicResist: 25 });
  const state = makeState(caster, opponent);

  applyEffects(
    [magicHit(230)],
    caster,
    opponent,
    state,
    createEventQueue(),
    NOW,
  );

  expect(state.damageDealtBy[caster.id]).toBe(230);
});

test("a spell never crits, whatever the caster's crit stats", () => {
  const caster = makeCombatant("attacker", { critChance: 1, critDamage: 0.4 });
  const opponent = makeCombatant("target", { magicResist: 25 });
  const state = makeState(caster, opponent);

  applyEffects(
    [magicHit(230)],
    caster,
    opponent,
    state,
    createEventQueue(),
    NOW,
  );

  expect(state.damageDealtBy[caster.id]).toBe(184);
});

test("a killing effect signals the cast's instant and nothing after it is observable", () => {
  const caster = makeCombatant("attacker");
  const opponent = makeCombatant(
    "target",
    { magicResist: 25 },
    { currentHp: 150 },
  );
  const state = makeState(caster, opponent);
  const queue = createEventQueue();

  const signal = applyEffects(
    [magicHit(230), magicHit(230)],
    caster,
    opponent,
    state,
    queue,
    NOW,
  );

  expect(signal).toEqual({ time: NOW });
  expect(state.damageDealtBy[caster.id]).toBe(184);
  expect(queue.popNext()).toBeUndefined();
});

test("a lethal hit grants no post-mortem mana", () => {
  const caster = makeCombatant("attacker");
  const opponent = makeCombatant(
    "target",
    {
      magicResist: 25,
      manaGeneration: {
        perAttack: 5,
        perSecond: 0,
        gainsFromDamageTaken: true,
      },
    },
    { currentHp: 100 },
  );
  const state = makeState(caster, opponent);
  const queue = createEventQueue();

  applyEffects([magicHit(230)], caster, opponent, state, queue, NOW);

  expect(opponent.currentMana).toBe(0);
  expect(queue.popNext()).toBeUndefined();
});

test("effects deliver in the returned order, each through the full pipeline", () => {
  const caster = makeCombatant("attacker");
  const opponent = makeCombatant("target");
  const state = makeState(caster, opponent);

  applyEffects(
    [magicHit(100), magicHit(200)],
    caster,
    opponent,
    state,
    createEventQueue(),
    NOW,
  );

  expect(opponent.currentHp).toBe(700);
  expect(state.damageDealtBy[caster.id]).toBe(300);
});

test("a hit victim converts the exchange into mana and can cast in response", () => {
  const caster = makeCombatant("attacker");
  const opponent = makeCombatant(
    "target",
    {
      magicResist: 25,
      manaGeneration: {
        perAttack: 5,
        perSecond: 0,
        gainsFromDamageTaken: true,
      },
    },
    { currentMana: 95 },
  );
  const state = makeState(caster, opponent);
  const queue = createEventQueue();

  applyEffects([magicHit(230)], caster, opponent, state, queue, NOW);

  expect(opponent.currentMana).toBeCloseTo(102.82);
  const next = queue.popNext();
  expect(next?.kind).toBe("cast");
  if (next?.kind === "cast") {
    expect(next.caster).toBe(opponent.id);
    expect(next.time).toBe(NOW);
  }
});

test("a self-targeted effect lands on the caster", () => {
  const caster = makeCombatant("attacker");
  const opponent = makeCombatant("target");
  const state = makeState(caster, opponent);

  applyEffects(
    [
      {
        recipient: "self",
        modifier: {
          kind: "damage",
          damageType: "true",
          amount: { base: 50 },
          temporality: { kind: "instant" },
        },
      },
    ],
    caster,
    opponent,
    state,
    createEventQueue(),
    NOW,
  );

  expect(caster.currentHp).toBe(950);
  expect(opponent.currentHp).toBe(1000);
});

test("a crowd-control effect lands on its recipient and schedules its expiry", () => {
  const caster = makeCombatant("attacker");
  const opponent = makeCombatant("target");
  const state = makeState(caster, opponent);
  const queue = createEventQueue();

  applyEffects(
    [
      {
        recipient: "opponent",
        modifier: {
          kind: "crowd-control",
          cc: "stun",
          temporality: { kind: "duration", seconds: 1.5 },
        },
      },
    ],
    caster,
    opponent,
    state,
    queue,
    NOW,
  );

  expect(opponent.activeCrowdControl).toEqual([
    { cc: "stun", blockedThrough: 2000 as Ticks },
  ]);
  const scheduled = queue.popNext();
  expect(scheduled?.kind).toBe("crowd-control-expiry");
  expect(scheduled?.time).toBe(2001 as Ticks);
});

test("non-instant damage is a loud spell-author bug, never a silent skip", () => {
  const caster = makeCombatant("attacker");
  const opponent = makeCombatant("target");
  const state = makeState(caster, opponent);

  const overTime: SpellEffect = {
    recipient: "opponent",
    modifier: {
      kind: "damage",
      damageType: "magic",
      amount: { base: 100 },
      temporality: { kind: "duration", seconds: 3 },
    },
  };

  expect(() =>
    applyEffects([overTime], caster, opponent, state, createEventQueue(), NOW),
  ).toThrow();
});

test("a duration-less crowd-control effect is a loud spell-author bug", () => {
  const caster = makeCombatant("attacker");
  const opponent = makeCombatant("target");
  const state = makeState(caster, opponent);

  const instantStun: SpellEffect = {
    recipient: "opponent",
    modifier: {
      kind: "crowd-control",
      cc: "stun",
      temporality: { kind: "instant" },
    },
  };

  expect(() =>
    applyEffects(
      [instantStun],
      caster,
      opponent,
      state,
      createEventQueue(),
      NOW,
    ),
  ).toThrow();
});

test("a per-star table reaching delivery is a loud spell-author bug", () => {
  const caster = makeCombatant("attacker");
  const opponent = makeCombatant("target");
  const state = makeState(caster, opponent);

  const unresolved: SpellEffect = {
    recipient: "opponent",
    modifier: {
      kind: "damage",
      damageType: "magic",
      amount: { base: { 1: 230, 2: 345, 3: 520 } },
      temporality: { kind: "instant" },
    },
  };

  expect(() =>
    applyEffects(
      [unresolved],
      caster,
      opponent,
      state,
      createEventQueue(),
      NOW,
    ),
  ).toThrow();
});

const instantShield = (
  base: number,
  sources?: ["abilityPower"],
): SpellEffect => ({
  recipient: "self",
  modifier: {
    kind: "shield",
    amount: sources === undefined ? { base } : { base, sources },
    temporality: { kind: "instant" },
  },
});

test("an instant shield delivers a permanent-for-combat pool on its recipient", () => {
  const caster = makeCombatant("attacker");
  const opponent = makeCombatant("target");
  const state = makeState(caster, opponent);

  applyEffects(
    [instantShield(250)],
    caster,
    opponent,
    state,
    createEventQueue(),
    NOW,
  );

  expect(caster.shields).toHaveLength(1);
  expect(caster.shields[0].remaining).toBe(250);
});

test("a shield scales on the caster's effective stats at cast (D4)", () => {
  const caster = makeCombatant("attacker", { abilityPower: 2 });
  const opponent = makeCombatant("target");
  const state = makeState(caster, opponent);

  applyEffects(
    [instantShield(100, ["abilityPower"])],
    caster,
    opponent,
    state,
    createEventQueue(),
    NOW,
  );

  expect(caster.shields[0].remaining).toBe(200);
});

test("a timed shield delivers a pool and schedules its expiry (D7)", () => {
  const caster = makeCombatant("attacker");
  const opponent = makeCombatant("target");
  const state = makeState(caster, opponent);
  const queue = createEventQueue();

  const timed: SpellEffect = {
    recipient: "self",
    modifier: {
      kind: "shield",
      amount: { base: 100 },
      temporality: { kind: "duration", seconds: 4 },
    },
  };

  applyEffects([timed], caster, opponent, state, queue, NOW);

  expect(caster.shields).toHaveLength(1);
  expect(caster.shields[0].remaining).toBe(100);
  expect(queue.popNext()).toEqual({
    kind: "shield-expiry",
    time: addTicks(NOW, secondsToTicks(4)),
    combatant: caster.id,
  });
});

test("a damage-reduction effect folds into the recipient's reduction lane (D1)", () => {
  const caster = makeCombatant("attacker");
  const opponent = makeCombatant("target");
  const state = makeState(caster, opponent);

  const reduction: SpellEffect = {
    recipient: "self",
    modifier: {
      kind: "damage-reduction",
      amount: { base: 0.25 },
      temporality: { kind: "instant" },
    },
  };

  applyEffects([reduction], caster, opponent, state, createEventQueue(), NOW);

  expect(caster.damageReductions).toEqual([0.25]);
});

test("a mana-generation effect folds into the recipient's trigger bucket (D1)", () => {
  const caster = makeCombatant("attacker");
  const opponent = makeCombatant("target");
  const state = makeState(caster, opponent);

  const gain: SpellEffect = {
    recipient: "self",
    modifier: {
      kind: "mana-generation",
      trigger: "on-attack",
      amount: { base: 5 },
      temporality: { kind: "instant" },
    },
  };

  applyEffects([gain], caster, opponent, state, createEventQueue(), NOW);

  expect(caster.manaGains["on-attack"]).toBe(5);
});

test("a per-second mana buff starts the recipient's regen chain mid-run (D1)", () => {
  const caster = makeCombatant("attacker");
  const opponent = makeCombatant("target");
  const state = makeState(caster, opponent);
  const queue = createEventQueue();

  const perSecond: SpellEffect = {
    recipient: "self",
    modifier: {
      kind: "mana-generation",
      trigger: "per-second",
      amount: { base: 4 },
      temporality: { kind: "duration", seconds: 8 },
    },
  };

  applyEffects([perSecond], caster, opponent, state, queue, NOW);

  expect(caster.manaGains["per-second"]).toBe(4);
  const kinds = [queue.popNext()?.kind, queue.popNext()?.kind].sort();
  expect(kinds).toEqual(["mana-regen", "modifier-expiry"]);
});

test("a duration stat-mod is delivered to its recipient: folded now, expiry scheduled", () => {
  const caster = makeCombatant("attacker");
  const opponent = makeCombatant("target");
  const state = makeState(caster, opponent);
  const queue = createEventQueue();
  const base = caster.stats.attackDamage;

  const buff: SpellEffect = {
    recipient: "self",
    modifier: {
      kind: "stat-mod",
      target: "attackDamage",
      amount: { base: 40 },
      temporality: { kind: "duration", seconds: 4 },
    },
  };

  applyEffects([buff], caster, opponent, state, queue, NOW);

  expect(caster.stats.attackDamage).toBe(base + 40);
  expect(caster.timedModifiers).toHaveLength(1);
  expect(queue.popNext()).toEqual({
    kind: "modifier-expiry",
    time: addTicks(NOW, secondsToTicks(4)),
    combatant: caster.id,
  });
});

test("a scaled buff banks the caster's effective stat at cast, not the recipient's", () => {
  const caster = makeCombatant("attacker", {
    abilityPower: 3,
    attackDamage: 100,
  });
  const opponent = makeCombatant("target");
  const state = makeState(caster, opponent);

  const scaledBuff: SpellEffect = {
    recipient: "self",
    modifier: {
      kind: "stat-mod",
      target: "attackDamage",
      amount: { base: 10, sources: ["abilityPower"] },
      temporality: { kind: "duration", seconds: 4 },
    },
  };

  applyEffects([scaledBuff], caster, opponent, state, createEventQueue(), NOW);

  expect(caster.stats.attackDamage).toBe(130);
});

test("a debuff scaled on the caster never borrows the victim's stats", () => {
  const caster = makeCombatant("attacker", { abilityPower: 3 });
  const opponent = makeCombatant("target", { abilityPower: 1, armor: 100 });
  const state = makeState(caster, opponent);

  const shred: SpellEffect = {
    recipient: "opponent",
    modifier: {
      kind: "stat-mod",
      target: "armor",
      amount: { base: -10, sources: ["abilityPower"] },
      temporality: { kind: "duration", seconds: 4 },
    },
  };

  applyEffects([shred], caster, opponent, state, createEventQueue(), NOW);

  expect(opponent.stats.armor).toBe(70);
});

test("an instant stat-mod folds as a permanent-for-combat buff, scheduling no expiry", () => {
  const caster = makeCombatant("attacker");
  const opponent = makeCombatant("target");
  const state = makeState(caster, opponent);
  const queue = createEventQueue();
  const base = caster.stats.attackDamage;

  const permanentBuff: SpellEffect = {
    recipient: "self",
    modifier: {
      kind: "stat-mod",
      target: "attackDamage",
      amount: { base: 40 },
      temporality: { kind: "instant" },
    },
  };

  applyEffects([permanentBuff], caster, opponent, state, queue, NOW);

  expect(caster.stats.attackDamage).toBe(base + 40);
  expect(caster.timedModifiers).toHaveLength(1);
  expect(queue.popNext()).toBeUndefined();
});

const hpBuff = (base: number, seconds: number): SpellEffect => ({
  recipient: "self",
  modifier: {
    kind: "stat-mod",
    target: "hp",
    amount: { base },
    temporality: { kind: "duration", seconds },
  },
});

test("a timed hp stat-mod raises max HP and carries current HP up by the same delta (D3)", () => {
  const caster = makeCombatant("attacker");
  const opponent = makeCombatant("target");
  const state = makeState(caster, opponent);

  applyEffects(
    [hpBuff(200, 4)],
    caster,
    opponent,
    state,
    createEventQueue(),
    NOW,
  );

  expect(caster.stats.hp).toBe(1200);
  expect(caster.currentHp).toBe(1200);
});

test("an hp buff on a damaged combatant adds the full delta to current HP, not a ratio", () => {
  const caster = makeCombatant("attacker", {}, { currentHp: 600 });
  const opponent = makeCombatant("target");
  const state = makeState(caster, opponent);

  applyEffects(
    [hpBuff(200, 4)],
    caster,
    opponent,
    state,
    createEventQueue(),
    NOW,
  );

  expect(caster.stats.hp).toBe(1200);
  expect(caster.currentHp).toBe(800);
});

const instantHeal = (
  base: number,
  sources?: ["abilityPower"],
): SpellEffect => ({
  recipient: "self",
  modifier: {
    kind: "heal",
    amount: sources === undefined ? { base } : { base, sources },
    temporality: { kind: "instant" },
  },
});

test("a heal restores HP up to the effective max, and the surplus is lost", () => {
  const caster = makeCombatant("attacker", {}, { currentHp: 700 });
  const opponent = makeCombatant("target");
  const state = makeState(caster, opponent);

  applyEffects(
    [instantHeal(500)],
    caster,
    opponent,
    state,
    createEventQueue(),
    NOW,
  );

  expect(caster.currentHp).toBe(1000);
});

test("a heal scales on the caster's effective stats at cast (D4)", () => {
  const caster = makeCombatant(
    "attacker",
    { abilityPower: 2 },
    { currentHp: 100 },
  );
  const opponent = makeCombatant("target");
  const state = makeState(caster, opponent);

  applyEffects(
    [instantHeal(100, ["abilityPower"])],
    caster,
    opponent,
    state,
    createEventQueue(),
    NOW,
  );

  expect(caster.currentHp).toBe(300);
});

test("a duration heal is a loud spell-author bug: healing over time is periodic", () => {
  const caster = makeCombatant("attacker");
  const opponent = makeCombatant("target");
  const state = makeState(caster, opponent);

  const hot: SpellEffect = {
    recipient: "self",
    modifier: {
      kind: "heal",
      amount: { base: 100 },
      temporality: { kind: "duration", seconds: 3 },
    },
  };

  expect(() =>
    applyEffects([hot], caster, opponent, state, createEventQueue(), NOW),
  ).toThrow();
});

test("a periodic effect expands into scheduled ticks instead of resolving now", () => {
  const caster = makeCombatant("attacker");
  const opponent = makeCombatant("target");
  const state = makeState(caster, opponent);
  const queue = createEventQueue();

  const burn: SpellEffect = {
    recipient: "opponent",
    modifier: {
      kind: "damage",
      damageType: "magic",
      amount: { base: 60 },
      temporality: {
        kind: "periodic",
        seconds: 3,
        interval: 1,
        mode: "instance",
      },
    },
  };

  const signal = applyEffects([burn], caster, opponent, state, queue, NOW);

  expect(signal).toBeUndefined();
  expect(opponent.currentHp).toBe(1000);
  expect(state.damageDealtBy[caster.id]).toBe(0);
  const kinds = [queue.popNext(), queue.popNext(), queue.popNext()].map(
    (e) => e?.kind,
  );
  expect(kinds).toEqual(["periodic-tick", "periodic-tick", "periodic-tick"]);
  expect(queue.popNext()).toBeUndefined();
});

test("a periodic crowd-control is rejected loudly at scheduling", () => {
  const caster = makeCombatant("attacker");
  const opponent = makeCombatant("target");
  const state = makeState(caster, opponent);

  const recurringStun: SpellEffect = {
    recipient: "opponent",
    modifier: {
      kind: "crowd-control",
      cc: "stun",
      temporality: {
        kind: "periodic",
        seconds: 9,
        interval: 3,
        mode: "instance",
      },
    },
  };

  expect(() =>
    applyEffects(
      [recurringStun],
      caster,
      opponent,
      state,
      createEventQueue(),
      NOW,
    ),
  ).toThrow();
});

test("a composed hp buff then heal fills up to the raised max, not the base max (D3 + D5)", () => {
  const caster = makeCombatant("attacker", {}, { currentHp: 500 });
  const opponent = makeCombatant("target");
  const state = makeState(caster, opponent);

  applyEffects(
    [hpBuff(300, 4), instantHeal(500)],
    caster,
    opponent,
    state,
    createEventQueue(),
    NOW,
  );

  expect(caster.stats.hp).toBe(1300);
  expect(caster.currentHp).toBe(1300);
});
