/**
 * Item — combat equipment carried by a unit; its effects are modifiers applied
 * during a fight.
 */

import type { ItemId } from "../primitives";
import type { Modifier } from "./modifier";

export type ItemType =
  | "component"
  | "craftable"
  | "radiant"
  | "artifact"
  | "emblem"
  | "trait";

export type Item = {
  readonly id: ItemId;
  readonly name: string;
  readonly description: string;
  readonly type: ItemType;
  readonly iconPath: string;
  readonly effects: readonly Modifier[];
};
