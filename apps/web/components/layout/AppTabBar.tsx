"use client";

import { CalendarDays, CircleDot, Plus, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { TABS, type TabConfig, type TabType } from "@/types/navigation";

function getActiveTab(pathname: string): TabType {
  if (pathname === "/today") return "today";
  if (pathname === "/calendar") return "calendar";
  if (pathname === "/add") return "add";
  if (pathname === "/body") return "body";
  return "today";
}

const iconMap = {
  today: CircleDot,
  calendar: CalendarDays,
  add: Plus,
  body: UserRound,
} satisfies Record<TabType, typeof CircleDot>;

export function AppTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);

  function handleTabClick(tab: TabConfig) {
    if (tab.id === "add") {
      if (pathname !== "/add") router.push(tab.path);
      return;
    }
    router.push(tab.path);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-3">
      <div
        className="mx-auto grid h-[74px] max-w-[480px] grid-cols-4 items-center gap-1 rounded-[30px] border border-[var(--mira-token-border)] bg-[color-mix(in_srgb,var(--mira-token-card)_92%,transparent)] px-2 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_16px_38px_rgba(62,52,83,0.10)] backdrop-blur-2xl"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const isAdd = tab.id === "add";
          const Icon = iconMap[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab)}
              aria-label={isAdd ? "Добавить запись" : tab.label}
              className={`relative flex h-[62px] min-w-0 flex-col items-center justify-center rounded-[24px] transition-all duration-200 active:scale-[0.97] ${
                isAdd
                  ? "text-[var(--mira-token-foreground)]"
                  : isActive
                    ? "bg-[var(--mira-token-lavender)] text-[var(--mira-token-primary)]"
                    : "text-[var(--mira-token-muted)] hover:bg-[var(--mira-token-card-muted)]"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {isAdd ? (
                <span
	                  className={`flex h-11 w-11 items-center justify-center rounded-full shadow-[0_10px_24px_rgba(139,111,179,0.20)] transition ${
	                    isActive ? "bg-[var(--mira-token-primary)] text-white" : "bg-[var(--mira-token-primary)] text-white"
	                  }`}
                >
                  <Icon className="h-6 w-6" strokeWidth={2.4} />
                </span>
              ) : (
                <Icon
	                  className={`h-[22px] w-[22px] transition ${
	                    isActive ? "text-[var(--mira-token-primary)]" : "text-[var(--mira-token-muted)]"
	                  }`}
                  strokeWidth={2}
                />
              )}
              <span
	                className={`mt-1.5 max-w-full truncate px-0.5 text-[10.5px] font-semibold leading-none tracking-[-0.01em] transition-colors duration-200 max-[390px]:text-[9px] ${
	                  isActive ? "text-[var(--mira-token-primary)]" : isAdd ? "text-[var(--mira-token-foreground)]" : "text-[var(--mira-token-muted)]"
	                }`}
              >
                {isAdd ? "Добавить" : tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default AppTabBar;
