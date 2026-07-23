// Picks the CSS classes for the chosen values and renders the element. No styling decisions here.
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
  // as picks the HTML element, so the caller can pass its attributes: href for <a>, type for <button>.
  as?: E;
  variant?: ButtonVariant;
  size?: ButtonSize;
  radius?: ButtonRadius;
  ornament?: LucideIcon;
  ornamentSide?: ButtonOrnamentSide;

  className?: string;
};

// A visible label, or — with none (ornament-only) — an accessible name is required at the type level.
type LabelledContent =
  | { children: ReactNode }
  | { children?: undefined; "aria-label": string }
  | { children?: undefined; "aria-labelledby": string };

// Any standard HTML attribute (onClick, id…) passes to the element; our own props win over clashes.
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
  // The fill recipe dresses the <button> box only; an <a> stays bare underlined text.
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
  const content = children ? (
    <span className="translate-y-[1px]">{children}</span>
  ) : null;
  // A <button> defaults to type="button" so it never submits a form by accident; the caller can override.
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
