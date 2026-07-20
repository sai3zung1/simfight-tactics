import { useEffect } from "react";
import type { Preview } from "@storybook/react-vite";

/*
 * The product's own token layer (#77), loaded unmodified: a component is
 * inspected against the same values it will ship with, and an off-palette
 * colour or an unlisted size fails to compile here exactly as it would there.
 *
 * The second sheet belongs to the workshop alone and never reaches the bundle.
 */
import "../src/styles/main.css";
import "./preview.css";

const preview: Preview = {
  /*
   * Theme is a global, not a story arg: it describes the environment a
   * component is inspected in rather than the component. Every story inherits
   * the toolbar switch without declaring it.
   */
  globalTypes: {
    theme: {
      description: "Token theme",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },

  initialGlobals: {
    theme: "light",
  },

  decorators: [
    /*
     * Dark rides an attribute on the document element, so the switch sets it
     * there rather than wrapping the story: `color-scheme` on that element is
     * what repaints the canvas behind the component, and a wrapper would leave
     * it light while claiming otherwise.
     */
    (Story, context) => {
      const { theme } = context.globals;

      useEffect(() => {
        document.documentElement.dataset.theme = theme;
      }, [theme]);

      return <Story />;
    },
  ],

  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    /*
     * Enforced from the first atom on: an axe violation now fails the story run,
     * so the accessibility commitments ADR 0006 rests on are checked while a
     * component is being written rather than at review time.
     */
    a11y: {
      test: "error",
    },
  },
};

export default preview;
