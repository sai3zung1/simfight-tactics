import type { Augment, AugmentTier } from "../../src/domain/catalog/augment";
import type { BaseStats } from "../../src/domain/catalog/base-stats";
import type { Item, ItemType } from "../../src/domain/catalog/item";
import type { Trait } from "../../src/domain/catalog/trait";
import type {
  DamageProfile,
  Unit,
  UnitCost,
  UnitRole,
} from "../../src/domain/catalog/unit";
import {
  SET_18_AUGMENTS,
  SET_18_ITEMS,
  SET_18_TRAITS,
  SET_18_UNITS,
} from "../../src/sets/capture";

export type Drift = {
  readonly entry: string;
  readonly family: string;
  readonly field: string;
  readonly saying: string;
};

export type Families = Readonly<Record<string, readonly unknown[]>>;

// What the domain requires, listed once per family. The assertion under each
// list stops the build when the domain gains a field the list forgets, so this
// is derived from `src/domain` rather than a second copy of it that could drift.
const UNIT = [
  "cost",
  "damageProfile",
  "description",
  "iconPath",
  "id",
  "name",
  "role",
  "spellId",
  "stats",
  "traitIds",
] as const;
const WHOLE_UNIT: Whole<keyof Unit, (typeof UNIT)[number]> = true;

const STATS = [
  "abilityPower",
  "armor",
  "attackDamage",
  "attackSpeed",
  "critChance",
  "critDamage",
  "damageAmp",
  "durability",
  "hp",
  "magicResist",
  "mana",
  "manaGeneration",
  "omnivamp",
  "range",
] as const;
const WHOLE_STATS: Whole<keyof BaseStats, (typeof STATS)[number]> = true;

const TRAIT = ["breakpoints", "description", "iconPath", "id", "name"] as const;
const WHOLE_TRAIT: Whole<keyof Trait, (typeof TRAIT)[number]> = true;

const ITEM = [
  "description",
  "effects",
  "iconPath",
  "id",
  "name",
  "type",
] as const;
const WHOLE_ITEM: Whole<keyof Item, (typeof ITEM)[number]> = true;

const AUGMENT = [
  "description",
  "effects",
  "iconPath",
  "id",
  "name",
  "tier",
] as const;
const WHOLE_AUGMENT: Whole<keyof Augment, (typeof AUGMENT)[number]> = true;

// The closed vocabularies. A value outside one of these is a newcomer the
// domain has no place for, which is as much a drift as an absent field.
const ROLES = [
  "assassin",
  "caster",
  "fighter",
  "marksman",
  "specialist",
  "tank",
] as const;
const WHOLE_ROLES: Whole<UnitRole, (typeof ROLES)[number]> = true;

const PROFILES = ["hybrid", "magic", "physical"] as const;
const WHOLE_PROFILES: Whole<DamageProfile, (typeof PROFILES)[number]> = true;

const COSTS = [1, 2, 3, 4, 5] as const;
const WHOLE_COSTS: Whole<UnitCost, (typeof COSTS)[number]> = true;

const TIERS = ["gold", "prismatic", "silver"] as const;
const WHOLE_TIERS: Whole<AugmentTier, (typeof TIERS)[number]> = true;

const TYPES = [
  "artifact",
  "component",
  "craftable",
  "emblem",
  "radiant",
] as const;
const WHOLE_TYPES: Whole<ItemType, (typeof TYPES)[number]> = true;

// `true` when the list covers the type; otherwise the union of what it missed,
// which `true` is not assignable to, so the field is named at the failure.
type Whole<In, Listed> =
  Exclude<In, Listed> extends never ? true : Exclude<In, Listed>;

// Read so the assertions above are not dropped as unused.
export const COVERED = [
  WHOLE_UNIT,
  WHOLE_STATS,
  WHOLE_TRAIT,
  WHOLE_ITEM,
  WHOLE_AUGMENT,
  WHOLE_ROLES,
  WHOLE_PROFILES,
  WHOLE_COSTS,
  WHOLE_TIERS,
  WHOLE_TYPES,
].every(Boolean);

function held(entry: unknown, field: string): unknown {
  return (entry as Record<string, unknown>)[field];
}

function named(entry: unknown, at: number): string {
  const id = held(entry, "id");
  return typeof id === "string" ? id : `${at}`;
}

function missing(
  family: string,
  entries: readonly unknown[],
  fields: readonly string[],
): Drift[] {
  return entries.flatMap((entry, at) =>
    fields
      .filter((field) => held(entry, field) === undefined)
      .map((field) => ({
        entry: named(entry, at),
        family,
        field,
        saying: "the domain requires it and the capture has none",
      })),
  );
}

function outside(
  family: string,
  entries: readonly unknown[],
  field: string,
  vocabulary: readonly (string | number)[],
): Drift[] {
  return entries.flatMap((entry, at) => {
    const value = held(entry, field);
    if (value === undefined || vocabulary.includes(value as string)) return [];
    return [
      {
        entry: named(entry, at),
        family,
        field,
        saying: `the capture says ${JSON.stringify(value)} and the domain knows ${vocabulary.join(", ")}`,
      },
    ];
  });
}

function inside(
  family: string,
  entries: readonly unknown[],
  holder: string,
  fields: readonly string[],
): Drift[] {
  return entries.flatMap((entry, at) => {
    // An absent holder is reported once, by `missing`, rather than once per
    // field it would have carried.
    const nested = held(entry, holder);
    if (nested === undefined || nested === null) return [];

    return fields
      .filter((field) => held(nested, field) === undefined)
      .map((field) => ({
        entry: named(entry, at),
        family,
        field: `${holder}.${field}`,
        saying: "the domain requires it and the capture has none",
      }));
  });
}

export function checkAgainstDomain(families: Families): readonly Drift[] {
  const units = families.units ?? [];
  const drifts = [
    ...missing("units", units, UNIT),
    ...inside("units", units, "stats", STATS),
    ...missing("traits", families.traits ?? [], TRAIT),
    ...missing("items", families.items ?? [], ITEM),
    ...missing("augments", families.augments ?? [], AUGMENT),
    ...outside("units", units, "role", ROLES),
    ...outside("units", units, "damageProfile", PROFILES),
    ...outside("units", units, "cost", COSTS),
    ...outside("items", families.items ?? [], "type", TYPES),
    ...outside("augments", families.augments ?? [], "tier", TIERS),
  ];

  // Sorted so two runs report the same file, and so a reader sees a family at a
  // time rather than a walk order.
  return drifts.sort(
    (a, b) =>
      a.family.localeCompare(b.family) ||
      a.field.localeCompare(b.field) ||
      a.entry.localeCompare(b.entry),
  );
}

/// The capture the project carries, read through the one door that opens `data/`.
export function whatDataCarries(): Families {
  return {
    augments: SET_18_AUGMENTS.entries,
    items: SET_18_ITEMS.entries,
    traits: SET_18_TRAITS.entries,
    units: SET_18_UNITS.entries,
  };
}

/// The kinds of drift, rather than every entry that shows one: a rotation moves
/// the counts and leaves the kinds alone, so this is what a test can hold.
export function kinds(drifts: readonly Drift[]): readonly string[] {
  return [...new Set(drifts.map((drift) => `${drift.family}.${drift.field}`))]
    .sort()
    .map(String);
}
