import type {
  ButtonElement,
  ButtonRadius,
  ButtonSize,
  ButtonVariant,
} from "./button.contract";

// Every CSS class the button uses. The component and the story never write CSS.

// Shared by every element: layout and cursor. Focus and motion are element-owned (see ELEMENT_CLASS).
export const BASE = "inline-flex items-center gap-x-2 cursor-pointer";

// What each element wears on its own: <button> a full box (chrome, motion, focus ring + glow), <a> bare underlined text.
export const ELEMENT_CLASS = {
  button:
    "border-2 border-border-strong shadow-sm transition duration-[var(--duration-fast)] ease-standard enabled:hover:bg-accent-hover enabled:active:bg-focus/80 disabled:cursor-not-allowed disabled:bg-ink-disabled disabled:text-ink disabled:border-ink focus-visible:outline-[var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-accent focus-visible:shadow-focus",
  // <a>: bare underlined link. Focus glow hugs the text via text-shadow (not a box); outline-none drops the UA ring.
  a: "underline text-ink hover:text-accent-hover active:text-focus/80 focus-visible:outline-none focus-visible:[text-shadow:var(--focus-underline-glow)]",
} satisfies Record<ButtonElement, string>;

// Fill recipe for the <button> box; an <a> ignores it. One class per value; satisfies rejects a mismatch.
export const VARIANT_CLASS = {
  solid: "bg-accent text-ink-reverse",
  outline:
    "text-ink enabled:hover:text-ink-reverse enabled:active:text-ink-reverse",
} satisfies Record<ButtonVariant, string>;

// Type scale — shared by <button> and <a>.
export const SIZE_FONT_CLASS = {
  s: "text-s",
  m: "text-m",
  l: "text-l",
} satisfies Record<ButtonSize, string>;

// Box padding — the <button> box only; an <a> sits flush with none.
export const SIZE_PAD_CLASS = {
  s: "py-1 px-4",
  m: "py-2 px-6",
  l: "py-2 px-8",
} satisfies Record<ButtonSize, string>;

export const RADIUS_CLASS = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
} satisfies Record<ButtonRadius, string>;

export const ORNAMENT_SIZE_CLASS = {
  s: "size-[var(--icon-sm)]", // 16px
  m: "size-[var(--icon-md)]", // 20px
  l: "size-[var(--icon-lg)]", // 24px
} satisfies Record<ButtonSize, string>;
