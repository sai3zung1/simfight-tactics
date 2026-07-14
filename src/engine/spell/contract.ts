import type { Modifier } from "../../domain/catalog/modifier";
import type { ParameterName } from "../../domain/catalog/spell";
import type { SpellId } from "../../domain/primitives";
import type { EffectiveStats } from "../stats/effective-stats";

/**
 * Who a spell effect lands on, relative to the caster. Two values under the 1v1
 * MVP; multi-target (#53) widens this — and decides the selection rule — with
 * the roster model in hand. The seam is this type, never a board index.
 */
export type SpellRecipient = "self" | "opponent";

/**
 * One sub-effect of a cast: a `Modifier` plus who it lands on. A cast returns an
 * ordered list of these — the tooltip's reading order — so a single cast can hit
 * both sides (self buff + opponent damage) in one list.
 */
export type SpellEffect = {
  readonly recipient: SpellRecipient;
  readonly modifier: Modifier;
};

/** A read-only projection of one combatant — the only surface a spell may read: stats and HP. */
export type CombatantView = {
  readonly stats: EffectiveStats;
  readonly hp: { readonly current: number; readonly max: number };
};

/**
 * What a spell function reads: its own view and the opponent's. Read-only by
 * construction, so a spell can only ever produce effects by returning them —
 * never by mutating combat state (ADR 0002).
 */
export type SpellContext = {
  readonly caster: CombatantView;
  readonly opponent: CombatantView;
};

/**
 * A spell's tuning numbers resolved to the caster's star level. The frozen,
 * uniform params type every `SpellFn` shares; per-spell field typing is
 * recovered locally inside each spell module.
 */
export type ResolvedSpellParameters = Readonly<Record<ParameterName, number>>;

/**
 * A hand-written spell: reads the combat view and its resolved parameters,
 * returns the ordered targeted effects it produces. Resolving those onto
 * combat state is the engine's job (engine/spell/apply-effects.ts), never
 * the spell's.
 */
export type SpellFn = (
  ctx: SpellContext,
  params: ResolvedSpellParameters,
) => readonly SpellEffect[];

/**
 * Dispatch table: one spell function per `SpellId`, assembled per set and
 * injected into the loop. A `SpellId` with no entry is a no-op cast — partial
 * coverage is the steady state — never an error.
 */
export type SpellRegistry = Readonly<Record<SpellId, SpellFn>>;

/** Empty dispatch table: every cast is a no-op. The default until a set's spells are wired. */
export const EMPTY_SPELL_REGISTRY: SpellRegistry = {};

/**
 * Identity for a combatant with no modeled spell — its cast resolves to nothing.
 * The default a combatant carries until a real `SpellId` is sourced (#39).
 */
export const NO_SPELL_ID = "no-spell" as SpellId;
