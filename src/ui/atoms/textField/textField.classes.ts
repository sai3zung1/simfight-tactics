import type { TextFieldVariant } from "./textField.contract";

// All the component's CSS classes live here. The component and the story never write CSS.

// On every instance, whatever the options — box, border, shared hover/focus, motion.
// Per-variant differences go in VARIANT_CLASS below.
export const BASE =
  "shadow-sm w-full p-1 border-1 rounded-br-md rounded-tr-md border-border-strong text-left text-ink text-s placeholder:text-disabled placeholder:text-center [&::-webkit-search-cancel-button]:hidden";

// One class per value. `satisfies` makes TypeScript reject a missing or extra one.
// Only design-token classes work; an invented one (bg-red-500) produces nothing.
export const VARIANT_CLASS = {
  default: "",
} satisfies Record<TextFieldVariant, string>;
