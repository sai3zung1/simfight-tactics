import type { BaseStats } from "../../domain/catalog/base-stats";
import type { SpellParameters } from "../../domain/catalog/spell";
import type { SpellId, UnitId } from "../../domain/primitives";
import { NO_SPELL_ID } from "../spell/contract";
import {
  PROVISIONAL_CASTER_STATS,
  PROVISIONAL_DEFENSIVE_CASTER_STATS,
  PROVISIONAL_FIGHTER_STATS,
  PROVISIONAL_IMMORTAL_STATS,
  PROVISIONAL_NO_ATTACK_CASTER_STATS,
  PROVISIONAL_NO_MANA_STATS,
  PROVISIONAL_TANK_STATS,
} from "./provisional-stats";
import {
  FIXTURE_BURST_PARAMETERS,
  FIXTURE_BURST_SPELL_ID,
} from "../../sets/fixture/spells/burst";
import {
  FIXTURE_RALLY_PARAMETERS,
  FIXTURE_RALLY_SPELL_ID,
} from "../../sets/fixture/spells/rally";
import {
  FIXTURE_SUNDER_PARAMETERS,
  FIXTURE_SUNDER_SPELL_ID,
} from "../../sets/fixture/spells/sunder";
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

export const PROVISIONAL_TANK_UNIT_ID = "provisional-tank" as UnitId;
export const PROVISIONAL_CASTER_UNIT_ID = "provisional-caster" as UnitId;
export const PROVISIONAL_NO_ATTACK_CASTER_UNIT_ID =
  "provisional-no-attack-caster" as UnitId;
export const PROVISIONAL_NO_MANA_UNIT_ID = "provisional-no-mana" as UnitId;
export const PROVISIONAL_IMMORTAL_UNIT_ID = "provisional-immortal" as UnitId;
export const PROVISIONAL_RALLY_CASTER_UNIT_ID =
  "provisional-rally-caster" as UnitId;
export const PROVISIONAL_SUNDER_CASTER_UNIT_ID =
  "provisional-sunder-caster" as UnitId;
export const PROVISIONAL_AEGIS_CASTER_UNIT_ID =
  "provisional-aegis-caster" as UnitId;
export const PROVISIONAL_MEND_CASTER_UNIT_ID =
  "provisional-mend-caster" as UnitId;
export const PROVISIONAL_SEAR_CASTER_UNIT_ID =
  "provisional-sear-caster" as UnitId;
export const PROVISIONAL_RENEW_CASTER_UNIT_ID =
  "provisional-renew-caster" as UnitId;
export const PROVISIONAL_FRENZY_CASTER_UNIT_ID =
  "provisional-frenzy-caster" as UnitId;

type ProvisionalCaster = {
  readonly stats: BaseStats;
  readonly spellId: SpellId;
  readonly parameters: SpellParameters;
};

// One entry per provisional unit, so a new spell costs one line here and one in
// its set registry. A unit that casts nothing takes NO_SPELL_ID.
// TODO(#39): the whole table is replaced by the unit catalog.
const PROVISIONAL_CASTERS: Readonly<Record<UnitId, ProvisionalCaster>> = {
  [PROVISIONAL_TANK_UNIT_ID]: {
    stats: PROVISIONAL_TANK_STATS,
    spellId: NO_SPELL_ID,
    parameters: {},
  },
  [PROVISIONAL_NO_MANA_UNIT_ID]: {
    stats: PROVISIONAL_NO_MANA_STATS,
    spellId: NO_SPELL_ID,
    parameters: {},
  },
  [PROVISIONAL_IMMORTAL_UNIT_ID]: {
    stats: PROVISIONAL_IMMORTAL_STATS,
    spellId: NO_SPELL_ID,
    parameters: {},
  },
  [PROVISIONAL_CASTER_UNIT_ID]: {
    stats: PROVISIONAL_CASTER_STATS,
    spellId: FIXTURE_BURST_SPELL_ID,
    parameters: FIXTURE_BURST_PARAMETERS,
  },
  [PROVISIONAL_NO_ATTACK_CASTER_UNIT_ID]: {
    stats: PROVISIONAL_NO_ATTACK_CASTER_STATS,
    spellId: FIXTURE_BURST_SPELL_ID,
    parameters: FIXTURE_BURST_PARAMETERS,
  },
  [PROVISIONAL_RALLY_CASTER_UNIT_ID]: {
    stats: PROVISIONAL_CASTER_STATS,
    spellId: FIXTURE_RALLY_SPELL_ID,
    parameters: FIXTURE_RALLY_PARAMETERS,
  },
  [PROVISIONAL_SUNDER_CASTER_UNIT_ID]: {
    stats: PROVISIONAL_CASTER_STATS,
    spellId: FIXTURE_SUNDER_SPELL_ID,
    parameters: FIXTURE_SUNDER_PARAMETERS,
  },
  [PROVISIONAL_FRENZY_CASTER_UNIT_ID]: {
    stats: PROVISIONAL_CASTER_STATS,
    spellId: FIXTURE_FRENZY_SPELL_ID,
    parameters: FIXTURE_FRENZY_PARAMETERS,
  },
  [PROVISIONAL_AEGIS_CASTER_UNIT_ID]: {
    stats: PROVISIONAL_DEFENSIVE_CASTER_STATS,
    spellId: FIXTURE_AEGIS_SPELL_ID,
    parameters: FIXTURE_AEGIS_PARAMETERS,
  },
  [PROVISIONAL_MEND_CASTER_UNIT_ID]: {
    stats: PROVISIONAL_DEFENSIVE_CASTER_STATS,
    spellId: FIXTURE_MEND_SPELL_ID,
    parameters: FIXTURE_MEND_PARAMETERS,
  },
  [PROVISIONAL_RENEW_CASTER_UNIT_ID]: {
    stats: PROVISIONAL_DEFENSIVE_CASTER_STATS,
    spellId: FIXTURE_RENEW_SPELL_ID,
    parameters: FIXTURE_RENEW_PARAMETERS,
  },
  [PROVISIONAL_SEAR_CASTER_UNIT_ID]: {
    stats: PROVISIONAL_NO_ATTACK_CASTER_STATS,
    spellId: FIXTURE_SEAR_SPELL_ID,
    parameters: FIXTURE_SEAR_PARAMETERS,
  },
};

export function resolveUnitStats(unitId: UnitId): BaseStats {
  return PROVISIONAL_CASTERS[unitId]?.stats ?? PROVISIONAL_FIGHTER_STATS;
}

export function resolveUnitSpellId(unitId: UnitId): SpellId {
  return PROVISIONAL_CASTERS[unitId]?.spellId ?? NO_SPELL_ID;
}

export function resolveUnitSpellParameters(unitId: UnitId): SpellParameters {
  return PROVISIONAL_CASTERS[unitId]?.parameters ?? {};
}
