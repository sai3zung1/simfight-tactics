import type { Meta, StoryObj } from "@storybook/react-vite";

import { TextField, type TextFieldProps } from "../textField";
import { DEFAULTS } from "../textField.contract";

// Interactive states aren't forced — hover, tab into or type in the field in the
// canvas to see its real :hover/:focus-within/:disabled. Typing also reveals the
// clear button and the results line, which the empty field keeps hidden.
const meta = {
  title: "Atoms/TextField",
  component: TextField,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  // What a caller passes at reuse. All of it reaches the DOM; the panel below only
  // keeps the ones a reader can watch change.
  args: {
    as: DEFAULTS.as,
    variant: DEFAULTS.variant,
    type: "search",
    name: "catalog-search",
    placeholder: "Search",
    "aria-label": "Search the catalog",
    // Caller-owned content. Counting is the catalog's job, not the field's — the workshop
    // just shows a plausible line so the slot is visible once the field fills.
    resultCount: "1",
    resultLabel: "result(s)",
  },
  argTypes: {
    resultCount: {
      description:
        "The changing half of the results line, set in bold. The caller counts.",
      control: "text",
      table: { type: { summary: "ReactNode" } },
    },
    resultLabel: {
      description: "The fixed half beside the count. The caller words it.",
      control: "text",
      table: { type: { summary: "ReactNode" } },
    },
    placeholder: {
      description:
        "Hint shown while the field is empty. Never a substitute for a label.",
      control: "text",
      table: { type: { summary: "string" } },
    },
    disabled: {
      description: "Renders the field in its disabled state.",
      control: "boolean",
      table: { category: "Workshop" },
    },
    // Applied above, hidden here — not absent. A single-value contract offers nothing
    // to pick, and naming the field is the caller's job, not a knob to turn. Leaving
    // them out entirely is what hands the panel a guessed "Set object" control.
    as: { table: { disable: true } },
    variant: { table: { disable: true } },
    type: { table: { disable: true } },
    // Identifies the field for autofill and for a <label for>. Caller-owned: hardcoding
    // one inside the atom would collide the moment two fields share a page.
    name: { table: { disable: true } },
    "aria-label": { table: { disable: true } },
    className: { table: { disable: true } },
  },
} satisfies Meta<TextFieldProps>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

// Uncontrolled on purpose: the clear button has to work without the caller holding state,
// which is the case the naive input.value = "" would silently break.
export const Filled: Story = {
  args: {
    defaultValue: "Ezreal",
  },
};
