// Picks the CSS classes for the chosen options and renders the elements. No styling decisions here.
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
  // The two halves of the line under the field. They are separate because only the count
  // changes while the label stays put. The caller supplies both.
  resultCount?: ReactNode;
  resultLabel?: ReactNode;
  onClear?: () => void;
  clearLabel?: string;
};

// Any standard input attribute (value, onChange, disabled, id) passes straight to the
// input. The props above win when a name clashes. The field shows no label of its own,
// so the caller has to name it.
export type TextFieldProps = TextFieldOwnProps &
  Omit<
    ComponentPropsWithRef<TextFieldElement>,
    keyof TextFieldOwnProps | "placeholder"
  > & {
    // Required. The CSS tells a filled field from an empty one by asking whether the
    // placeholder is showing, which needs the attribute to be there.
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

  // Keeps a handle on the input without dropping a ref the caller passed.
  const attachInput = (node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const clear = () => {
    const input = inputRef.current;
    if (!input) return;
    // React replaces the value setter on the element, so `input.value = ""` changes
    // nothing React can see and fires no event. Calling the original setter and sending
    // an input event reproduces a keystroke instead, which every caller already handles.
    const setValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    setValue?.call(input, "");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
    onClear?.();
  };

  // <search> marks this area as the page's search for screen readers. Nothing here is
  // submitted, so it carries no form.
  // className goes on the outer element, the one that takes up room in a layout.
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
