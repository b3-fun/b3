module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  plugins: ["react-hooks", "tailwindcss"],
  root: true,
  extends: ["plugin:tailwindcss/recommended"],
  rules: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "tailwindcss/classnames-order": "off",
    "tailwindcss/enforces-shorthand": "off",
    "tailwindcss/no-custom-classname": "off"
  },
  overrides: [
    {
      files: ["src/**/*"]
    }
  ],
  settings: {
    tailwindcss: {
      config: "./tailwind.config.js",
      callees: ["cn", "clsx"],
      removeDuplicates: true,
      cssFiles: ["./src/styles/index.css"]
    }
  }
};
