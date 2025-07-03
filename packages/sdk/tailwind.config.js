/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  // prefix: "b3-react-",
  // important: ".b3-root",
  theme: {
    screens: {
      "3xl": { max: "1579px" },
      // => @media (max-width: 1579px) { ... }
      "2xl": { max: "1419px" },
      // => @media (max-width: 1419px) { ... }
      xl: { max: "1259px" },
      // => @media (max-width: 1259px) { ... }
      lg: { max: "1023px" },
      // => @media (max-width: 1023px) { ... }
      md: { max: "767px" },
      // => @media (max-width: 767px) { ... }
      sm: { max: "480px" }
      // => @media (max-width: 480px) { ... }
    },
    extend: {
      fontFamily: {
        "neue-montreal-bold": ['"Neue Montreal Bold"', "sans-serif"],
        "neue-montreal": ['"Neue Montreal Regular"', "sans-serif"],
        "neue-montreal-book": ['"Neue Montreal Book"', "sans-serif"],
        "neue-montreal-medium": ['"Neue Montreal Medium"', "sans-serif"],
        "neue-montreal-semibold": ['"Neue Montreal Semibold"', "sans-serif"],
        "calibre-bold": ['"Calibre Bold"', "sans-serif"],
        "calibre-heavy": ['"Calibre Heavy"', "sans-serif"],
        calibre: ['"Calibre Regular"', "sans-serif"],
        pack: ["Pack", "sans-serif"]
      },
      colors: {
        "b3-react-background": "hsl(var(--b3-react-background))",
        "b3-react-foreground": "hsl(var(--b3-react-foreground))",
        "b3-react-card": "hsl(var(--b3-react-card))",
        "b3-react-card-foreground": "hsl(var(--b3-react-card-foreground))",
        "b3-react-subtle": "hsl(var(--b3-react-subtle))",
        "b3-react-secondary-foreground": "hsl(var(--b3-react-secondary-foreground))",
        "b3-react-primary": "hsl(var(--b3-react-primary))",
        "b3-react-primary-foreground": "hsl(var(--b3-react-primary-foreground))",
        "b3-react-muted-foreground": "hsl(var(--b3-react-muted-foreground))",
        "b3-react-border": "hsl(var(--b3-react-border))",
        "b3-react-muted": "hsl(var(--b3-react-muted))",
        "b3-react-popover": "hsl(var(--b3-react-popover))",
        "b3-react-ring": "hsl(var(--b3-react-ring))",

        // Anyspend, we get this from apps/anyspend-web/tailwind.config.ts
        "as-primary": "hsl(var(--as-primary))",
        "as-on-surface-1": "hsl(var(--as-on-surface-1))",
        "as-on-surface-2": "hsl(var(--as-on-surface-2))",
        "as-on-surface-3": "hsl(var(--as-on-surface-3))",
        "as-stroke": "hsl(var(--as-stroke))",
        "as-n-8": "hsl(var(--as-n-8))",
        "as-brand": "hsl(var(--as-brand))",
        "as-light-brand": "hsl(var(--as-light-brand))",
        "as-yellow": "hsl(var(--as-yellow))",
        "as-secondary": "hsl(var(--as-secondary))",
        "as-red": "hsl(var(--as-red))",
        "as-on-surface-disabled": "hsl(var(--as-on-surface-disabled))",
        "as-on-disabled": "hsl(var(--as-on-disabled))"
      },
      keyframes: {
        "pulse-fade": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" }
        }
      },
      animation: {
        "pulse-fade": "pulse-fade 1.5s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
