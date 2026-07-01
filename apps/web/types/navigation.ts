export type TabType = "today" | "care" | "track" | "analytics" | "content" | "profile";

export interface TabConfig {
  id: TabType;
  label: string;
  path: string;
}

export const TABS: TabConfig[] = [
  { id: "today", label: "Сегодня", path: "/today" },
  { id: "care", label: "Забота", path: "/care" },
  { id: "track", label: "Отслеживать", path: "/care" },
  { id: "analytics", label: "Анализ", path: "/" },
  { id: "content", label: "Контент", path: "/content" },
  { id: "profile", label: "Профиль", path: "/profile" },
];
