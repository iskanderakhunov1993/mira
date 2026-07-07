export type TabType = "today" | "calendar" | "add" | "body";

export interface TabConfig {
  id: TabType;
  label: string;
  path: string;
}

export const TABS: TabConfig[] = [
  { id: "today", label: "Сегодня", path: "/today" },
  { id: "calendar", label: "Календарь", path: "/calendar" },
  { id: "add", label: "Добавить", path: "/add" },
  { id: "body", label: "Моё тело", path: "/body" },
];
