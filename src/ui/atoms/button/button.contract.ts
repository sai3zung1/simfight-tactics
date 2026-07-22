// The values each option accepts (variants, sizes, radius…). No CSS here.
export const VARIANTS = ["solid", "outline"] as const;

export const SIZES = ["s", "m", "l"] as const;

export const RADIUS = ["sm", "md", "lg", "xl"] as const;

export const BUTTON_ELEMENTS = ["button", "a"] as const;

export const ORNAMENT_SIDE = ["left", "right"] as const;

export type ButtonVariant = (typeof VARIANTS)[number];
export type ButtonSize = (typeof SIZES)[number];
export type ButtonRadius = (typeof RADIUS)[number];
export type ButtonElement = (typeof BUTTON_ELEMENTS)[number];
export type ButtonOrnamentSide = (typeof ORNAMENT_SIDE)[number];

// The value used when the caller passes none.
export const DEFAULTS = {
  as: "button",
  variant: "solid",
  size: "m",
  radius: "xl",
  ornamentSide: "left",
} as const satisfies {
  as: ButtonElement;
  variant: ButtonVariant;
  size: ButtonSize;
  radius: ButtonRadius;
  ornamentSide: ButtonOrnamentSide;
};
