import type { BaseStats } from "../../domain/catalog/base-stats";
import type { CrowdControl, Modifier } from "../../domain/catalog/modifier";
import type { StarLevel } from "../../domain/primitives";
import type { Ticks } from "../loop/time";
import type { CombatantId } from "./combatant-id";
import {
  applyModifiers,
  resolveDamageReductions,
  resolveManaGains,
  type EffectiveStats,
  type ManaGains,
} from "./effective-stats";
import { resolveStats } from "./resolved-stats";

/**
 * One active crowd-control effect: which capability it takes away, and the
 * last tick it still does — inclusive, so the combatant is free starting
 * the following tick (#50).
 */
export type CrowdControlEntry = {
  readonly cc: CrowdControl;
  readonly blockedThrough: Ticks;
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
   * Computed once at combat start; effective-stats.ts owns the how and
   * why. The active modifier set cannot change mid-run yet — a spell buff
   * with a duration will need this to run again (#70). Crowd control (#50)
   * never touches this fold: it gates actions, not stats.
   */
  readonly stats: EffectiveStats;
  /**
   * Damage-reduction amounts kept apart from the `durability` stat: the two
   * shrink damage under different stacking rules (`reductionFactor`).
   */
  readonly damageReductions: readonly number[];
  /**
   * Equipped `mana-generation` modifiers resolved to plain amounts per
   * trigger; mechanics/mana.ts adds them onto each matching gain.
   */
  readonly manaGains: ManaGains;
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
   * applies one (#68) — never resolved from combat-start modifiers, since a
   * cast (the only real producer) can only fire from inside the running
   * loop, never from the combat-start fold (mechanics/crowd-control.ts, #50).
   */
  readonly activeCrowdControl: CrowdControlEntry[];
};

/**
 * Build a combatant's starting state: stats resolved and modifiers
 * applied, full HP, mana at its starting value.
 */
export function resolveCombatant(
  stats: BaseStats,
  starLevel: StarLevel,
  id: CombatantId,
  modifiers: readonly Modifier[],
  canDie: boolean,
): Combatant {
  const resolved = resolveStats(stats, starLevel);
  const effective = applyModifiers(resolved, modifiers, starLevel);
  return {
    id,
    stats: effective,
    damageReductions: resolveDamageReductions(modifiers, starLevel, resolved),
    manaGains: resolveManaGains(modifiers, starLevel, resolved),
    canDie,
    currentHp: effective.hp,
    currentMana: effective.mana.start,
    activeCrowdControl: [],
  };
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
 * The single point where damage lands on HP; reports whether it killed.
 * Immortality clamps the HP write and nothing else — the hit's numbers are
 * never truncated, so tallies and the mana conversion read the same values
 * whether the victim floors or dies. Only a `canDie` combatant can reach
 * zero, so a `true` return needs no further checks.
 */
export function applyDamage(combatant: Combatant, amount: number): boolean {
  const next = combatant.currentHp - amount;
  combatant.currentHp = combatant.canDie
    ? next
    : Math.max(IMMORTAL_HP_FLOOR, next);
  return combatant.currentHp <= 0;
}
