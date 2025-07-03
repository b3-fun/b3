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
      files: ["src/**/*"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["b3-shared", "b3-shared/*"],
                message: "Please do not import from b3-shared directly in the react package."
              }
            ]
          }
        ]
      }
    }
  ],
  settings: {
    tailwindcss: {
      config: "./packages/react/tailwind.config.js",
      callees: ["cn"],
      removeDuplicates: true
    }
  }
};
