import type { BaseStats } from "../../../domain/catalog/base-stats";

/*
 * The vocabulary of the Text atom — which values each axis accepts — and
 * nothing about how they paint. text.classes.ts realises this contract, and
 * the dependency runs only that way: a styling change can never shrink the
 * public API. The workshop's argTypes derive from these same arrays, so the
 * documented options cannot drift from the accepted ones.
 */

export const SIZES = ["xxs", "xs", "s", "m", "l", "xl"] as const;

export const WEIGHTS = ["normal", "medium", "semibold", "bold"] as const;

export const FAMILIES = ["ui", "display", "numeric"] as const;

export const VARIANTS = ["label"] as const;

export const TONES = ["default", "muted", "disabled"] as const;

export const STAT_KEYWORDS = [
  "hp",
  "attackDamage",
  "abilityPower",
  "armor",
  "magicResist",
  "durability",
  "attackSpeed",
  "critChance",
  "critDamage",
  "damageAmp",
  "range",
  "mana",
] as const satisfies readonly (keyof BaseStats)[];

export const EFFECT_KEYWORDS = [
  "physicalDamage",
  "magicDamage",
  "trueDamage",
  "heal",
  "shield",
  "crowdControl",
  "omnivamp",
  "bonus",
] as const;

export const KEYWORDS = [...STAT_KEYWORDS, ...EFFECT_KEYWORDS] as const;

export const TEXT_ELEMENTS = [
  "p",
  "span",
  "div",
  "h1",
  "h2",
  "h3",
  "strong",
  "em",
  "small",
] as const;

export type TextSize = (typeof SIZES)[number];
export type TextWeight = (typeof WEIGHTS)[number];
export type TextFamily = (typeof FAMILIES)[number];
export type TextVariant = (typeof VARIANTS)[number];
export type TextTone = (typeof TONES)[number];
export type TextKeyword = (typeof KEYWORDS)[number];
export type TextElement = (typeof TEXT_ELEMENTS)[number];

/* A default is contract too: declared once here, worn by the component. */
export const DEFAULTS = {
  as: "p",
  size: "s",
  weight: "medium",
  family: "ui",
  tone: "default",
} as const satisfies {
  as: TextElement;
  size: TextSize;
  weight: TextWeight;
  family: TextFamily;
  tone: TextTone;
};

export type HeadingStyle = {
  size?: TextSize;
  weight?: TextWeight;
  variant?: TextVariant;
};

export const HEADING: Partial<Record<TextElement, HeadingStyle>> = {
  h1: { size: "xl", weight: "bold" },
  h2: { size: "l", weight: "semibold" },
  h3: { size: "xxs", weight: "bold", variant: "label" },
};
