import type { DamageType } from "../../domain/catalog/modifier";
import type { StarValue } from "../../domain/primitives";
import type { CombatState } from "../loop/combat-state";
import type { EventQueue } from "../loop/event-queue";
import type { StopSignal } from "../loop/stop-signal";
import type { Ticks } from "../loop/time";
import { pushCastIfReady } from "../mechanics/casting";
import { neverCrit } from "../mechanics/crit-policy";
import { damageTakenManaGain, gainMana } from "../mechanics/mana";
import { resolveDamage } from "../mechanics/resolve-damage";
import { applyDamage, type Combatant } from "../stats/combatant";

/**
 * Delivery shared between a cast resolving now (apply-effects.ts) and a
 * periodic tick firing later (mechanics/periodic-ticks.ts): both must run the
 * exact same sequence, held once so the two paths cannot drift. Callers
 * resolve the magnitude first — cast-time against the caster's settled fold,
 * tick-time against the source's live sheet — and hand a plain number here.
 *
 * This module sits inside the same runtime-only cycle casting.ts and
 * apply-effects.ts already document: a delivered hit can push the victim's
 * response cast. Safe by construction — every cross-module call happens at
 * run time, never while modules load.
 */

/**
 * A spell-produced value is star-collapsed to a plain number before it is
 * ever emitted: per-star tables are dissolved into the caster's parameters
 * at combat setup (stats/combatant.ts). A table reaching delivery is a
 * spell-author bug — surfaced loudly rather than resolved against a wrong
 * star.
 */
export function starCollapsed(value: StarValue): number {
  if (typeof value !== "number") {
    throw new Error(
      "a spell emits star-collapsed numbers; per-star tables live in its parameters",
    );
  }
  return value;
}

/**
 * One spell damage instance through the full pipeline: resolve — a spell
 * never crits by default, the capability is item-granted (#13) — land on HP
 * behind shields, credit the source's tally, then the exchange's mana and the
 * victim's possible response cast. A kill returns the stop signal for the
 * caller to relay: nothing after a run's end is observable, so a killing
 * instance grants no post-mortem mana either.
 */
export function deliverDamage(
  hit: { readonly amount: number; readonly damageType: DamageType },
  source: Combatant,
  target: Combatant,
  state: CombatState,
  queue: EventQueue,
  time: Ticks,
): StopSignal | undefined {
  const resolved = resolveDamage(
    { amount: hit.amount, damageType: hit.damageType },
    { damageAmp: source.stats.damageAmp },
    {
      armor: target.stats.armor,
      magicResist: target.stats.magicResist,
      durability: target.stats.durability,
      damageReductions: target.damageReductions,
    },
    neverCrit(source.stats.critChance, source.stats.critDamage),
  );
  const killed = applyDamage(target, resolved.dealt);
  state.damageDealtBy[source.id] += resolved.dealt;
  if (killed) {
    return { time };
  }
  gainMana(
    target,
    damageTakenManaGain(target, resolved.preMitigated, resolved.dealt),
  );
  pushCastIfReady(target, time, queue);
  return undefined;
}
