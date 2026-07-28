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
  readonly traits: Readonly<Record<TraitId, number>>;
  readonly augmentIds: AugmentSlots;
};
