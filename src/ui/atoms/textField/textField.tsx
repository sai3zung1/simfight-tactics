import { useRef } from "react";
import type { ComponentPropsWithRef, ElementType, ReactNode } from "react";

import { Search, X } from "lucide-react";

import {
  CLEAR,
  CLEAR_ICON,
  FIELD,
  FRAME,
  ORNAMENT,
  ORNAMENT_ICON,
  RESULTS,
  RESULTS_COUNT,
  SHELL,
  VARIANT_CLASS,
} from "./textField.classes";
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
  resultCount?: ReactNode;
  resultLabel?: ReactNode;
  onClear?: () => void;
  clearLabel?: string;
};

export type TextFieldProps = TextFieldOwnProps &
  Omit<
    ComponentPropsWithRef<TextFieldElement>,
    keyof TextFieldOwnProps | "placeholder"
  > & {
    placeholder: string;
  };

export function TextField({
  as,
  variant = DEFAULTS.variant,
  className,
  resultCount,
  resultLabel,
  onClear,
  clearLabel = "Clear search",
  ref,
  ...rest
}: TextFieldProps) {
  const Component = (as ?? DEFAULTS.as) as ElementType;
  const inputRef = useRef<HTMLInputElement | null>(null);

  const attachInput = (node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const clear = () => {
    const input = inputRef.current;
    if (!input) return;
    const setValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    setValue?.call(input, "");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
    onClear?.();
  };

  return (
    <search className={[SHELL, className].filter(Boolean).join(" ")}>
      <div
        className={[FRAME, VARIANT_CLASS[variant]].filter(Boolean).join(" ")}
      >
        <span className={ORNAMENT} aria-hidden>
          <Search className={ORNAMENT_ICON} />
        </span>
        <Component ref={attachInput} className={FIELD} {...rest} />
        <button
          type="button"
          className={CLEAR}
          onClick={clear}
          aria-label={clearLabel}
        >
          <X className={CLEAR_ICON} aria-hidden />
        </button>
      </div>
      {(resultCount !== undefined || resultLabel !== undefined) && (
        <div className={RESULTS}>
          <span className={RESULTS_COUNT}>{resultCount}</span>
          <span>{resultLabel}</span>
        </div>
      )}
    </search>
  );
}
