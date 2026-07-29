// Engine time is an integer so that two events on the same instant compare
// exactly equal — that detectable tie is what makes ordering deterministic.
export type Ticks = number & { readonly __brand: "Ticks" };

// Grid granularity: two instants less than one tick apart collapse into a
// single tie for the queue to break. Only the converters below read it.
export const TICKS_PER_SECOND = 1000;

export function secondsToTicks(s: number): Ticks {
  return Math.round(s * TICKS_PER_SECOND) as Ticks;
}

export function ticksToSeconds(t: Ticks): number {
  return t / TICKS_PER_SECOND;
}

export const TICK_ZERO = 0 as Ticks;

export const ONE_TICK = 1 as Ticks;

// Infinity, not a schedulable tick: callers filter it out before pushing an
// expiry, or the queue takes an event that never pops.
export const NEVER_EXPIRES = Infinity as Ticks;

export function addTicks(a: Ticks, b: Ticks): Ticks {
  return (a + b) as Ticks;
}
