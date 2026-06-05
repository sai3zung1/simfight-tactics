/**
 * Spell — catalog data of a champion's ability. The cast behavior lives
 * in `src/spells/set-17/<champion>.ts` and is resolved at runtime via
 * `SpellId`; this domain type carries only identity and numerical
 * parameters. Parameter taxonomy is deferred until finalized.
 */

import type { SpellId } from "../primitives";

/**
 * Opaque placeholder for spell parameter data; deferred until finalized.
 *
 * Distinct from `Modifier`: parameters are numerical inputs read by the
 * hand-written spell function, not composable effects applied by the
 * engine.
 */
export type SpellParameter = {
  readonly __kind: "TODO_STEP_5";
};

export type Spell = {
  readonly id: SpellId;
  readonly name: string;
  readonly description: string;
  readonly iconPath: string;
  readonly parameters: readonly SpellParameter[];
};
