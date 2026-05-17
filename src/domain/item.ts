/**
 * Item — equipped on a unit. The catalog carries identity and
 * classification; effects internals are deferred to step 5 (PROJECT_CONTEXT
 * §10).
 */

import type { ItemId } from "./primitives";
import type { Modifier } from "./modifier";

/** Category of item in the data registry. */
export type ItemType =
  | "component"
  | "craftable"
  | "radiant"
  | "artifact"
  | "emblem"
  | "trait";

/** An item as it exists in the data registry. */
export type Item = {
  readonly id: ItemId;
  readonly name: string;
  readonly description: string;
  readonly type: ItemType;
  readonly iconPath: string;
  readonly effects: readonly Modifier[];
};
