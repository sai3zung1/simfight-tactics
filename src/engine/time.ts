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
 * Grid granularity (ticks per simulated second). Provisional and NOT calibrated
 * against the live game — only the converters depend on it, so the value can
 * change without touching consumers.
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
