/**
 * Foundational types reused across the domain layer. No imports from
 * sibling modules — leaf of the dependency graph.
 */

// Runtime values are the extraction source's entity keys (Community Dragon
// today — a swappable adapter, ADR 0005).
export type UnitId = string & { readonly __brand: "UnitId" };
export type SpellId = string & { readonly __brand: "SpellId" };
export type TraitId = string & { readonly __brand: "TraitId" };
export type AugmentId = string & { readonly __brand: "AugmentId" };
export type ItemId = string & { readonly __brand: "ItemId" };

/**
 * A numeric value resolved per star level by the data pipeline.
 * Key `4` is optional: only a set-defined subset of units is ever eligible
 * at four stars, so most entries stop at 3.
 */
export type ScalingByStar = {
  readonly 1: number;
  readonly 2: number;
  readonly 3: number;
  readonly 4?: number;
};

export type StarLevel = keyof ScalingByStar;
