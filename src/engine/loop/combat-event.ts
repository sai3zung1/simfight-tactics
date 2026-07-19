import type { Ticks } from "./time";
import type { CombatantId } from "../stats/combatant-id";
import type { CrowdControl, Modifier } from "../../domain/catalog/modifier";

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

/**
 * One combatant's timed modifiers reach an expiry tick. Carries only
 * `combatant`, never which modifier: the handler prunes every entry whose
 * window has closed and refolds (mechanics/timed-modifiers.ts, #70). Fired at
 * the entry's `expiresAt` — the active window is half-open, so the modifier is
 * gone from that tick on (D6).
 */
export type ModifierExpiryEvent = {
  readonly kind: "modifier-expiry";
  readonly time: Ticks;
  readonly combatant: CombatantId;
};

/**
 * One combatant's shield pools reach an expiry tick. Carries only `combatant`,
 * never which pool: the handler prunes every pool whose window has closed
 * (mechanics/shield.ts, #71). Fired at the pool's `expiresAt` — the active
 * window is half-open, so the shield is gone from that tick on, exactly as a
 * `modifier-expiry`, but on a pool rather than the stat fold (D7).
 */
export type ShieldExpiryEvent = {
  readonly kind: "shield-expiry";
  readonly time: Ticks;
  readonly combatant: CombatantId;
};

/**
 * One due tick of a periodic spell effect. Unlike the id-only events above it
 * carries the effect itself: every tick is scheduled wholesale at cast
 * (mechanics/periodic-ticks.ts), so no per-combatant registry exists to look
 * the modifier up — the event is the effect's only home. The ids let the
 * handler re-read both sheets live at each tick: `source` cast the effect
 * (credited for its damage, and the basis its scaled amounts re-resolve
 * against), `target` receives it.
 */
export type PeriodicTickEvent = {
  readonly kind: "periodic-tick";
  readonly time: Ticks;
  readonly source: CombatantId;
  readonly target: CombatantId;
  readonly modifier: Modifier;
};

export type CombatEvent =
  | AutoAttackEvent
  | ManaRegenEvent
  | CastEvent
  | CrowdControlExpiryEvent
  | ModifierExpiryEvent
  | ShieldExpiryEvent
  | PeriodicTickEvent;
