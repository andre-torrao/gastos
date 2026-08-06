import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F7F4F0",
        ink: "#211C22",
        plum: {
          DEFAULT: "#4B2E56",
          light: "#7A5A87",
          soft: "#EFE6F1",
        },
        sage: {
          DEFAULT: "#7C9473",
          soft: "#E9EEE6",
        },
        gold: {
          DEFAULT: "#D9A441",
          soft: "#F8EDD8",
        },
        coral: {
          DEFAULT: "#D9704F",
          soft: "#F7E5DD",
        },
        teal: {
          DEFAULT: "#3E7C7B",
          soft: "#E1EEED",
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
