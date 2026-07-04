export type TabType = "today" | "track" | "analytics";

export interface TabConfig {
  id: TabType;
  label: string;
  path: string;
}

export const TABS: TabConfig[] = [
  { id: "today", label: "Сегодня", path: "/today" },
  { id: "track", label: "Отслеживать", path: "/track" },
  { id: "analytics", label: "Анализ", path: "/analysis" },
];
