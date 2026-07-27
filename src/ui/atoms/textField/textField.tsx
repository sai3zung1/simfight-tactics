// Picks the CSS classes for the chosen values and renders the element. No styling decisions here.
import type { ComponentPropsWithRef, ElementType } from "react";

import { BASE, VARIANT_CLASS } from "./textField.classes";
import {
  DEFAULTS,
  type TextFieldElement,
  type TextFieldVariant,
} from "./textField.contract";

export type { TextFieldElement, TextFieldVariant };

type TextFieldOwnProps = {
  as?: TextFieldElement;
  variant?: TextFieldVariant;
  className?: string;
};

// Any standard input attribute (value, onChange, placeholder, disabled, id…) passes
// straight to the element; the component's own props win over clashes. The field
// carries no label of its own — naming it is the caller's job.
export type TextFieldProps = TextFieldOwnProps &
  Omit<ComponentPropsWithRef<TextFieldElement>, keyof TextFieldOwnProps>;

export function TextField({
  as,
  variant = DEFAULTS.variant,
  className,
  ...rest
}: TextFieldProps) {
  const Component = (as ?? DEFAULTS.as) as ElementType;
  const classes = [BASE, VARIANT_CLASS[variant], className]
    .filter(Boolean)
    .join(" ");
  return <Component className={classes} {...rest} />;
}
