export type UnitId = string & { readonly __brand: "UnitId" };
export type SpellId = string & { readonly __brand: "SpellId" };
export type TraitId = string & { readonly __brand: "TraitId" };
export type AugmentId = string & { readonly __brand: "AugmentId" };
export type ItemId = string & { readonly __brand: "ItemId" };

export type ScalingByStar = {
  readonly 1: number;
  readonly 2: number;
  readonly 3: number;
  // Only a set-defined subset of units is ever eligible at four stars.
  readonly 4?: number;
};

export type StarLevel = keyof ScalingByStar;

export type StarValue = number | ScalingByStar;
