import type { BaseStats } from "../../domain/catalog/base-stats";
import type { CrowdControl, Modifier } from "../../domain/catalog/modifier";
import type { SpellId, StarLevel } from "../../domain/primitives";
import type {
  ParameterName,
  SpellParameters,
} from "../../domain/catalog/spell";
import type { Ticks } from "../loop/time";
import type { CombatantId } from "./combatant-id";
import { NO_SPELL_ID, type ResolvedSpellParameters } from "../spell/contract";
import {
  applyModifiers,
  resolveDamageReductions,
  resolveManaGains,
  type EffectiveStats,
  type ManaGains,
} from "./effective-stats";
import {
  resolveScaling,
  resolveStats,
  type ResolvedStats,
} from "./resolved-stats";

/**
 * One active crowd-control effect: which capability it takes away, and the
 * last tick it still does — inclusive, so the combatant is free starting
 * the following tick (#50).
 */
export type CrowdControlEntry = {
  readonly cc: CrowdControl;
  readonly blockedThrough: Ticks;
};

/**
 * One timed modifier currently folded into `stats`: the modifier, and the tick
 * it is removed on. The active window is half-open `[appliedAt, expiresAt)` —
 * the entry is pruned when its `modifier-expiry` fires at `expiresAt`, so the
 * fold no longer carries it from that tick on (#70, D6). Unlike a
 * `CrowdControlEntry` — which stays inert in its list and is read through a
 * live time check — a folded modifier is baked into `stats` and must be
 * physically removed, or it keeps applying.
 */
export type TimedModifierEntry = {
  readonly modifier: Modifier;
  readonly expiresAt: Ticks;
};

/**
 * One shield pool absorbing damage ahead of HP. Unlike the other entries —
 * which stay fixed and only splice — a shield's `remaining` is drawn down in
 * place as hits land, and the pool is dropped once emptied. `expiresAt` is the
 * tick it is pruned on (half-open window, as timed modifiers); `NEVER_EXPIRES`
 * for a permanent-for-combat shield. Pools are additive and independent:
 * several coexist and their remainders sum, never merged (#71, D6).
 */
export type ShieldEntry = {
  remaining: number;
  readonly expiresAt: Ticks;
};

/** Stun and disarm take away the attack. */
export function blocksAttack(cc: CrowdControl): boolean {
  return cc === "stun" || cc === "disarm";
}

/** Stun and silence take away the cast. */
function blocksCast(cc: CrowdControl): boolean {
  return cc === "stun" || cc === "silence";
}

function isBlockedBy(
  entry: CrowdControlEntry,
  now: Ticks,
  blocks: (cc: CrowdControl) => boolean,
): boolean {
  return entry.blockedThrough >= now && blocks(entry.cc);
}

/** Whether `combatant` may auto-attack at `now` — free unless an active entry blocks it. */
export function canAttack(combatant: Combatant, now: Ticks): boolean {
  return !combatant.activeCrowdControl.some((entry) =>
    isBlockedBy(entry, now, blocksAttack),
  );
}

/** Whether `combatant` may cast at `now` — free unless an active entry blocks it. */
export function canCast(combatant: Combatant, now: Ticks): boolean {
  return !combatant.activeCrowdControl.some((entry) =>
    isBlockedBy(entry, now, blocksCast),
  );
}

/**
 * One participant's state while a simulation runs: identity, the stats the
 * loop reads, and the values the fight changes as it plays out.
 */
export type Combatant = {
  readonly id: CombatantId;
  /**
   * The stats the loop reads, folded from `resolvedStats` over the active
   * modifier set; effective-stats.ts owns the how and why. Recomputed in place
   * by `refoldStats` whenever a timed modifier is applied or expires (#70) —
   * reassigned wholesale, never mutated field by field. Crowd control (#50)
   * never touches this fold: it gates actions, not stats.
   */
  stats: EffectiveStats;
  /**
   * The three inputs `refoldStats` needs to rebuild `stats` from scratch: the
   * pre-fold view, the combat-long modifier set (items/traits), and the star
   * level. Kept because a mid-run fold re-runs the same one-pass application as
   * combat setup, over `permanentModifiers` plus the active `timedModifiers`.
   */
  readonly resolvedStats: ResolvedStats;
  readonly permanentModifiers: readonly Modifier[];
  readonly starLevel: StarLevel;
  /**
   * Timed modifiers currently folded into `stats`. Empty until a cast applies
   * one (engine/spell/apply-effects.ts); each entry is pruned when its
   * `modifier-expiry` fires (mechanics/timed-modifiers.ts, #70). The reference
   * is fixed; the entries mutate in place, as with `activeCrowdControl`.
   */
  readonly timedModifiers: TimedModifierEntry[];
  /**
   * Shield pools absorbing damage ahead of HP, oldest-first. Empty until a cast
   * applies one (mechanics/shield.ts); each pool is drawn down by `applyDamage`
   * and dropped when emptied or expired. The reference is fixed; the entries
   * mutate and splice in place, as with `activeCrowdControl` and
   * `timedModifiers`.
   */
  readonly shields: ShieldEntry[];
  /**
   * Damage-reduction amounts kept apart from the `durability` stat: the two
   * shrink damage under different stacking rules (`reductionFactor`). Recomputed
   * in place by `refoldStats` over the active timed set, exactly as `stats` —
   * reassigned wholesale, never edited entry by entry (#71, D1).
   */
  damageReductions: readonly number[];
  /**
   * `mana-generation` modifiers resolved to plain amounts per trigger;
   * mechanics/mana.ts adds them onto each matching gain. Recomputed in place by
   * `refoldStats` over the active timed set, as `stats` (#71, D1).
   */
  manaGains: ManaGains;
  /**
   * The caster's spell, resolved once at setup and read at cast time so the
   * dispatch always sees the current spell. `NO_SPELL_ID` means no modeled
   * spell — a no-op cast. The cast event carries who casts, never which spell.
   */
  readonly spellId: SpellId;
  /**
   * The spell's tuning numbers collapsed to this combatant's star level (fixed
   * for the run), read by the spell function.
   */
  readonly spellParameters: ResolvedSpellParameters;
  /**
   * Whether this combatant's death is possible, resolved once at run setup:
   * the attacker never dies (product rule — a run measures the attacker's
   * build, so only the target's death may end one), the target's mortality
   * follows the stop condition. Mechanics read this through `applyDamage`
   * and never know sides or stop modes.
   */
  readonly canDie: boolean;
  currentHp: number;
  /** Gauge toward the cast threshold (`stats.mana.max`). */
  currentMana: number;
  /**
   * Crowd-control currently affecting this combatant. Empty until a spell
   * applies one (engine/spell/apply-effects.ts) — never resolved from
   * combat-start modifiers, since a cast (the only real producer) can only
   * fire from inside the running loop, never from the combat-start fold
   * (mechanics/crowd-control.ts, #50).
   */
  readonly activeCrowdControl: CrowdControlEntry[];
};

/**
 * Collapse a spell's per-star parameters to the caster's star level, once. The
 * spell function reads plain numbers and never a star level — the star is fixed
 * for the run, so nothing recomputes these mid-cast.
 */
function resolveParametersToStar(
  parameters: SpellParameters,
  starLevel: StarLevel,
): ResolvedSpellParameters {
  const resolved: Record<ParameterName, number> = {};
  for (const [name, value] of Object.entries(parameters)) {
    resolved[name] =
      typeof value === "number" ? value : resolveScaling(value, starLevel);
  }
  return resolved;
}

/**
 * Build a combatant's starting state: stats resolved and modifiers applied, full
 * HP, mana at its starting value, spell parameters collapsed to its star level.
 */
export function resolveCombatant(
  stats: BaseStats,
  starLevel: StarLevel,
  id: CombatantId,
  modifiers: readonly Modifier[],
  canDie: boolean,
  spellId: SpellId = NO_SPELL_ID,
  spellParameters: SpellParameters = {},
): Combatant {
  const resolved = resolveStats(stats, starLevel);
  const effective = applyModifiers(resolved, modifiers, starLevel);
  return {
    id,
    stats: effective,
    resolvedStats: resolved,
    permanentModifiers: modifiers,
    starLevel,
    timedModifiers: [],
    shields: [],
    damageReductions: resolveDamageReductions(modifiers, starLevel, resolved),
    manaGains: resolveManaGains(modifiers, starLevel, resolved),
    canDie,
    currentHp: effective.hp,
    currentMana: effective.mana.start,
    spellId,
    spellParameters: resolveParametersToStar(spellParameters, starLevel),
    activeCrowdControl: [],
  };
}

/**
 * Rebuild every derived view from the pre-fold base over the active modifier
 * set — the same one-pass resolution as combat setup, re-run over
 * `permanentModifiers` plus the currently-active `timedModifiers`. Called
 * whenever that timed set changes (apply or expiry, #70). Recomputes all three
 * views a modifier can move — `stats`, `damageReductions`, `manaGains` — so a
 * timed reduction or mana-generation bonus takes effect and lapses exactly as a
 * stat buff does (#71, D1); anything a modifier touches is recomputable, never
 * frozen at setup. Each is reassigned wholesale: consumers read them live per
 * event, so the next event sees the new values with no further plumbing. When
 * the fold moves max HP (a timed `hp` stat-mod), current HP is reconciled with
 * it (`reconcileCurrentHp`, D3).
 */
export function refoldStats(combatant: Combatant): void {
  const previousMaxHp = combatant.stats.hp;
  const activeModifiers = [
    ...combatant.permanentModifiers,
    ...combatant.timedModifiers.map((entry) => entry.modifier),
  ];
  combatant.stats = applyModifiers(
    combatant.resolvedStats,
    activeModifiers,
    combatant.starLevel,
  );
  combatant.damageReductions = resolveDamageReductions(
    activeModifiers,
    combatant.starLevel,
    combatant.resolvedStats,
  );
  combatant.manaGains = resolveManaGains(
    activeModifiers,
    combatant.starLevel,
    combatant.resolvedStats,
  );
  reconcileCurrentHp(combatant, previousMaxHp);
}

/**
 * Keep current HP consistent when a refold moves max HP — a timed `hp` stat-mod
 * applying or expiring (D3). A rise carries current HP up by the same delta:
 * gaining max HP grants that HP outright, the shared League/TFT engine rule
 * (level-ups, items). A fall clamps current HP under the new max, never below 1:
 * an expiry is not damage, and only damage kills (`applyDamage` stays the sole
 * point of death). A refold that leaves max HP unchanged — every non-`hp`
 * stat-mod, and every plain fold — touches nothing, since the delta is zero.
 */
function reconcileCurrentHp(combatant: Combatant, previousMaxHp: number): void {
  const delta = combatant.stats.hp - previousMaxHp;
  if (delta > 0) {
    combatant.currentHp += delta;
  } else if (delta < 0) {
    combatant.currentHp = Math.max(
      1,
      Math.min(combatant.currentHp, combatant.stats.hp),
    );
  }
}

/**
 * HP floor for a combatant that cannot die: still alive by definition, and
 * a legal reading for anything that inspects an opponent's HP (the
 * threshold/execute spell patterns of the cast contract). The exact floor
 * value is a product choice, revisited only if a survivability metric ever
 * needs it.
 */
const IMMORTAL_HP_FLOOR = 1;

/**
 * Draw incoming `amount` down against the combatant's shield pools, oldest-first
 * (FIFO), and return the damage left for HP — what continues in the same hit
 * once the shields are spent (#71, D6). Each pool's `remaining` is decremented
 * in place; pools the hit empties are pruned back-to-front, the same splice
 * shape as the other in-place prunes. A fully-absorbed hit returns 0; with no
 * shields, the amount passes through untouched.
 */
export function absorbWithShields(
  combatant: Combatant,
  amount: number,
): number {
  const pools = combatant.shields;
  let toHp = amount;
  for (const pool of pools) {
    if (toHp <= 0) break;
    const absorbed = Math.min(pool.remaining, toHp);
    pool.remaining -= absorbed;
    toHp -= absorbed;
  }
  for (let i = pools.length - 1; i >= 0; i--) {
    if (pools[i].remaining <= 0) {
      pools.splice(i, 1);
    }
  }
  return toHp;
}

/**
 * The single point where damage lands on HP; reports whether it killed. Shields
 * absorb first (`absorbWithShields`), so only what they don't cover reaches HP —
 * a hit fully absorbed moves nothing and never kills. Immortality clamps the HP
 * write and nothing else — the hit's numbers are never truncated, so tallies and
 * the mana conversion read the same values whether the victim shields, floors or
 * dies. Only a `canDie` combatant can reach zero, so a `true` return needs no
 * further checks.
 */
export function applyDamage(combatant: Combatant, amount: number): boolean {
  const toHp = absorbWithShields(combatant, amount);
  const next = combatant.currentHp - toHp;
  combatant.currentHp = combatant.canDie
    ? next
    : Math.max(IMMORTAL_HP_FLOOR, next);
  return combatant.currentHp <= 0;
}

/**
 * Restore HP by `amount`, capped at the effective max — the surplus is lost, no
 * overheal (#71, D5). Never revives: a heal only fires mid-run from a cast, and
 * a run ends the instant the target dies, so a downed combatant is never here to
 * be healed. The cap reads the effective max, so an active `hp` buff has already
 * raised the ceiling this heal fills toward.
 */
export function applyHeal(combatant: Combatant, amount: number): void {
  combatant.currentHp = Math.min(
    combatant.stats.hp,
    combatant.currentHp + amount,
  );
}
