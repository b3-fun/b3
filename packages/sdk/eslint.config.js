const { resolve } = require("path");
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const reactHooksPlugin = require("eslint-plugin-react-hooks");
const tailwindPlugin = require("eslint-plugin-tailwindcss");

module.exports = [
  {
    ignores: ["**/*.gen.ts"],
  },
  {
    files: ["src/**/*.{js,ts,jsx,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooksPlugin,
      tailwindcss: tailwindPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...tailwindPlugin.configs.recommended.rules,
      // custom classnames for overrides sdk component styling
      "tailwindcss/no-custom-classname": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "tailwindcss/classnames-order": "off",
      "tailwindcss/enforces-shorthand": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
    settings: {
      tailwindcss: {
        config: resolve(__dirname, "tailwind.config.js"),
        callees: ["cn", "clsx"],
        removeDuplicates: true,
      },
    },
  },
];
