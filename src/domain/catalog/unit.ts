import type { UnitId, SpellId, TraitId } from "../primitives";
import type { BaseStats } from "./base-stats";

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
