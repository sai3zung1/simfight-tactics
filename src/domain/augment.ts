/**
 * Augment — board-level modifier applied at combat start. The catalog
 * carries identity and classification; effects internals are deferred to
 * step 5 (PROJECT_CONTEXT §10).
 */

import type { AugmentId } from "./primitives";
import type { Modifier } from "./modifier";

/** Power tier of an augment in the shop draft. */
export type AugmentTier = "silver" | "gold" | "prismatic";

/** An augment as it exists in the data registry. */
export type Augment = {
  readonly id: AugmentId;
  readonly name: string;
  readonly description: string;
  readonly tier: AugmentTier;
  readonly iconPath: string;
  readonly effects: readonly Modifier[];
};
