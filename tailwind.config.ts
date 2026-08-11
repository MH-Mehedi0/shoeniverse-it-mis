import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#050b18",
          900: "#0a1428",
          800: "#0f1f3d",
          700: "#152a52",
          600: "#1c3766",
        },
        brand: {
          50: "#eef7ff",
          100: "#d9edff",
          200: "#b8dfff",
          300: "#86caff",
          400: "#4dadff",
          500: "#2389fa",
          600: "#0f6bd8",
          700: "#0d55ae",
          800: "#10478c",
          900: "#123d73",
        },
        cyan: {
          400: "#22d3ee",
          500: "#06b6d4",
        },
        status: {
          pending: "#eab308",
          collected: "#3b82f6",
          process: "#f97316",
          done: "#22c55e",
          cancel: "#ef4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
