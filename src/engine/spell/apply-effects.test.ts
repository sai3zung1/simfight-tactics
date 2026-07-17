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

  // 230 × ability power 1, then 100/(100+25) mitigation → 184 dealt.
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

  // 230 × 1.25 = 287.5 pre-mitigation, × 0.8 → 230 dealt.
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

  // A guaranteed-crit auto-attack would land ×1.4; the spell stays nominal.
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
  // Only the killing hit is tallied: the second effect never resolves.
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

  // No resist: both land whole.
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

  // 1% × 230 pre-mitigation + 3% × 184 dealt = 7.82 → the gauge crosses 100.
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

test("kinds without a delivery yet are deliberate no-ops", () => {
  const caster = makeCombatant("attacker");
  const opponent = makeCombatant("target");
  const state = makeState(caster, opponent);
  const queue = createEventQueue();

  const inert: readonly SpellEffect[] = [
    {
      recipient: "self",
      modifier: {
        kind: "shield",
        amount: { base: 100 },
        temporality: { kind: "duration", seconds: 4 },
      },
    },
    {
      recipient: "self",
      modifier: {
        kind: "damage-reduction",
        amount: { base: 0.2 },
        temporality: { kind: "instant" },
      },
    },
    {
      recipient: "self",
      modifier: {
        kind: "mana-generation",
        trigger: "post-cast",
        amount: { base: 10 },
        temporality: { kind: "instant" },
      },
    },
  ];

  const signal = applyEffects(inert, caster, opponent, state, queue, NOW);

  expect(signal).toBeUndefined();
  expect(caster.currentHp).toBe(1000);
  expect(opponent.currentHp).toBe(1000);
  expect(queue.popNext()).toBeUndefined();
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
  // Caster holds 3 ability power; the buff scales on it. Snapshotted at cast,
  // the fold reads that banked value rather than re-deriving it from whoever
  // ends up holding the entry.
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

  // 10 × caster ability power 3 = 30 folded onto the base 100.
  expect(caster.stats.attackDamage).toBe(130);
});

test("a debuff scaled on the caster never borrows the victim's stats", () => {
  // The shred lands on the opponent but scales on the CASTER's ability power.
  // Resolving it against the victim (1 AP) instead of the caster (3 AP) is the
  // exact bug the cast-time snapshot rules out (D4).
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

  // -10 × caster AP 3 = -30 → armor 100 - 30 = 70 (not 90, the victim-basis bug).
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
  // Permanent for combat: nothing infinite is scheduled onto the queue.
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
  const caster = makeCombatant("attacker"); // max 1000, current 1000
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
  const caster = makeCombatant("attacker", {}, { currentHp: 600 }); // max 1000
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
  // Engine lineage (D3/A): the delta is granted whole — 600 + 200, not 720.
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

  // 700 + 500 = 1200, capped at the 1000 max — the 200 surplus is lost.
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

  // 100 × caster ability power 2 = 200 healed → 100 + 200 = 300.
  expect(caster.currentHp).toBe(300);
});

test("heal-over-time is a loud spell-author bug until #72", () => {
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

test("a composed hp buff then heal fills up to the raised max, not the base max (D3 + D5)", () => {
  const caster = makeCombatant("attacker", {}, { currentHp: 500 }); // max 1000
  const opponent = makeCombatant("target");
  const state = makeState(caster, opponent);

  // One cast, two effects in reading order: raise max HP by 300 (current rides
  // to 800), then heal 500 — capped at the new 1300 max, not the 1000 base.
  applyEffects(
    [hpBuff(300, 4), instantHeal(500)],
    caster,
    opponent,
    state,
    createEventQueue(),
    NOW,
  );

  expect(caster.stats.hp).toBe(1300);
  // 800 + 500 = 1300, the raised ceiling; without the buff it would stop at 1000.
  expect(caster.currentHp).toBe(1300);
});
