import type { ComponentPropsWithRef, ElementType, ReactNode } from "react";

import type { LucideIcon } from "lucide-react";

import {
  BASE,
  ELEMENT_CLASS,
  RADIUS_CLASS,
  SIZE_FONT_CLASS,
  SIZE_PAD_CLASS,
  VARIANT_CLASS,
  ORNAMENT_SIZE_CLASS,
  SIZE_ORNAMENT_ONLY_PAD_CLASS,
} from "./button.classes";
import {
  DEFAULTS,
  type ButtonElement,
  type ButtonRadius,
  type ButtonSize,
  type ButtonVariant,
  type ButtonOrnamentSide,
} from "./button.contract";

export type {
  ButtonElement,
  ButtonRadius,
  ButtonSize,
  ButtonVariant,
  ButtonOrnamentSide,
};

type ButtonOwnProps<E extends ButtonElement> = {
  as?: E;
  variant?: ButtonVariant;
  size?: ButtonSize;
  radius?: ButtonRadius;
  ornament?: LucideIcon;
  ornamentSide?: ButtonOrnamentSide;

  className?: string;
};

type LabelledContent =
  | { children: ReactNode }
  | { children?: undefined; "aria-label": string }
  | { children?: undefined; "aria-labelledby": string };

export type ButtonProps<E extends ButtonElement> = ButtonOwnProps<E> &
  LabelledContent &
  Omit<
    ComponentPropsWithRef<E>,
    keyof ButtonOwnProps<E> | "children" | "aria-label" | "aria-labelledby"
  >;

export function Button<E extends ButtonElement = "button">({
  as,
  variant = DEFAULTS.variant,
  size = DEFAULTS.size,
  radius = DEFAULTS.radius,
  className,
  children,
  ornament,
  ornamentSide = DEFAULTS.ornamentSide,
  ...rest
}: ButtonProps<E>) {
  const element = as ?? DEFAULTS.as;
  const isButton = element === "button";
  const Component = element as ElementType;
  const isOrnamentOnly = !!ornament && !children;
  const classes = [
    BASE,
    ELEMENT_CLASS[element],
    isButton && VARIANT_CLASS[variant],
    SIZE_FONT_CLASS[size],
    isButton &&
      (isOrnamentOnly
        ? SIZE_ORNAMENT_ONLY_PAD_CLASS[size]
        : SIZE_PAD_CLASS[size]),
    isButton && RADIUS_CLASS[radius],
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const Ornament = ornament;
  const ornamentNode = Ornament ? (
    <Ornament aria-hidden className={`shrink-0 ${ORNAMENT_SIZE_CLASS[size]}`} />
  ) : null;
  // Josefin Sans renders a touch high in its own box; the nudge re-centres
  // the label against it.
  const content = children ? (
    <span className="translate-y-[1px]">{children}</span>
  ) : null;
  // A <button> with no type submits its parent form; default it away unless
  // the caller asked for something else.
  const typeProp =
    isButton && !("type" in rest) ? { type: "button" as const } : undefined;
  return (
    <Component className={classes} {...typeProp} {...rest}>
      {ornamentSide === "left" && ornamentNode}
      {content}
      {ornamentSide === "right" && ornamentNode}
    </Component>
  );
}
