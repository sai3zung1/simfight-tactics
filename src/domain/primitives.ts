/**
 * Foundational types reused across the domain layer. No imports from
 * sibling modules — leaf of the dependency graph.
 */

// Runtime values are source entity keys (cdragon today).
export type UnitId = string & { readonly __brand: "UnitId" };
export type SpellId = string & { readonly __brand: "SpellId" };
export type TraitId = string & { readonly __brand: "TraitId" };
export type AugmentId = string & { readonly __brand: "AugmentId" };
export type ItemId = string & { readonly __brand: "ItemId" };

/**
 * A numeric value resolved per star level by the data pipeline.
 * Key `4` is optional: only 2-cost units are eligible at 4 stars.
 */
export type ScalingByStar = {
  readonly 1: number;
  readonly 2: number;
  readonly 3: number;
  readonly 4?: number;
};

export type StarLevel = keyof ScalingByStar;
