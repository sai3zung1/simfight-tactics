import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import css from "@eslint/css";
import storybook from "eslint-plugin-storybook";
import { tailwind4 } from "tailwind-csstree";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";

export default defineConfig([
  {
    ignores: [
      "**/.obsidian/",
      "**/dist/",
      "**/node_modules/",
      "**/.bun-cache/",
      "**/build/",
      "**/storybook-static/",
    ],
  },

  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js },
    extends: [js.configs.recommended],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  ...tseslint.configs.recommended,

  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ...pluginReact.configs.flat.recommended,
    rules: {
      "react/react-in-jsx-scope": "off", // Redundant with Vite/React 17+
    },
  },

  {
    files: ["**/*.json", "**/*.json5"],
    plugins: { json },
    language: "json/json",
    extends: ["json/recommended"],
  },
  {
    files: ["**/*.jsonc", "**/tsconfig*.json"],
    plugins: { json },
    language: "json/jsonc",
    extends: ["json/recommended"],
  },

  {
    files: ["**/*.md"],
    plugins: { markdown },
    language: "markdown/gfm",
    extends: ["markdown/recommended"],
    rules: {
      "markdown/no-missing-label-refs": "off", // Allows the [...] placeholders in templates
    },
  },

  {
    files: ["**/*.css"],
    plugins: { css },
    language: "css/css",
    languageOptions: {
      customSyntax: tailwind4, // Tailwind v4 at-rules (@theme, @utility, …)
      tolerant: true, // v4 grammar the parser lacks: `--ns-*: initial`, nested @keyframes
    },
    extends: ["css/recommended"],
  },
  {
    // The workshop sheet reads tokens declared in main.css. The linter parses
    // each file on its own, so those variables are unresolvable from here —
    // unknown, not invalid.
    files: [".storybook/**/*.css"],
    rules: {
      "css/no-invalid-properties": ["error", { allowUnknownVariables: true }],
    },
  },

  // Story conventions: default-exported meta, args, play.
  ...storybook.configs["flat/recommended"],

  eslintConfigPrettier,
]);
