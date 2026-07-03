import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        mira: {
          bg: "#050505",
          card: "#1D1816",
          text: "#F5F0ED",
          muted: "#B7AAA4",
          primary: "#B3FF6A",
          "primary-deep": "#84E600",
          cycle: "#F9359E",
          success: "#84E600",
          warm: "#FFC451",
          lavender: "#404A35",
          "lavender-light": "#2A2523",
          rose: "#FFB0CE",
          "rose-light": "#302027",
          ink: "#F5F0ED",
          surface: "#1D1816",
          inset: "#2A2523",
          border: "#2E2826"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-manrope)", "var(--font-inter)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 10px 36px rgba(61, 43, 72, 0.07), 0 0 0 1px rgba(220, 207, 234, 0.14)",
        glow: "0 14px 42px rgba(146, 115, 182, 0.24)",
        card: "0 4px 20px rgba(61, 43, 72, 0.045), 0 0 0 1px rgba(220, 207, 234, 0.14)",
        "card-hover": "0 10px 32px rgba(61, 43, 72, 0.09), 0 0 0 1px rgba(146, 115, 182, 0.15)",
        "inner-glow": "inset 0 1px 2px rgba(255, 255, 255, 0.5)",
        glass: "0 8px 32px rgba(155, 142, 196, 0.1), inset 0 1px 0 rgba(255,255,255,0.4)"
      },
      borderRadius: {
        "3xl": "1.5rem",
        "4xl": "2rem"
      }
    }
  },
  plugins: []
};

export default config;
