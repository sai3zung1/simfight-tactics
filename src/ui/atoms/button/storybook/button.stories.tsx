import { Loader, RefreshCw, Sparkles, Swords } from "lucide-react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button, type ButtonProps } from "../button";
import {
  BUTTON_ELEMENTS,
  DEFAULTS,
  ORNAMENT_SIDE,
  RADIUS,
  SIZES,
  VARIANTS,
} from "../button.contract";

// Icons the workshop's ornament picker offers. Workshop-only — the component prop takes a LucideIcon.
const ORNAMENT_ICONS = { Loader, RefreshCw, Swords, Sparkles } as const;
type OrnamentIcon = keyof typeof ORNAMENT_ICONS;

// Ornament controls live only on this page, never on the component. Interactive states aren't forced —
// hover, tab or click the button in the canvas to see its real :hover/:focus-visible/:active.
type StoryArgs = (ButtonProps<"button"> | ButtonProps<"a">) & {
  withOrnament?: boolean;
  ornamentIcon?: OrnamentIcon;
};

const meta = {
  title: "Atoms/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    as: DEFAULTS.as,
    children: "Reroll",
  },
  // The workshop-only ornament controls map to the real LucideIcon prop; everything else passes straight through.
  render: ({ withOrnament, ornamentIcon, ...args }) => (
    <Button
      {...args}
      ornament={
        withOrnament ? ORNAMENT_ICONS[ornamentIcon ?? "Loader"] : undefined
      }
    />
  ),
  argTypes: {
    variant: {
      description:
        'Per-variant recipe for the button box — `solid`: accent fill, 2px border; `outline`: surface fill, 1px border, lighter states. Ignored when `as="a"`.',
      control: "select",
      options: [...VARIANTS],
      if: { arg: "as", eq: "button" },
      table: {
        type: { summary: "ButtonVariant" },
        defaultValue: { summary: DEFAULTS.variant },
      },
    },
    size: {
      description: "Step on the button's size ramp.",
      control: "select",
      options: [...SIZES],
      table: {
        type: { summary: "ButtonSize" },
        defaultValue: { summary: DEFAULTS.size },
      },
    },
    radius: {
      description: "Corner rounding, read from the --radius-* token scale.",
      control: "select",
      options: [...RADIUS],
      if: { arg: "as", eq: "button" },
      table: {
        type: { summary: "ButtonRadius" },
        defaultValue: { summary: DEFAULTS.radius },
      },
    },
    as: {
      description:
        "Rendered element. `button` for an action; `a` renders as an underlined text link (no box) for navigation.",
      control: "select",
      options: [...BUTTON_ELEMENTS],
      table: {
        type: { summary: "ButtonElement" },
        defaultValue: { summary: DEFAULTS.as },
      },
    },
    children: {
      description: "Button label.",
      control: "text",
      table: { type: { summary: "ReactNode" } },
    },
    className: {
      description:
        "Layout adjustments only. Off-system utilities do not compile against the token layer.",
      control: "text",
      table: { type: { summary: "string" } },
    },
    href: {
      description: 'Destination when rendered as <a>. Only with as="a".',
      control: "text",
      if: { arg: "as", eq: "a" },
      table: { type: { summary: "string" } },
    },
    ornamentSide: {
      description:
        "Which side the ornament sits on. Shown only when an ornament is present.",
      control: "select",
      options: [...ORNAMENT_SIDE],
      if: { arg: "withOrnament", truthy: true },
      table: {
        type: { summary: "ButtonOrnamentSide" },
        defaultValue: { summary: DEFAULTS.ornamentSide },
      },
    },
    withOrnament: {
      description:
        "Preview only — the gate: whether the ornament slot is filled at all. Not a component prop.",
      control: "boolean",
      table: { category: "Workshop" },
    },
    ornamentIcon: {
      description:
        "Preview only — which Lucide icon fills the slot, once enabled. Not a component prop.",
      control: "select",
      options: Object.keys(ORNAMENT_ICONS),
      if: { arg: "withOrnament", truthy: true },
      table: { category: "Workshop" },
    },
    // The auto-inferred object control for `ornament` is dead (render overrides it) and can't take a component — hide it.
    ornament: {
      control: false,
      table: { disable: true },
    },
    disabled: {
      description: "Renders the button in its disabled state.",
      control: "boolean",
      if: { arg: "as", eq: "button" },
      table: { category: "Workshop" },
    },
  },
} satisfies Meta<StoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const S: Story = {
  args: {
    variant: "solid",
    size: "s",
  },
};

export const M: Story = {
  args: {
    variant: "solid",
    size: "m",
  },
};

export const L: Story = {
  args: {
    variant: "solid",
    size: "l",
  },
};

export const Disabled: Story = {
  args: {
    variant: "solid",
    disabled: true,
  },
};

export const Ornament: Story = {
  args: {
    variant: "solid",
    children: "Loading...",
    withOrnament: true,
  },
};

export const OrnamentOnly: Story = {
  args: {
    variant: "solid",
    children: undefined,
    withOrnament: true,
    radius: "full",
    "aria-label": "Reroll",
  },
};
