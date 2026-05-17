/**
 * BoardSide — declarative input describing one configured combatant.
 *
 * Bridges the catalog (templates of what exists) with the engine
 * (consumer of a fully-resolved combat). References catalog entities by
 * branded id; the engine resolves them at simulation time.
 *
 * Item and augment slot counts are encoded as tuple unions so the 0-to-3
 * cap (PROJECT_CONTEXT §4) is enforced at the type level, without runtime
 * validation past the UI boundary. Trait activations use a Record keyed
 * by TraitId so the same trait cannot be declared twice on a side.
 */

import type {
  UnitId,
  ItemId,
  AugmentId,
  TraitId,
  StarLevel,
} from "../primitives";

export type ItemSlots =
  | readonly []
  | readonly [ItemId]
  | readonly [ItemId, ItemId]
  | readonly [ItemId, ItemId, ItemId];

export type AugmentSlots =
  | readonly []
  | readonly [AugmentId]
  | readonly [AugmentId, AugmentId]
  | readonly [AugmentId, AugmentId, AugmentId];

export type BoardSide = {
  readonly unitId: UnitId;
  readonly starLevel: StarLevel;
  readonly itemIds: ItemSlots;
  /** Raw active-unit count per trait; mapped to the matching breakpoint by the engine. */
  readonly traits: Readonly<Record<TraitId, number>>;
  readonly augmentIds: AugmentSlots;
};
