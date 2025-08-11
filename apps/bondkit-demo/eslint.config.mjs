import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "warn",
      "prefer-const": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",
      "react-hooks/rules-of-hooks": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "react/display-name": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "react/no-unescaped-entities": "warn",
      "react/jsx-key": "warn",
      "jsdoc/require-jsdoc": "warn",
    },
  },
];

export default eslintConfig;
