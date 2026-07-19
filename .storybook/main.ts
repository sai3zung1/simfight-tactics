import type { StorybookConfig } from "@storybook/react-vite";

/*
 * Stories sit next to the component they document rather than in a parallel
 * tree: a component and its states move together (ADR 0006).
 *
 * The Vite builder reuses vite.config.ts as-is, so the Tailwind v4 plugin and
 * the token layer it compiles apply here without a second declaration.
 */
const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)", "../src/**/*.mdx"],
  addons: [
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-vitest",
  ],
  framework: "@storybook/react-vite",
};

export default config;
