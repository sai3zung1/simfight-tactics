import type { Ticks } from "./time";
import type { CombatantId } from "../stats/combatant-id";
import type { CrowdControl } from "../../domain/catalog/modifier";

/**
 * One scheduled occurrence the loop orders and processes — a discriminated
 * union on `kind`. `time` repeats on every member since the queue orders
 * on it regardless of kind; same-tick ordering is the queue's concern (a
 * sequence number), not a field carried here.
 *
 * Combatant fields name the event's own roles — who acts, who receives —
 * never the run's sides: with both sides fighting, an event's `attacker`
 * may well be the run's `target` (`CombatState`).
 */

/** A unit swings at its target; the exchange also generates mana. */
export type AutoAttackEvent = {
  readonly kind: "auto-attack";
  readonly time: Ticks;
  readonly attacker: CombatantId;
  readonly target: CombatantId;
};

/** One tick of steady mana generation for one combatant. */
export type ManaRegenEvent = {
  readonly kind: "mana-regen";
  readonly time: Ticks;
  readonly combatant: CombatantId;
};

/**
 * A full mana gauge resolves into a cast; the caster's spell effects
 * deliver as it resolves (engine/spell/apply-effects.ts).
 */
export type CastEvent = {
  readonly kind: "cast";
  readonly time: Ticks;
  readonly caster: CombatantId;
};

/**
 * One combatant's crowd-control ends. Carries `cc` so the handler knows
 * whether this specific effect was the one blocking the attack — silence
 * expiring must never restart a chain it never stopped (mechanics/
 * crowd-control.ts, #50).
 */
export type CrowdControlExpiryEvent = {
  readonly kind: "crowd-control-expiry";
  readonly time: Ticks;
  readonly combatant: CombatantId;
  readonly cc: CrowdControl;
};

export type CombatEvent =
  | AutoAttackEvent
  | ManaRegenEvent
  | CastEvent
  | CrowdControlExpiryEvent;
