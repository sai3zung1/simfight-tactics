/// <reference types="vitest/config" />
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

// The package is ESM-only, so `__dirname` never exists here.
const dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  /*
   * Stories double as the accessibility suite: the Storybook plugin turns each
   * one into a Vitest case, run in a real browser so axe-core reads computed
   * styles, contrast and focus order rather than a synthetic DOM — the
   * continuous check ADR 0006 rests on.
   *
   * Two runners coexist without overlapping: cases here come from
   * `*.stories.tsx`, while `bun test` owns `*.test.ts` (domain and engine).
   */
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          storybookTest({ configDir: path.join(dirname, ".storybook") }),
        ],

        /*
         * The testing-library chain the Storybook setup file pulls in still has
         * CommonJS-only leaves. Browser mode discovers dependencies from the
         * source graph, and nothing in `src/` imports these, so they reach the
         * browser unbundled — where a CJS file exposes none of the named
         * exports its importer expects and the whole suite fails at import.
         * Listing them forces the pre-bundle that converts them.
         */
        optimizeDeps: {
          include: [
            "storybook/test",
            "@testing-library/dom",
            "@testing-library/jest-dom",
            "@testing-library/user-event",
          ],
        },

        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
