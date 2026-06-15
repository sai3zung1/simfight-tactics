/**
 * Unit (champion) — the core combat entity: identity, shop cost, role, damage
 * profile, traits, its spell, and combat stats. Assembled by the data pipeline
 * and referenced everywhere by `UnitId`. The combat numbers live in `BaseStats`.
 */

import type { UnitId, SpellId, TraitId } from "../primitives";
import type { BaseStats } from "./base-stats";

/** Gold cost tier of a unit in the shop. */
export type UnitCost = 1 | 2 | 3 | 4 | 5;

export type UnitRole =
  | "tank"
  | "bruiser"
  | "marksman"
  | "caster"
  | "assassin"
  | "support"
  | "specialist";

export type DamageProfile = "physical" | "magic" | "hybrid";

export type Unit = {
  readonly id: UnitId;
  readonly name: string;
  readonly description: string;
  readonly cost: UnitCost;
  readonly role: UnitRole;
  readonly damageProfile: DamageProfile;
  readonly traitIds: readonly TraitId[];
  readonly spellId: SpellId;
  readonly stats: BaseStats;
  readonly iconPath: string;
};
