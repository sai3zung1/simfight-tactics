import type { SpellId, StarValue } from "../primitives";

export type SpellParameter = StarValue;

export type ParameterName = string;

export type SpellParameters = Readonly<Record<ParameterName, SpellParameter>>;

export type Spell = {
  readonly id: SpellId;
  readonly name: string;
  readonly description: string;
  readonly iconPath: string;
  readonly parameters: SpellParameters;
};
