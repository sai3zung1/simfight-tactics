/**
 * Augment — a board-level modifier applied at combat start. Effects internals
 * are deferred until the modifier taxonomy is finalized.
 */

import type { AugmentId } from "../primitives";
import type { Modifier } from "./modifier";

export type AugmentTier = "silver" | "gold" | "prismatic";

export type Augment = {
  readonly id: AugmentId;
  readonly name: string;
  readonly description: string;
  readonly tier: AugmentTier;
  readonly iconPath: string;
  readonly effects: readonly Modifier[];
};
