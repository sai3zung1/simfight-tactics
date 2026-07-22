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
  children?: ReactNode;
};

// Any standard HTML attribute (onClick, id…) passes to the element; our own props win over clashes.
export type ButtonProps<E extends ButtonElement> = ButtonOwnProps<E> &
  Omit<ComponentPropsWithRef<E>, keyof ButtonOwnProps<E>>;

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
  // The fill recipe dresses the <button> box only; an <a> stays bare underlined text.
  const classes = [
    BASE,
    ELEMENT_CLASS[element],
    isButton && VARIANT_CLASS[variant],
    SIZE_FONT_CLASS[size],
    isButton && SIZE_PAD_CLASS[size],
    isButton && RADIUS_CLASS[radius],
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const Ornament = ornament;
  const ornamentNode = Ornament ? (
    <Ornament aria-hidden className={`shrink-0 ${ORNAMENT_SIZE_CLASS[size]}`} />
  ) : null;
  // A <button> defaults to type="button" so it never submits a form by accident; the caller can override.
  const typeProp =
    isButton && !("type" in rest) ? { type: "button" as const } : undefined;
  return (
    <Component className={classes} {...typeProp} {...rest}>
      {ornamentSide === "left" && ornamentNode}
      <span className="translate-y-[1px]">{children}</span>
      {ornamentSide === "right" && ornamentNode}
    </Component>
  );
}
