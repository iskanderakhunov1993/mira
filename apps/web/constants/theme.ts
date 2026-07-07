import type { ThemeMode } from "@/types/health";

export const themeModes: ThemeMode[] = ["light", "dark", "system"];

export const themeTokens = {
  light: {
    background: "#FAF8F5",
    foreground: "#1A1A1A",
    card: "#FFFFFF",
    cardMuted: "#F4F0FA",
    border: "#E8E1EB",
    primary: "#8B6FB3",
    primaryContrast: "#FFFFFF",
    accent: "#F64F86",
    muted: "#6F6F76",
    success: "#2F8F5B",
  },
  dark: {
    background: "#050505",
    foreground: "#F5F0ED",
    card: "#1D1816",
    cardMuted: "#2A2523",
    border: "#2E2826",
    primary: "#84E600",
    primaryContrast: "#11100F",
    accent: "#F9359E",
    muted: "#B7AAA4",
    success: "#B3FF6A",
  },
} as const;

export type ThemeTokenName = keyof typeof themeTokens.light;
