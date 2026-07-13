/**
 * Spell — catalog data of a champion's ability. Cast behavior lives in
 * hand-written per-champion spell functions (one module per set, not in the
 * tree yet), resolved at runtime via `SpellId`; this domain type carries only
 * identity and tuning numbers.
 */

import type { SpellId, StarValue } from "../primitives";

/**
 * One spell tuning number — a `StarValue` (flat, or one value per star level).
 * Distinct from a `Modifier`: a parameter is a numerical input the hand-written
 * spell function reads, never a composable effect the engine applies.
 */
export type SpellParameter = StarValue;

/**
 * An owned parameter name. The adapter maps the source's per-set variable names
 * onto these, so the churn lives in the data (which names a spell fills), never
 * in this type.
 */
export type ParameterName = string;

/**
 * A spell's tuning numbers, keyed by owned name and read by its hand-written
 * function. Frozen shape: a new spell adds keys (data), it never changes the
 * type — the registry stays uniform (one `SpellFn` signature for every spell).
 */
export type SpellParameters = Readonly<Record<ParameterName, SpellParameter>>;

export type Spell = {
  readonly id: SpellId;
  readonly name: string;
  readonly description: string;
  readonly iconPath: string;
  readonly parameters: SpellParameters;
};
