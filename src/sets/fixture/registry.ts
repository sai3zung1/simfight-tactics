import type { SpellRegistry } from "../../engine/spell/contract";
import { burst, FIXTURE_BURST_SPELL_ID } from "./spells/burst";
import { rally, FIXTURE_RALLY_SPELL_ID } from "./spells/rally";
import { shred, FIXTURE_SHRED_SPELL_ID } from "./spells/shred";
import { aegis, FIXTURE_AEGIS_SPELL_ID } from "./spells/aegis";
import { mend, FIXTURE_MEND_SPELL_ID } from "./spells/mend";
import { sear, FIXTURE_SEAR_SPELL_ID } from "./spells/sear";
import { renew, FIXTURE_RENEW_SPELL_ID } from "./spells/renew";
import { frenzy, FIXTURE_FRENZY_SPELL_ID } from "./spells/frenzy";

/**
 * The fixture set's dispatch table — the per-set assembly gesture every real
 * set will repeat: collect the set's hand-written spells under their ids,
 * ready to inject into a run (`simulate`). Rotating sets swaps which
 * registry the caller injects; the engine never changes.
 */
export const FIXTURE_SPELL_REGISTRY: SpellRegistry = {
  [FIXTURE_BURST_SPELL_ID]: burst,
  [FIXTURE_RALLY_SPELL_ID]: rally,
  [FIXTURE_SHRED_SPELL_ID]: shred,
  [FIXTURE_AEGIS_SPELL_ID]: aegis,
  [FIXTURE_MEND_SPELL_ID]: mend,
  [FIXTURE_SEAR_SPELL_ID]: sear,
  [FIXTURE_RENEW_SPELL_ID]: renew,
  [FIXTURE_FRENZY_SPELL_ID]: frenzy,
};
