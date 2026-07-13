import type { CastEvent, ManaRegenEvent } from "../loop/combat-event";
import type { CombatState } from "../loop/combat-state";
import { combatantById } from "../loop/combat-state";
import { canCast, type Combatant } from "../stats/combatant";
import type { EventQueue } from "../loop/event-queue";
import { addTicks, secondsToTicks, type Ticks } from "../loop/time";
import { gainMana, readyToCast, regenManaGain, hasManaBar } from "./mana";
import { applyEffects } from "../spell/apply-effects";
import {
  EMPTY_SPELL_REGISTRY,
  type CombatantView,
  type SpellContext,
  type SpellFn,
  type SpellRegistry,
} from "../spell/contract";

/**
 * The casting side of the mana pipeline: emit a cast when a gauge is full,
 * spend the gauge when the cast resolves, and drive the steady per-second
 * generation. A cast is the trigger only — the spell's effects come with
 * spell modeling.
 */

/**
 * Seconds between two ticks of steady generation. Measured: the live game
 * pays per-second values in discrete one-second steps, the first one
 * interval in (docs/data/calibration-log.md, B1).
 */
export const MANA_REGEN_INTERVAL_SECONDS = 1;

/** A combatant joins the regen schedule only if ticking can ever pay out. */
export function shouldScheduleManaRegen(combatant: Combatant): boolean {
  return hasManaBar(combatant) && regenManaGain(combatant) > 0;
}

/**
 * Emit the cast as its own event, on the same tick as the gain that
 * filled the gauge — the queue's arrival order resolves it right after,
 * so a cast stays a first-class, ordered occurrence (ADR 0002).
 *
 * A gated caster (stun, silence) never gets the event pushed at all — the
 * gauge keeps filling underneath (mana generation is never blocked, #50),
 * so this check alone is enough to catch up the moment the block lifts,
 * whether that recheck comes from a later attack/regen tick or from the
 * effect's own expiry (mechanics/crowd-control.ts).
 */
export function pushCastIfReady(
  combatant: Combatant,
  time: Ticks,
  queue: EventQueue,
): void {
  if (readyToCast(combatant) && canCast(combatant, time)) {
    queue.push({ kind: "cast", time, caster: combatant.id });
  }
}

/**
 * Steady generation: pay out one interval's worth, maybe emit a cast,
 * reschedule the next tick — the same recurring pattern as the
 * auto-attack.
 */
export function processManaRegen(
  event: ManaRegenEvent,
  state: CombatState,
  queue: EventQueue,
): void {
  const combatant = combatantById(state, event.combatant);
  gainMana(combatant, regenManaGain(combatant));
  pushCastIfReady(combatant, event.time, queue);
  queue.push({
    kind: "mana-regen",
    time: addTicks(event.time, secondsToTicks(MANA_REGEN_INTERVAL_SECONDS)),
    combatant: event.combatant,
  });
}

/** Project a combatant onto the read-only `CombatantView` a spell is allowed to read. */
function viewOf(combatant: Combatant): CombatantView {
  return {
    stats: combatant.stats,
    hp: { current: combatant.currentHp, max: combatant.stats.hp },
  };
}

/**
 * Resolve one cast: count it, spend the gauge, then dispatch the caster's spell.
 * The gauge restarts at the post-cast modifier sum — zero without items:
 * measured, the excess above the threshold is lost and there is no floor
 * (docs/data/calibration-log.md, A1).
 *
 * A cast event whose gauge is no longer full is dropped: two same-tick gains can
 * each emit a cast, and the first to resolve spends the bar.
 *
 * The spell is looked up by the caster's `spellId` in the injected registry; a
 * caster with no registered spell casts for nothing (partial coverage is the
 * norm, #68). The spell reads a read-only view and returns targeted effects;
 * applying them onto combat state is `applyEffects`' job, filled by #69.
 */
export function processCast(
  event: CastEvent,
  state: CombatState,
  registry: SpellRegistry = EMPTY_SPELL_REGISTRY,
): void {
  const caster = combatantById(state, event.caster);
  if (!readyToCast(caster)) {
    return;
  }
  state.castsBy[event.caster]++;
  caster.currentMana = caster.manaGains["post-cast"];

  const spellFn: SpellFn | undefined = registry[caster.spellId];
  if (spellFn === undefined) {
    return;
  }
  const opponent =
    caster.id === state.attacker.id ? state.target : state.attacker;
  const ctx: SpellContext = {
    caster: viewOf(caster),
    opponent: viewOf(opponent),
  };
  applyEffects(spellFn(ctx, caster.spellParameters));
}
