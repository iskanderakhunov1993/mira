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
          bg: "#FBF6F3",
          card: "#FFFFFF",
          text: "#31283E",
          muted: "#92889D",
          primary: "#9273B6",
          "primary-deep": "#765997",
          cycle: "#D97996",
          success: "#78A887",
          warm: "#F1C7A7",
          lavender: "#DCCFEA",
          "lavender-light": "#F5EFFA",
          rose: "#ECA8BC",
          "rose-light": "#FFF0F5",
          ink: "#31283E"
        }
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "Inter", "system-ui", "sans-serif"]
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
