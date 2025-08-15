/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@b3dotfun/sdk/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
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
        "b3-react-ring": "hsl(var(--b3-react-ring))",
        "b3-react-popover": "hsl(var(--b3-react-popover))",
        "b3-react-popover-foreground": "hsl(var(--b3-react-popover-foreground))",
      },
    },
  },
  plugins: [],
};
