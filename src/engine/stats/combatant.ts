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

export type CrowdControlEntry = {
  readonly cc: CrowdControl;
  readonly blockedThrough: Ticks;
};

export type TimedModifierEntry = {
  readonly modifier: Modifier;
  readonly expiresAt: Ticks;
};

export type ShieldEntry = {
  remaining: number;
  readonly expiresAt: Ticks;
};

export function blocksAttack(cc: CrowdControl): boolean {
  return cc === "stun" || cc === "disarm";
}

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

export function canAttack(combatant: Combatant, now: Ticks): boolean {
  return !combatant.activeCrowdControl.some((entry) =>
    isBlockedBy(entry, now, blocksAttack),
  );
}

export function canCast(combatant: Combatant, now: Ticks): boolean {
  return !combatant.activeCrowdControl.some((entry) =>
    isBlockedBy(entry, now, blocksCast),
  );
}

export type Combatant = {
  readonly id: CombatantId;
  stats: EffectiveStats;
  readonly resolvedStats: ResolvedStats;
  readonly permanentModifiers: readonly Modifier[];
  readonly starLevel: StarLevel;
  readonly timedModifiers: TimedModifierEntry[];
  readonly shields: ShieldEntry[];
  damageReductions: readonly number[];
  manaGains: ManaGains;
  readonly spellId: SpellId;
  readonly spellParameters: ResolvedSpellParameters;
  readonly canDie: boolean;
  currentHp: number;
  currentMana: number;
  readonly activeCrowdControl: CrowdControlEntry[];
};

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

// Rebuilds from `resolvedStats` every time: applying onto the current stats
// instead would re-apply modifiers they already carry.
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

// Gaining max HP grants that HP outright; losing it clamps current HP under
// the new ceiling instead of killing, since an expiry is not damage.
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

const IMMORTAL_HP_FLOOR = 1;

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

export function applyDamage(combatant: Combatant, amount: number): boolean {
  const toHp = absorbWithShields(combatant, amount);
  const next = combatant.currentHp - toHp;
  combatant.currentHp = combatant.canDie
    ? next
    : Math.max(IMMORTAL_HP_FLOOR, next);
  return combatant.currentHp <= 0;
}

export function applyHeal(combatant: Combatant, amount: number): void {
  combatant.currentHp = Math.min(
    combatant.stats.hp,
    combatant.currentHp + amount,
  );
}
