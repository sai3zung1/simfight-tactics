import type { TextFieldVariant } from "./text-field.contract";

export const SHELL = "group flex w-full flex-col";

const WHEN_FILLED = "hidden group-has-[input:not(:placeholder-shown)]:flex";

const WHEN_CLEARABLE =
  "hidden group-has-[input:enabled:not(:placeholder-shown)]:flex";

const FRAME_REST =
  "flex w-full items-center overflow-hidden rounded-md border-1 border-border bg-border text-ink shadow-sm";

const FRAME_MOTION = "transition duration-[var(--duration-fast)] ease-standard";

const FRAME_HOVER =
  "has-[input:enabled]:not-focus-within:hover:border-border-strong has-[input:enabled]:not-focus-within:hover:bg-border-strong";

const FRAME_FOCUS =
  "focus-within:border-accent focus-within:bg-accent focus-within:text-ink-reverse focus-within:ring-1 focus-within:ring-accent";

const FRAME_ACTIVE =
  "has-[input:enabled]:active:border-accent has-[input:enabled]:active:bg-accent has-[input:enabled]:active:text-ink-reverse";

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
  "flex shrink-0 items-center justify-center self-stretch px-2";

export const ORNAMENT_ICON = "size-[var(--icon-sm)]";

const FIELD_REST =
  "w-full bg-surface p-1 font-medium text-left text-s text-ink outline-none";

const FIELD_PLACEHOLDER =
  "placeholder:text-center placeholder:font-light placeholder:text-ink-muted";

// Hides the browser's own clear button on a search input — CLEAR below is the
// one this component draws.
const FIELD_NATIVE = "[&::-webkit-search-cancel-button]:hidden";

const FIELD_DISABLED =
  "disabled:cursor-not-allowed disabled:bg-[color-mix(in_srgb,var(--color-ink-disabled)_30%,var(--color-surface))]";

export const FIELD = [
  FIELD_REST,
  FIELD_PLACEHOLDER,
  FIELD_NATIVE,
  FIELD_DISABLED,
].join(" ");

const CLEAR_REST =
  "shrink-0 cursor-pointer items-center justify-center self-stretch bg-surface px-2 text-accent transition duration-[var(--duration-fast)] ease-standard";

const CLEAR_STATES =
  "hover:text-accent-hover focus-visible:outline-1 focus-visible:[outline-style:solid] focus-visible:outline-accent";

export const CLEAR = [WHEN_CLEARABLE, CLEAR_REST, CLEAR_STATES].join(" ");

export const CLEAR_ICON = "size-[var(--icon-sm)]";

export const RESULTS = [
  WHEN_FILLED,
  "items-baseline justify-end gap-1 px-2 py-1 text-s text-ink-muted",
].join(" ");

export const RESULTS_COUNT = "font-bold";

export const VARIANT_CLASS = {
  default: "",
} satisfies Record<TextFieldVariant, string>;
