import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem" },
    extend: {
      colors: {
        // Dark surface palette
        bg: "#0B0B10",          // page background
        surface: "#16161D",      // cards / headers
        elevated: "#1F1F28",     // chips, hover, gray-100 replacement
        line: "#2A2A36",         // borders
        fg: "#F5F5F7",           // primary text
        "fg-muted": "#A1A1AA",   // secondary text
        "fg-dim": "#6B7280",     // tertiary / placeholders
        brand: {
          DEFAULT: "#8BAE66",
          50: "#F1F6EA",
          100: "#DDE9CC",
          500: "#8BAE66",
          600: "#7A9C57",
          700: "#658246",
          900: "#1F2A14",
        },
        success: "#22C55E",
        danger: "#EF4444",
      },
      borderColor: { DEFAULT: "#2A2A36" },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: { xl: "0.875rem", "2xl": "1.125rem" },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.35), 0 1px 3px 0 rgb(0 0 0 / 0.25)",
        fab: "0 8px 24px rgba(139, 174, 102, 0.45)",
      },
      keyframes: {
        "slide-up": {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: { "slide-up": "slide-up 180ms ease-out" },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
