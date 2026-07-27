import type { Meta, StoryObj } from "@storybook/react-vite";

import { TextField, type TextFieldProps } from "../textField";
import { DEFAULTS } from "../textField.contract";

// No state is faked here. Hover, tab into or type in the field to see the real ones.
// Typing also reveals the clear button and the results line, hidden while it is empty.
const meta = {
  title: "Atoms/TextField",
  component: TextField,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  // What a caller would pass when reusing the component. All of it reaches the page.
  // The panel below only lists the ones whose effect can be seen while changing them.
  args: {
    as: DEFAULTS.as,
    variant: DEFAULTS.variant,
    type: "search",
    name: "catalog-search",
    placeholder: "Search",
    "aria-label": "Search the catalog",
    // Counting belongs to whatever uses the field. These are stand-in values, so the line
    // has something to show once the field is filled.
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
    // Hidden from the panel but still applied above. Each accepts a single value, or is
    // set once when reusing the component, so there is nothing to try out here.
    // Removing them instead would make the panel guess a control and show a broken one.
    as: { table: { disable: true } },
    variant: { table: { disable: true } },
    type: { table: { disable: true } },
    // Identifies the field for browser autofill. It comes from the caller, because a name
    // fixed inside the component would repeat as soon as two fields share a page.
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

// The value is set through the page rather than held by this story, on purpose. The clear
// button has to work either way.
export const Filled: Story = {
  args: {
    defaultValue: "Ezreal",
  },
};
