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
