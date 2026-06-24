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
          bg: "#F8F5FE",
          card: "#FFFFFF",
          text: "#2D2640",
          muted: "#9B95A8",
          primary: "#9B8EC4",
          "primary-deep": "#7B6BA8",
          cycle: "#C47E9B",
          success: "#7BAF8D",
          warm: "#E8C5A0",
          lavender: "#D4CCE6",
          "lavender-light": "#EDE8F5",
          rose: "#E8B4C8",
          "rose-light": "#F5E0EA",
          ink: "#2D2640"
        }
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 8px 32px rgba(45, 38, 64, 0.06)",
        glow: "0 12px 40px rgba(155, 142, 196, 0.2)",
        card: "0 2px 12px rgba(45, 38, 64, 0.04)"
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
