import type { Ticks } from "./time";
import type { CombatantId } from "../stats/combatant-id";

/**
 * One scheduled occurrence the loop orders and processes — a discriminated
 * union on `kind`. `time` repeats on every member since the queue orders
 * on it regardless of kind; same-tick ordering is the queue's concern (a
 * sequence number), not a field carried here.
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
 * A full mana gauge resolves into a cast — the trigger only, the spell's
 * effects come with spell modeling.
 */
export type CastEvent = {
  readonly kind: "cast";
  readonly time: Ticks;
  readonly caster: CombatantId;
};

export type CombatEvent = AutoAttackEvent | ManaRegenEvent | CastEvent;
