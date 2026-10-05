import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm off-white app background + surfaces
        canvas: "#F5F4F0",
        surface: "#FFFFFF",
        line: "#EBE9E3",
        "line-strong": "#DED9CF",

        // Text
        ink: "#221F1A",
        "ink-soft": "#4A463F",
        muted: "#8A857B",

        // Brand — rust / orange
        primary: {
          DEFAULT: "#D6532B",
          50: "#FDF1EA",
          100: "#FBE1D3",
          600: "#C4491F",
          700: "#A63C19",
        },
        // Teal — system charts / accents
        teal: {
          DEFAULT: "#0F8C7F",
          50: "#E6F4F2",
          600: "#0C7368",
        },
        // Status
        success: { DEFAULT: "#15803D", bg: "#E7F5EC", soft: "#1CA150" },
        warning: { DEFAULT: "#C77A1E", bg: "#FBF0DE", soft: "#E0902B" },
        danger: { DEFAULT: "#C64545", bg: "#FBE9E9", soft: "#DC5757" },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(24,20,15,0.04), 0 1px 3px rgba(24,20,15,0.03)",
        pop: "0 8px 28px rgba(24,20,15,0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
