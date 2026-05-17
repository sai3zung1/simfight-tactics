/**
 * Unit (champion) — domain entity.
 *
 * Some base stats scale per star level: they are resolved by the data
 * pipeline (ROADMAP §5) and stored inside `BaseStats` as explicit per-star
 * tables. Other base stats are flat. The engine performs no scaling math
 * at runtime — the canonical shape lives in `BaseStats`.
 */

import type { UnitId, SpellId, TraitId } from "./primitives";
import type { BaseStats } from "./base-stats";

/** Gold cost tier of a unit in the shop. */
export type UnitCost = 1 | 2 | 3 | 4 | 5;

/** Combat function of the unit. */
export type UnitRole =
  | "tank"
  | "bruiser"
  | "marksman"
  | "caster"
  | "assassin"
  | "support"
  | "specialist";

/** Predominant damage type dealt by the unit. */
export type DamageProfile = "physical" | "magic" | "hybrid";

/** A unit as it exists in the data registry. */
export type Unit = {
  readonly id: UnitId;
  readonly name: string;
  readonly description: string;
  readonly cost: UnitCost;
  readonly role: UnitRole;
  /** Physical, Magical or Hybrid */
  readonly damageProfile: DamageProfile;
  readonly traitIds: readonly TraitId[];
  readonly spellId: SpellId;
  readonly stats: BaseStats;
  readonly iconPath: string;
};
