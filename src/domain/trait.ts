/**
 * Trait — modifier container activated when enough trait-bearing units are
 * on the board. The catalog carries identity, description and breakpoints;
 * effects internals are deferred to step 5 (PROJECT_CONTEXT §10).
 */

import type { TraitId } from "./primitives";
import type { Modifier } from "./modifier";

/** A single activation level of a trait. */
export type TraitBreakpoint = {
  readonly count: number;
  readonly description: string;
  readonly effects: readonly Modifier[];
};

/** A trait as it exists in the data registry. */
export type Trait = {
  readonly id: TraitId;
  readonly name: string;
  readonly description: string;
  readonly iconPath: string;
  readonly breakpoints: readonly TraitBreakpoint[];
};
