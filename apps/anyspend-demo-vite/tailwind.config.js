/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", "../../packages/sdk/src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "b3-blue": "#3368ef",
        "b3-grey": "#1E1E1E",
      },
      fontFamily: {
        "neue-montreal-bold": ['"Neue Montreal Bold"', "sans-serif"],
        "neue-montreal": ['"Neue Montreal Regular"', "sans-serif"],
        "neue-montreal-book": ['"Neue Montreal Book"', "sans-serif"],
        "neue-montreal-medium": ['"Neue Montreal Medium"', "sans-serif"],
        "neue-montreal-semibold": ['"Neue Montreal Semibold"', "sans-serif"],
        "calibre-bold": ['"Calibre Bold"', "sans-serif"],
        "calibre-heavy": ['"Calibre Heavy"', "sans-serif"],
        calibre: ['"Calibre Regular"', "sans-serif"],
        pack: ["Pack", "sans-serif"],
      },
    },
  },
  plugins: [],
};
