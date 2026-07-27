// Picks the CSS classes for the chosen values and renders the element. No styling decisions here.
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
  // Sits under the field and appears with the first character typed. The atom owns where it
  // goes and when it shows; what it says — a count, a hint — belongs to the caller.
  results?: ReactNode;
  onClear?: () => void;
  clearLabel?: string;
};

// Any standard input attribute (value, onChange, disabled, id…) passes straight to the
// element; the component's own props win over clashes. The field carries no label of its
// own — naming it is the caller's job.
export type TextFieldProps = TextFieldOwnProps &
  Omit<
    ComponentPropsWithRef<TextFieldElement>,
    keyof TextFieldOwnProps | "placeholder"
  > & {
    // Required, and not merely for looks: the filled state is read off :placeholder-shown,
    // which needs the attribute to exist. Without it an empty field reports as filled.
    placeholder: string;
  };

export function TextField({
  as,
  variant = DEFAULTS.variant,
  className,
  results,
  onClear,
  clearLabel = "Clear search",
  ref,
  ...rest
}: TextFieldProps) {
  const Component = (as ?? DEFAULTS.as) as ElementType;
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Keeps our own handle on the input without stealing the caller's ref.
  const attachInput = (node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const clear = () => {
    const input = inputRef.current;
    if (!input) return;
    // React swaps in its own value setter on the node, so assigning input.value leaves its
    // bookkeeping stale and raises no event. Calling the prototype setter and dispatching
    // input reproduces a keystroke, which a controlled caller hears like any other edit.
    const setValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    setValue?.call(input, "");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
    onClear?.();
  };

  // <search> is the search landmark; unlike <form> it carries no submission behaviour.
  // className lands here rather than on the box: this is what occupies space in a layout,
  // and "layout adjustments only" is what the prop is for.
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
      {results !== undefined && <strong className={RESULTS}>{results}</strong>}
    </search>
  );
}
