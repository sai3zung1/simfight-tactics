import type { SpellId, UnitId } from "../../domain/primitives";
import type { SpellParameters } from "../../domain/catalog/spell";
import { NO_SPELL_ID } from "../spell/contract";
import {
  FIXTURE_BURST_PARAMETERS,
  FIXTURE_BURST_SPELL_ID,
} from "../../sets/fixture/spells/burst";
import {
  FIXTURE_RALLY_PARAMETERS,
  FIXTURE_RALLY_SPELL_ID,
} from "../../sets/fixture/spells/rally";
import {
  FIXTURE_SHRED_PARAMETERS,
  FIXTURE_SHRED_SPELL_ID,
} from "../../sets/fixture/spells/shred";
import {
  FIXTURE_AEGIS_PARAMETERS,
  FIXTURE_AEGIS_SPELL_ID,
} from "../../sets/fixture/spells/aegis";
import {
  FIXTURE_MEND_PARAMETERS,
  FIXTURE_MEND_SPELL_ID,
} from "../../sets/fixture/spells/mend";
import {
  FIXTURE_SEAR_PARAMETERS,
  FIXTURE_SEAR_SPELL_ID,
} from "../../sets/fixture/spells/sear";
import {
  FIXTURE_RENEW_PARAMETERS,
  FIXTURE_RENEW_SPELL_ID,
} from "../../sets/fixture/spells/renew";
import {
  FIXTURE_FRENZY_PARAMETERS,
  FIXTURE_FRENZY_SPELL_ID,
} from "../../sets/fixture/spells/frenzy";
import {
  PROVISIONAL_AEGIS_CASTER_UNIT_ID,
  PROVISIONAL_CASTER_UNIT_ID,
  PROVISIONAL_FRENZY_CASTER_UNIT_ID,
  PROVISIONAL_MEND_CASTER_UNIT_ID,
  PROVISIONAL_NO_ATTACK_CASTER_UNIT_ID,
  PROVISIONAL_RALLY_CASTER_UNIT_ID,
  PROVISIONAL_RENEW_CASTER_UNIT_ID,
  PROVISIONAL_SEAR_CASTER_UNIT_ID,
  PROVISIONAL_SHRED_CASTER_UNIT_ID,
} from "./provisional-stats";

/**
 * Stand-in spell sourcing until the real unit catalog lands (#39). The two
 * provisional casters carry the fixture set's spell, so a run proves the
 * cast-to-damage chain end to end; every other unit resolves to a no-op
 * cast. The signature is the part meant to survive: #39 swaps these bodies
 * to read `Unit.spellId` and its `Spell.parameters`, callers stay put — the
 * same pattern as `resolveUnitStats` / `resolveModifiers`.
 *
 * Importing from `sets/fixture` inverts the usual direction — set content
 * is injected into the engine, never imported by it. Accepted here as
 * stand-in debt: this module is disposable, replaced by the catalog at #39
 * and graduated to test-only alongside the other provisional sources (#13).
 */

const PROVISIONAL_UNIT_SPELLS: Readonly<Record<UnitId, SpellId>> = {
  [PROVISIONAL_CASTER_UNIT_ID]: FIXTURE_BURST_SPELL_ID,
  [PROVISIONAL_NO_ATTACK_CASTER_UNIT_ID]: FIXTURE_BURST_SPELL_ID,
  [PROVISIONAL_RALLY_CASTER_UNIT_ID]: FIXTURE_RALLY_SPELL_ID,
  [PROVISIONAL_SHRED_CASTER_UNIT_ID]: FIXTURE_SHRED_SPELL_ID,
  [PROVISIONAL_AEGIS_CASTER_UNIT_ID]: FIXTURE_AEGIS_SPELL_ID,
  [PROVISIONAL_MEND_CASTER_UNIT_ID]: FIXTURE_MEND_SPELL_ID,
  [PROVISIONAL_SEAR_CASTER_UNIT_ID]: FIXTURE_SEAR_SPELL_ID,
  [PROVISIONAL_RENEW_CASTER_UNIT_ID]: FIXTURE_RENEW_SPELL_ID,
  [PROVISIONAL_FRENZY_CASTER_UNIT_ID]: FIXTURE_FRENZY_SPELL_ID,
};
const PROVISIONAL_UNIT_SPELL_PARAMETERS: Readonly<
  Record<UnitId, SpellParameters>
> = {
  [PROVISIONAL_CASTER_UNIT_ID]: FIXTURE_BURST_PARAMETERS,
  [PROVISIONAL_NO_ATTACK_CASTER_UNIT_ID]: FIXTURE_BURST_PARAMETERS,
  [PROVISIONAL_RALLY_CASTER_UNIT_ID]: FIXTURE_RALLY_PARAMETERS,
  [PROVISIONAL_SHRED_CASTER_UNIT_ID]: FIXTURE_SHRED_PARAMETERS,
  [PROVISIONAL_AEGIS_CASTER_UNIT_ID]: FIXTURE_AEGIS_PARAMETERS,
  [PROVISIONAL_MEND_CASTER_UNIT_ID]: FIXTURE_MEND_PARAMETERS,
  [PROVISIONAL_SEAR_CASTER_UNIT_ID]: FIXTURE_SEAR_PARAMETERS,
  [PROVISIONAL_RENEW_CASTER_UNIT_ID]: FIXTURE_RENEW_PARAMETERS,
  [PROVISIONAL_FRENZY_CASTER_UNIT_ID]: FIXTURE_FRENZY_PARAMETERS,
};

/** Resolve a unit to its spell identity — `NO_SPELL_ID` (no-op cast) for units without a fixture kit. */
export function resolveUnitSpellId(unitId: UnitId): SpellId {
  return PROVISIONAL_UNIT_SPELLS[unitId] ?? NO_SPELL_ID;
}

/** Resolve a unit's spell parameters — none for units without a fixture kit. */
export function resolveUnitSpellParameters(unitId: UnitId): SpellParameters {
  return PROVISIONAL_UNIT_SPELL_PARAMETERS[unitId] ?? {};
}
