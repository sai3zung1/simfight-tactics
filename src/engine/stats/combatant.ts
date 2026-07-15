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
 * Rebuild `combatant.stats` from its pre-fold view over the active modifier
 * set — the same one-pass fold as combat setup, re-run over `permanentModifiers`
 * plus the currently-active `timedModifiers`. Called whenever that timed set
 * changes (apply or expiry, #70). Reassigns `stats` wholesale: consumers read
 * it live per event, so the next event sees the new value with no further
 * plumbing. Only the fold (`stat-mod`) is recomputed here; damage-reduction and
 * mana-generation keep their combat-start resolution — their timed recompute
 * arrives with #71.
 */
export function refoldStats(combatant: Combatant): void {
  combatant.stats = applyModifiers(
    combatant.resolvedStats,
    [
      ...combatant.permanentModifiers,
      ...combatant.timedModifiers.map((entry) => entry.modifier),
    ],
    combatant.starLevel,
  );
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
