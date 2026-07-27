import type { TextFieldVariant } from "./textField.contract";

// All the component's CSS classes live here. The component and the story never write CSS.
// Each element is split into its rest appearance plus one constant per interactive state.
// Splitting is for reading only: Tailwind orders its own output, so which state wins is
// decided by the selectors below, never by the order they are joined in.

// The outer container: the search landmark, stacking the box over the results line.
// `group` publishes "the field has content" to both of them — neither can read the input
// on its own, one being its cousin and the other its nephew.
export const SHELL = "group flex w-full flex-col";

// Shown only once the field holds something. Reading it off :placeholder-shown means the
// DOM value decides, so this behaves the same whether the caller controls the input or not.
const WHEN_FILLED = "hidden group-has-[input:not(:placeholder-shown)]:flex";

// The clear button also stands down on a disabled field. Both conditions sit in one selector
// rather than a show rule and a hide rule, which would tie on specificity.
const WHEN_CLEARABLE =
  "hidden group-has-[input:enabled:not(:placeholder-shown)]:flex";

const FRAME_REST =
  "flex w-full items-center overflow-hidden rounded-md border-1 border-border bg-border shadow-sm";

const FRAME_MOTION = "transition duration-[var(--duration-fast)] ease-standard";

// Every state selector names `input` explicitly. Bare :enabled / :disabled would also match
// the clear button, so a disabled field with an enabled button still counted as enabled.
// Gated on not-focus-within: :has() lends the frame its argument's specificity, which would
// otherwise rank hover above focus and let a resting pointer wipe out the focus colour.
const FRAME_HOVER =
  "has-[input:enabled]:not-focus-within:hover:border-border-strong has-[input:enabled]:not-focus-within:hover:bg-border-strong";

const FRAME_FOCUS =
  "focus-within:border-accent focus-within:bg-accent focus-within:ring-1 focus-within:ring-accent";

const FRAME_ACTIVE =
  "has-[input:enabled]:active:border-accent has-[input:enabled]:active:bg-accent";

// Read through :has(), because :disabled only ever matches a form control, never a container.
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

export const ORNAMENT =
  "flex shrink-0 items-center justify-center self-stretch px-2 text-ink-reverse";

export const ORNAMENT_ICON = "size-[var(--icon-sm)]";

const FIELD_REST =
  "w-full bg-surface p-1 font-medium text-left text-s text-ink outline-none";

const FIELD_PLACEHOLDER =
  "placeholder:text-center placeholder:font-light placeholder:text-ink-muted";

// The native search clear button is hidden: CLEAR below draws our own.
const FIELD_NATIVE = "[&::-webkit-search-cancel-button]:hidden";

// An opaque colour, not ink-disabled/30: the frame under the field is already painted in
// ink-disabled, and a tint of a colour over that same colour cannot change anything.
const FIELD_DISABLED =
  "disabled:cursor-not-allowed disabled:bg-[color-mix(in_srgb,var(--color-ink-disabled)_30%,var(--color-surface))]";

export const FIELD = [
  FIELD_REST,
  FIELD_PLACEHOLDER,
  FIELD_NATIVE,
  FIELD_DISABLED,
].join(" ");

const CLEAR_REST =
  "shrink-0 cursor-pointer items-center justify-center self-stretch bg-surface px-2 text-accent";

const CLEAR_STATES =
  "hover:text-accent-hover focus-visible:outline-1 focus-visible:[outline-style:solid] focus-visible:outline-accent";

export const CLEAR = [WHEN_CLEARABLE, CLEAR_REST, CLEAR_STATES].join(" ");

export const CLEAR_ICON = "size-[var(--icon-sm)]";

// The atom owns where this sits and when it appears; the caller owns what it says.
// items-baseline, because the count and its label carry different weights and would
// otherwise sit on two different lines of their own.
export const RESULTS = [
  WHEN_FILLED,
  "items-baseline justify-end gap-1 px-2 py-1 text-s text-ink-muted",
].join(" ");

// The count is its own element because it is the only part that changes. The label next to
// it inherits the row's type and needs no class of its own — which is also what keeps the
// weight from having to be forced over anything.
export const RESULTS_COUNT = "font-bold";

export const VARIANT_CLASS = {
  default: "",
} satisfies Record<TextFieldVariant, string>;
