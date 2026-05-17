/**
 * Spell — catalog data of a champion's ability. The cast behavior lives
 * in `src/spells/set-17/<champion>.ts` and is resolved at runtime via
 * `SpellId`; this domain type carries only identity and numerical
 * parameters. Parameter taxonomy is deferred to step 5 (PROJECT_CONTEXT §10).
 */

import type { SpellId } from "../primitives";

/**
 * Opaque placeholder for spell parameter data; deferred to step 5.
 *
 * Distinct from `Modifier`: parameters are numerical inputs read by the
 * hand-written spell function (PROJECT_CONTEXT §8 phase 4), not composable
 * effects applied by the engine (§7).
 */
export type SpellParameter = {
  readonly __kind: "TODO_STEP_5";
};

/** A spell as it exists in the data registry. */
export type Spell = {
  readonly id: SpellId;
  readonly name: string;
  readonly description: string;
  readonly iconPath: string;
  readonly parameters: readonly SpellParameter[];
};
