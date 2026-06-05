/**
 * Trait — a modifier container activated when enough trait-bearing units are on
 * the board. Effects internals are deferred until the modifier taxonomy is
 * finalized.
 */

import type { TraitId } from "../primitives";
import type { Modifier } from "./modifier";

/** A single activation level of a trait. */
export type TraitBreakpoint = {
  readonly count: number;
  readonly description: string;
  readonly effects: readonly Modifier[];
};

export type Trait = {
  readonly id: TraitId;
  readonly name: string;
  readonly description: string;
  readonly iconPath: string;
  readonly breakpoints: readonly TraitBreakpoint[];
};
