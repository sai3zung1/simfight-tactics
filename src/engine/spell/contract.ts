import type { Modifier } from "../../domain/catalog/modifier";
import type { ParameterName } from "../../domain/catalog/spell";
import type { SpellId } from "../../domain/primitives";
import type { EffectiveStats } from "../stats/effective-stats";

export type SpellRecipient = "self" | "opponent";

export type SpellEffect = {
  readonly recipient: SpellRecipient;
  readonly modifier: Modifier;
};

export type CombatantView = {
  readonly stats: EffectiveStats;
  readonly hp: { readonly current: number; readonly max: number };
};

export type SpellContext = {
  readonly caster: CombatantView;
  readonly opponent: CombatantView;
};

export type ResolvedSpellParameters = Readonly<Record<ParameterName, number>>;

export type SpellFn = (
  ctx: SpellContext,
  params: ResolvedSpellParameters,
) => readonly SpellEffect[];

export type SpellRegistry = Readonly<Record<SpellId, SpellFn>>;

export const EMPTY_SPELL_REGISTRY: SpellRegistry = {};

export const NO_SPELL_ID = "no-spell" as SpellId;
