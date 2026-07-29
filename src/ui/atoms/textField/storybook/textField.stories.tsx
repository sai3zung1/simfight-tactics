import type { Meta, StoryObj } from "@storybook/react-vite";

import { TextField, type TextFieldProps } from "../textField";
import { DEFAULTS } from "../textField.contract";

const meta = {
  title: "Atoms/TextField",
  component: TextField,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    as: DEFAULTS.as,
    variant: DEFAULTS.variant,
    type: "search",
    name: "catalog-search",
    placeholder: "Search",
    "aria-label": "Search the catalog",
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
    as: { table: { disable: true } },
    variant: { table: { disable: true } },
    type: { table: { disable: true } },
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

export const Filled: Story = {
  args: {
    defaultValue: "Ezreal",
  },
};
