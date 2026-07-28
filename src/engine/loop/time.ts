export type Ticks = number & { readonly __brand: "Ticks" };

export const TICKS_PER_SECOND = 1000;

export function secondsToTicks(s: number): Ticks {
  return Math.round(s * TICKS_PER_SECOND) as Ticks;
}

export function ticksToSeconds(t: Ticks): number {
  return t / TICKS_PER_SECOND;
}

export const TICK_ZERO = 0 as Ticks;

export const ONE_TICK = 1 as Ticks;

export const NEVER_EXPIRES = Infinity as Ticks;

export function addTicks(a: Ticks, b: Ticks): Ticks {
  return (a + b) as Ticks;
}
