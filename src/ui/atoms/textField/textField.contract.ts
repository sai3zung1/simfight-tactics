export const VARIANTS = "default" as const;

export const TEXT_FIELD_ELEMENTS = "input" as const;

export type TextFieldVariant = typeof VARIANTS;
export type TextFieldElement = typeof TEXT_FIELD_ELEMENTS;

export const DEFAULTS = {
  as: "input",
  variant: "default",
} as const satisfies {
  as: TextFieldElement;
  variant: TextFieldVariant;
};
