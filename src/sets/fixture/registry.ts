import type { SpellRegistry } from "../../engine/spell/contract";
import { burst, FIXTURE_BURST_SPELL_ID } from "./spells/burst";

/**
 * The fixture set's dispatch table — the per-set assembly gesture every real
 * set will repeat: collect the set's hand-written spells under their ids,
 * ready to inject into a run (`simulate`). Rotating sets swaps which
 * registry the caller injects; the engine never changes.
 */
export const FIXTURE_SPELL_REGISTRY: SpellRegistry = {
  [FIXTURE_BURST_SPELL_ID]: burst,
};
