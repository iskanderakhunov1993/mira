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
          background: "#FAF8F6",
          card: "#FFFFFF",
          text: "#1C1C1E",
          muted: "#77757F",
          primary: "#8C74D9",
          success: "#CFE6D0",
          cycle: "#E9C8C2",
          ink: "#111018"
        }
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 20px 60px rgba(28, 28, 30, 0.08)",
        glow: "0 18px 60px rgba(140, 116, 217, 0.22)"
      },
      borderRadius: {
        "3xl": "2rem",
        "4xl": "2.5rem"
      }
    }
  },
  plugins: []
};

export default config;
