import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F8F0DF",
        ink: "#241F1A",
        plum: {
          DEFAULT: "#241F1A",
          light: "#5A5248",
          soft: "#EDE6D8",
        },
        sage: {
          DEFAULT: "#9CB380",
          soft: "#E9EEE1",
        },
        gold: {
          DEFAULT: "#EFC94C",
          soft: "#FBF1D2",
        },
        coral: {
          DEFAULT: "#E0855F",
          soft: "#F8E4DA",
        },
        teal: {
          DEFAULT: "#A9C2E0",
          soft: "#E9F0F8",
        },
        slate: {
          DEFAULT: "#5A6B7A",
          soft: "#E7ECEF",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.75rem",
      },
    },
  },
  plugins: [],
};
export default config;
