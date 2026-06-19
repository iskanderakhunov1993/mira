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
          background: "#191918",
          card: "#262522",
          text: "#F7F6F1",
          muted: "#B5B3AD",
          primary: "#76D7F3",
          success: "#1C665A",
          cycle: "#EF4653",
          ink: "#111110"
        }
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 20px 60px rgba(0, 0, 0, 0.28)",
        glow: "0 18px 60px rgba(118, 215, 243, 0.2)"
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
