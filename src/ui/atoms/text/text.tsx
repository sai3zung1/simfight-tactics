import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import {
  FAMILY_CLASS,
  KEYWORD_CLASS,
  SIZE_CLASS,
  TONE_CLASS,
  VARIANT_CLASS,
  WEIGHT_CLASS,
} from "./text.classes";
import {
  DEFAULTS,
  HEADING,
  type TextElement,
  type TextFamily,
  type TextKeyword,
  type TextSize,
  type TextTone,
  type TextVariant,
  type TextWeight,
} from "./text.contract";

export type {
  TextElement,
  TextFamily,
  TextKeyword,
  TextSize,
  TextTone,
  TextVariant,
  TextWeight,
};

type Colouring =
  | { tone?: TextTone; keyword?: never }
  | { tone?: never; keyword: TextKeyword };

type TextOwnProps = {
  as?: TextElement;
  size?: TextSize;
  weight?: TextWeight;
  family?: TextFamily;
  variant?: TextVariant;
  className?: string;
  children?: ReactNode;
};

export type TextProps<E extends TextElement> = TextOwnProps &
  Colouring &
  Omit<ComponentPropsWithoutRef<E>, keyof TextOwnProps | keyof Colouring>;

export function Text<E extends TextElement = "p">({
  as,
  size,
  weight,
  family = DEFAULTS.family,
  variant,
  tone,
  keyword,
  className,
  children,
  ...rest
}: TextProps<E>) {
  const element = as ?? DEFAULTS.as;
  const heading = HEADING[element];
  const Component = element as ElementType;
  const resolvedVariant = variant ?? heading?.variant;

  const colour = keyword
    ? KEYWORD_CLASS[keyword]
    : TONE_CLASS[tone ?? DEFAULTS.tone];

  const classes = [
    FAMILY_CLASS[family],
    SIZE_CLASS[size ?? heading?.size ?? DEFAULTS.size],
    WEIGHT_CLASS[weight ?? heading?.weight ?? DEFAULTS.weight],
    resolvedVariant && VARIANT_CLASS[resolvedVariant],
    colour,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component className={classes} {...rest}>
      {children}
    </Component>
  );
}
