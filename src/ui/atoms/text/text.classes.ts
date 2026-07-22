import type {
  TextFamily,
  TextKeyword,
  TextSize,
  TextTone,
  TextVariant,
  TextWeight,
} from "./text.contract";

// Every CSS class Text uses, one per value. The component never writes CSS.
// satisfies rejects a missing or extra class; token classes only.
export const SIZE_CLASS = {
  xxs: "text-xxs",
  xs: "text-xs",
  s: "text-s",
  m: "text-m",
  l: "text-l",
  xl: "text-xl",
} satisfies Record<TextSize, string>;

export const WEIGHT_CLASS = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
} satisfies Record<TextWeight, string>;

export const FAMILY_CLASS = {
  ui: "font-ui",
  display: "font-display",
  numeric: "font-numeric",
} satisfies Record<TextFamily, string>;

export const VARIANT_CLASS = {
  label: "tracking-label uppercase",
} satisfies Record<TextVariant, string>;

export const TONE_CLASS = {
  default: "text-ink",
  muted: "text-ink-muted",
  disabled: "text-ink-disabled",
} satisfies Record<TextTone, string>;

export const KEYWORD_CLASS = {
  hp: "text-heal",
  attackDamage: "text-physical-damage",
  abilityPower: "text-magic-damage",
  armor: "text-armor",
  magicResist: "text-mr",
  durability: "text-durability",
  attackSpeed: "text-as",
  critChance: "text-crit-chance",
  critDamage: "text-crit-damage",
  damageAmp: "text-damage-amp",
  range: "text-hex",
  mana: "text-mana",
  physicalDamage: "text-physical-damage",
  magicDamage: "text-magic-damage",
  trueDamage: "text-true-damage",
  heal: "text-heal",
  shield: "text-shield",
  crowdControl: "text-cc",
  omnivamp: "text-omnivamp",
  bonus: "text-bonus",
} satisfies Record<TextKeyword, string>;
