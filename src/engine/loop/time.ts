/**
 * Engine time unit. The loop orders and advances combat in integer `Ticks`,
 * never in floating seconds — exact equality is what makes ordering
 * deterministic (two events on the same tick are a real, detectable tie).
 *
 * `Ticks` is branded so seconds can never be passed where ticks are expected;
 * the two converters below are the only bridge between the two units.
 */
export type Ticks = number & { readonly __brand: "Ticks" };

/**
 * Grid granularity (ticks per simulated second). Calibrated: nothing measured
 * needs finer than 1 ms (docs/data/calibration-log.md, grid check). Only the
 * converters depend on it, so the value can change without touching consumers.
 */
export const TICKS_PER_SECOND = 1000;

/**
 * Convert human seconds to engine ticks — the sole producer of `Ticks`. Rounds
 * to keep ticks integral, the basis of exact (and thus deterministic) ordering.
 */
export function secondsToTicks(s: number): Ticks {
  return Math.round(s * TICKS_PER_SECOND) as Ticks;
}

/** Convert engine ticks back to seconds, for the result boundary. */
export function ticksToSeconds(t: Ticks): number {
  return t / TICKS_PER_SECOND;
}

/** Tick zero: combat start, and the neutral value for tick-typed cursors. */
export const TICK_ZERO = 0 as Ticks;

/** One tick — the smallest step, e.g. the first free tick after a blocked one (#50). */
export const ONE_TICK = 1 as Ticks;

/**
 * Tick arithmetic that keeps the brand, so scheduling code never casts:
 * `as Ticks` stays confined to this file, the brand's only door.
 */
export function addTicks(a: Ticks, b: Ticks): Ticks {
  return (a + b) as Ticks;
}
