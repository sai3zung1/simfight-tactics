import type { SpellId, UnitId } from "../../domain/primitives";
import type { SpellParameters } from "../../domain/catalog/spell";
import { NO_SPELL_ID } from "../spell/contract";

/**
 * Stand-in spell sourcing until the real unit catalog lands (#39). No
 * provisional unit has a modeled spell, so both resolve to a no-op cast. The
 * signature is the part meant to survive: #39 swaps these bodies to read
 * `Unit.spellId` and its `Spell.parameters`, callers stay put — the same pattern
 * as `resolveUnitStats` / `resolveModifiers`.
 */

const PROVISIONAL_UNIT_SPELLS: Readonly<Record<UnitId, SpellId>> = {};
const PROVISIONAL_UNIT_SPELL_PARAMETERS: Readonly<
  Record<UnitId, SpellParameters>
> = {};

/** Resolve a unit to its spell identity — `NO_SPELL_ID` (no-op cast) for every provisional unit. */
export function resolveUnitSpellId(unitId: UnitId): SpellId {
  return PROVISIONAL_UNIT_SPELLS[unitId] ?? NO_SPELL_ID;
}

/** Resolve a unit's spell parameters — none for any provisional unit. */
export function resolveUnitSpellParameters(unitId: UnitId): SpellParameters {
  return PROVISIONAL_UNIT_SPELL_PARAMETERS[unitId] ?? {};
}
