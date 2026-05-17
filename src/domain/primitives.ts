/**
 * Foundational types reused across the domain layer. No imports from
 * sibling modules — leaf of the dependency graph.
 */

// Runtime values are cdragon entity keys.
export type UnitId = string & { readonly __brand: "UnitId" };
export type SpellId = string & { readonly __brand: "SpellId" };
export type TraitId = string & { readonly __brand: "TraitId" };
export type AugmentId = string & { readonly __brand: "AugmentId" };
export type ItemId = string & { readonly __brand: "ItemId" };

/** `ScalingByStar` is a table shape — one value per star */
export type ScalingByStar = {
  readonly 1: number;
  readonly 2: number;
  readonly 3: number;
  readonly 4?: number;
};

/** `StarLevel` is a single value — a unit's current star */
export type StarLevel = keyof ScalingByStar;
