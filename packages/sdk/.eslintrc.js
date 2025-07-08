const path = require("path");

module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  plugins: ["react-hooks"],
  root: true,
  extends: ["plugin:tailwindcss/recommended"],
  rules: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "tailwindcss/classnames-order": "off",
    "tailwindcss/enforces-shorthand": "off"
  },
  overrides: [
    {
      files: ["src/**/*"]
    }
  ],
  settings: {
    tailwindcss: {
      config: path.resolve(__dirname, "./tailwind.config.js"),
      callees: ["cn", "clsx"],
      removeDuplicates: true
    }
  }
};
