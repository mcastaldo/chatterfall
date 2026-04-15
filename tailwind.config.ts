import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f3f0ff",
          100: "#e9e3ff",
          200: "#d5ccff",
          300: "#b5a3ff",
          400: "#9170ff",
          500: "#7044ff",
          600: "#5e1ff7",
          700: "#4f10e3",
          800: "#420dbf",
          900: "#370b9c",
          950: "#1b0d45",
        },
      },
    },
  },
  plugins: [],
};

export default config;
