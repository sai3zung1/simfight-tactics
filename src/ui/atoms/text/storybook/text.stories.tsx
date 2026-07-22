import type { Meta, StoryObj } from "@storybook/react-vite";

import { Text } from "../text";
import {
  DEFAULTS,
  FAMILIES,
  KEYWORDS,
  SIZES,
  TEXT_ELEMENTS,
  TONES,
  VARIANTS,
  WEIGHTS,
} from "../text.contract";

// The Storybook page: live preview + controls. Documentation, not part of the component.
const meta = {
  title: "Atoms/Text",
  component: Text,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    children: "Ezreal casts Mystic Shot for 240 magic damage.",
  },
  argTypes: {
    size: {
      description:
        "Step on the type ramp. Reading text takes `s`, result values take `m`.",
      control: "select",
      options: [...SIZES],
      table: {
        type: { summary: "TextSize" },
        defaultValue: { summary: DEFAULTS.size },
      },
    },
    weight: {
      description:
        "Font weight. Body text runs medium because the UI family is light.",
      control: "select",
      options: [...WEIGHTS],
      table: {
        type: { summary: "TextWeight" },
        defaultValue: { summary: DEFAULTS.weight },
      },
    },
    family: {
      description:
        "Type family by role. `numeric` is the tabular family for data.",
      control: "select",
      options: [...FAMILIES],
      table: {
        type: { summary: "TextFamily" },
        defaultValue: { summary: DEFAULTS.family },
      },
    },
    variant: {
      description:
        "Composite style the poster names. `label` tracks and uppercases; absent means plain prose.",
      control: "select",
      options: [...VARIANTS],
      table: { type: { summary: "TextVariant" } },
    },
    tone: {
      description:
        "Ink level from the neutral frame. Mutually exclusive with keyword.",
      control: "select",
      options: [...TONES],
      table: {
        type: { summary: "TextTone" },
        defaultValue: { summary: DEFAULTS.tone },
      },
    },
    keyword: {
      description:
        "Game-palette hue for a stat name or an effect keyword. Mutually exclusive with tone. Colour reinforces a word that already carries the meaning — never the sole carrier (WCAG 1.4.1).",
      control: "select",
      options: [...KEYWORDS],
      table: { type: { summary: "TextKeyword" } },
    },
    as: {
      description:
        "Rendered element. Poster-named elements propose their style; an explicit prop overrides, so the outline never dictates the visual.",
      control: "select",
      options: [...TEXT_ELEMENTS],
      table: {
        type: { summary: "TextElement" },
        defaultValue: { summary: DEFAULTS.as },
      },
    },
    children: {
      description: "Text content.",
      control: "text",
      table: { type: { summary: "ReactNode" } },
    },
    className: {
      description:
        "Layout adjustments only. Off-system utilities do not compile against the token layer.",
      control: "text",
      table: { type: { summary: "string" } },
    },
  },
} satisfies Meta<typeof Text>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
