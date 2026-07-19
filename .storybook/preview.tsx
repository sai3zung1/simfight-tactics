import type { Preview } from "@storybook/react-vite";

/*
 * The token layer (#77) is the only stylesheet the workshop loads. Importing it
 * here is what makes a story fail visibly when a component reaches for a value
 * outside the system — the `initial` resets in main.css mean an off-system
 * utility never compiles in the first place.
 */
import "../src/main.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    /*
     * `todo` reports axe violations without failing a run. It moves to `error`
     * once the first atoms land, so the accessibility commitments ADR 0006
     * rests on are enforced rather than merely observed.
     */
    a11y: {
      test: "todo",
    },
  },
};

export default preview;
