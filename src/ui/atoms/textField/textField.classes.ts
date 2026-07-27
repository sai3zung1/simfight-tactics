import type { TextFieldVariant } from "./textField.contract";

// All the component's CSS classes live here. The component and the story never write CSS.
// Each element gets one constant for its resting look and one per interactive state.
// The split is for reading only. Which state wins is decided by the selectors, never by
// the order the constants are joined in.

// The element wrapping everything. `group` is what lets the results line and the clear
// button react to the input, since neither of them contains it.
export const SHELL = "group flex w-full flex-col";

// Shown while the input holds text, whatever its state. WHEN_CLEARABLE below adds a
// condition. The test reads the value from the page, so it works the same whether or not
// the caller stores that value itself.
const WHEN_FILLED = "hidden group-has-[input:not(:placeholder-shown)]:flex";

// Like WHEN_FILLED, and the input must also be usable. Both conditions sit in one
// selector, so there is no second rule that could win over this one.
const WHEN_CLEARABLE =
  "hidden group-has-[input:enabled:not(:placeholder-shown)]:flex";

// The icon colour is set here rather than on the icon, so every state keeps it next to the
// background it has to stand out from. Only the icon inherits it: the input and the clear
// button set their own.
const FRAME_REST =
  "flex w-full items-center overflow-hidden rounded-md border-1 border-border bg-border text-ink shadow-sm";

const FRAME_MOTION = "transition duration-[var(--duration-fast)] ease-standard";

// Every selector below names `input`. A bare `:enabled` or `:disabled` would also match
// the clear button, which is a form control too.

// Hover stops applying as soon as the field has focus, so the focus colour stays visible
// while the pointer rests on it.
const FRAME_HOVER =
  "has-[input:enabled]:not-focus-within:hover:border-border-strong has-[input:enabled]:not-focus-within:hover:bg-border-strong";

// These two fill the frame with the accent colour, which runs the opposite way to the other
// backgrounds: dark in the light theme, light in the dark one. The icon flips with it.
const FRAME_FOCUS =
  "focus-within:border-accent focus-within:bg-accent focus-within:text-ink-reverse focus-within:ring-1 focus-within:ring-accent";

const FRAME_ACTIVE =
  "has-[input:enabled]:active:border-accent has-[input:enabled]:active:bg-accent has-[input:enabled]:active:text-ink-reverse";

// `:disabled` never matches a container, so the frame has to read the input's state.
const FRAME_DISABLED =
  "has-[input:disabled]:border-ink-disabled has-[input:disabled]:bg-ink-disabled";

export const FRAME = [
  FRAME_REST,
  FRAME_MOTION,
  FRAME_HOVER,
  FRAME_FOCUS,
  FRAME_ACTIVE,
  FRAME_DISABLED,
].join(" ");

// No colour of its own. It inherits the frame's, which changes with each state.
export const ORNAMENT =
  "flex shrink-0 items-center justify-center self-stretch px-2";

export const ORNAMENT_ICON = "size-[var(--icon-sm)]";

// The input draws no border or corners of its own. The frame around it draws them for the
// icon and the input together.
const FIELD_REST =
  "w-full bg-surface p-1 font-medium text-left text-s text-ink outline-none";

const FIELD_PLACEHOLDER =
  "placeholder:text-center placeholder:font-light placeholder:text-ink-muted";

// Hides the browser's own clear button. CLEAR below replaces it.
const FIELD_NATIVE = "[&::-webkit-search-cancel-button]:hidden";

// A solid colour rather than a see-through one. The frame behind is already filled with
// the same colour, and a tint of it over itself would show no difference.
const FIELD_DISABLED =
  "disabled:cursor-not-allowed disabled:bg-[color-mix(in_srgb,var(--color-ink-disabled)_30%,var(--color-surface))]";

export const FIELD = [
  FIELD_REST,
  FIELD_PLACEHOLDER,
  FIELD_NATIVE,
  FIELD_DISABLED,
].join(" ");

// Carries its own transition. It sits inside the frame but changes colour on its own hover,
// which the frame's transition does not cover.
const CLEAR_REST =
  "shrink-0 cursor-pointer items-center justify-center self-stretch bg-surface px-2 text-accent transition duration-[var(--duration-fast)] ease-standard";

const CLEAR_STATES =
  "hover:text-accent-hover focus-visible:outline-1 focus-visible:[outline-style:solid] focus-visible:outline-accent";

export const CLEAR = [WHEN_CLEARABLE, CLEAR_REST, CLEAR_STATES].join(" ");

export const CLEAR_ICON = "size-[var(--icon-sm)]";

// The component decides where this line sits and when it appears. Its text comes from the
// caller. Baseline alignment keeps the two weights on one line.
export const RESULTS = [
  WHEN_FILLED,
  "items-baseline justify-end gap-1 px-2 py-1 text-s text-ink-muted",
].join(" ");

// Only the count is bold. The label next to it inherits the line and needs no class.
export const RESULTS_COUNT = "font-bold";

export const VARIANT_CLASS = {
  default: "",
} satisfies Record<TextFieldVariant, string>;
