import type { TraitId } from "../primitives";
import type { Modifier } from "./modifier";

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
