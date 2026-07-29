import type { CastEvent, ManaRegenEvent } from "../loop/combat-event";
import type { CombatState } from "../loop/combat-state";
import { combatantById } from "../loop/combat-state";
import type { StopSignal } from "../loop/stop-signal";
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

export const MANA_REGEN_INTERVAL_SECONDS = 1;

export function shouldScheduleManaRegen(combatant: Combatant): boolean {
  return hasManaBar(combatant) && regenManaGain(combatant) > 0;
}

export function ensureManaRegenScheduled(
  combatant: Combatant,
  now: Ticks,
  queue: EventQueue,
): void {
  if (
    shouldScheduleManaRegen(combatant) &&
    !queue.has((e) => e.kind === "mana-regen" && e.combatant === combatant.id)
  ) {
    queue.push({
      kind: "mana-regen",
      time: addTicks(now, secondsToTicks(MANA_REGEN_INTERVAL_SECONDS)),
      combatant: combatant.id,
    });
  }
}

export function pushCastIfReady(
  combatant: Combatant,
  time: Ticks,
  queue: EventQueue,
): void {
  if (readyToCast(combatant) && canCast(combatant, time)) {
    queue.push({ kind: "cast", time, caster: combatant.id });
  }
}

export function processManaRegen(
  event: ManaRegenEvent,
  state: CombatState,
  queue: EventQueue,
): void {
  const combatant = combatantById(state, event.combatant);
  gainMana(combatant, regenManaGain(combatant));
  pushCastIfReady(combatant, event.time, queue);
  ensureManaRegenScheduled(combatant, event.time, queue);
}

function viewOf(combatant: Combatant): CombatantView {
  return {
    stats: combatant.stats,
    hp: { current: combatant.currentHp, max: combatant.stats.hp },
  };
}

export function processCast(
  event: CastEvent,
  state: CombatState,
  queue: EventQueue,
  registry: SpellRegistry = EMPTY_SPELL_REGISTRY,
): StopSignal | undefined {
  const caster = combatantById(state, event.caster);
  if (!readyToCast(caster)) {
    return undefined;
  }
  state.castsBy[event.caster]++;
  // Assignment, not subtraction: whatever the gauge held above the threshold
  // is lost rather than carried into the next cast.
  caster.currentMana = caster.manaGains["post-cast"];

  // A caster with no registered spell casts for nothing: partial coverage is
  // the normal state, not an error worth raising.
  const spellFn: SpellFn | undefined = registry[caster.spellId];
  if (spellFn === undefined) {
    return undefined;
  }
  const opponent =
    caster.id === state.attacker.id ? state.target : state.attacker;
  const ctx: SpellContext = {
    caster: viewOf(caster),
    opponent: viewOf(opponent),
  };
  return applyEffects(
    spellFn(ctx, caster.spellParameters),
    caster,
    opponent,
    state,
    queue,
    event.time,
  );
}
