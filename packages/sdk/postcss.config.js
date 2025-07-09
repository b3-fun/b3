// postcss.config.js
module.exports = {
  plugins: {
    "postcss-import": {},
    "postcss-prefix-selector": {
      prefix: ".b3-root",
      transform: function (prefix, selector, prefixedSelector) {
        // Don't prefix keyframes or special at-rules
        if (selector.startsWith("html") || selector.startsWith("body") || selector.includes("html[data-theme=")) {
          return selector;
        }
        return prefixedSelector;
      },
      exclude: [/^\.b3-root/, /^:root/],
    },
    tailwindcss: {},
    autoprefixer: {},
    cssnano: {
      preset: [
        "default",
        {
          discardComments: { removeAll: true },
        },
      ],
    },
  },
};
