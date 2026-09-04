import js from "@eslint/js";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { englishIdentifiersPlugin } from "./eslint-rules/english-identifiers.mjs";

const ENGLISH_IDENTIFIER_PATHS = [
  "src/app/**/*.{ts,tsx}",
  "src/core/**/*.{ts,tsx}",
  "src/domain/**/*.{ts,tsx}",
  "src/features/**/*.{ts,tsx}",
  "src/main.tsx",
  "vite.config.ts",
];

const LEGACY_SHELL_PATHS = [
  "src/App.tsx",
  "src/components/**/*.{js,jsx}",
  "src/hooks/**/*.{js,jsx}",
];

export default tseslint.config(
  {
    ignores: ["dist/**", "src-tauri/target/**", "node_modules/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: ["vite.config.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ENGLISH_IDENTIFIER_PATHS,
    plugins: {
      facturador: englishIdentifiersPlugin,
    },
    rules: {
      "facturador/english-identifiers": "error",
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
        {
          selector: "variable",
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
        },
        {
          selector: "function",
          format: ["camelCase", "PascalCase"],
          leadingUnderscore: "allow",
        },
        {
          selector: "parameter",
          format: ["camelCase", "PascalCase"],
          leadingUnderscore: "allow",
        },
      ],
    },
  },
  {
    files: LEGACY_SHELL_PATHS,
    rules: {
      "facturador/english-identifiers": "off",
      "@typescript-eslint/naming-convention": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/static-components": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/purity": "off",
    },
  },
  eslintConfigPrettier,
);
