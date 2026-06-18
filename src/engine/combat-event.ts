import type { Ticks } from "./time";

/**
 * CombatEvent — one scheduled occurrence the loop orders and processes.
 *
 * #46 ships only the envelope: a tick timestamp. It is deliberately a single
 * shape, not yet a discriminated union — concrete kinds (attack, cast, tick…)
 * are introduced by their owning tickets (#47+), each adding a `kind` variant
 * (and an exhaustiveness guard at the consumer).
 *
 * Ordering among same-tick events is the queue's concern (a sequence number),
 * not a field carried here.
 */
export type CombatEvent = {
  readonly time: Ticks;
};
