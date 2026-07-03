export type TabType = "today" | "care" | "track" | "analytics" | "report" | "profile";

export interface TabConfig {
  id: TabType;
  label: string;
  path: string;
}

export const TABS: TabConfig[] = [
  { id: "today", label: "Сегодня", path: "/today" },
  { id: "care", label: "Контекст", path: "/care" },
  { id: "track", label: "Отслеживать", path: "/track" },
  { id: "analytics", label: "Анализ", path: "/analysis" },
  { id: "report", label: "Отчёт", path: "/report" },
  { id: "profile", label: "Профиль", path: "/profile" },
];
