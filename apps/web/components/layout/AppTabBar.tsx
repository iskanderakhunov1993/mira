"use client";

import { BarChart3, CalendarHeart, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { TABS, type TabConfig, type TabType } from "@/types/navigation";

function getActiveTab(pathname: string): TabType {
  if (pathname === "/today") return "today";
  if (pathname === "/track") return "track";
  if (pathname === "/analysis") return "analytics";
  return "analytics";
}

const iconMap = {
  today: CalendarHeart,
  track: Plus,
  analytics: BarChart3,
} satisfies Record<TabType, typeof CalendarHeart>;

export function AppTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);
  const isDarkPresetPage = pathname === "/today" || pathname === "/track" || pathname === "/analysis" || pathname === "/report" || pathname === "/profile";

  function handleTabClick(tab: TabConfig) {
    if (tab.id === "track") {
      if (pathname !== "/track") router.push(tab.path);
      return;
    }
    router.push(tab.path);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-3">
      <div
        className={`mx-auto grid h-[74px] max-w-[480px] grid-cols-3 items-center gap-1 rounded-[30px] border px-2 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-2xl ${
          isDarkPresetPage
            ? "border-[#2E2826] bg-[#1D1816]/94 shadow-[0_18px_44px_rgba(0,0,0,0.34)]"
            : "border-[#DED6E8] bg-white/92 shadow-[0_16px_38px_rgba(62,52,83,0.10)]"
        }`}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const isTrack = tab.id === "track";
          const Icon = iconMap[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab)}
              className={`relative flex h-[62px] min-w-0 flex-col items-center justify-center rounded-[24px] transition-all duration-200 active:scale-[0.97] ${
                isTrack
                  ? isDarkPresetPage ? "text-[#F5F0ED]" : "text-[#262235]"
                  : isActive
                    ? isDarkPresetPage ? "bg-[#252318] text-[#84E600]" : "bg-[#F4F0FA] text-[#8B6FB3]"
                    : isDarkPresetPage ? "text-[#8D817B] hover:bg-[#2A2523]" : "text-[#8E8E93] hover:bg-[#FAF8F5]"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {isTrack ? (
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full shadow-[0_10px_24px_rgba(139,111,179,0.20)] transition ${
                    isDarkPresetPage
                      ? isActive ? "bg-[#84E600] text-[#11100F]" : "bg-[#F9359E] text-white"
                      : isActive ? "bg-[#8B6FB3] text-white" : "bg-[#262235] text-white"
                  }`}
                >
                  <Icon className="h-6 w-6" strokeWidth={2.4} />
                </span>
              ) : (
                <Icon
                  className={`h-[22px] w-[22px] transition ${
                    isDarkPresetPage
                      ? isActive ? "text-[#84E600]" : "text-[#8D817B]"
                      : isActive ? "text-[#8B6FB3]" : "text-[#8E8E93]"
                  }`}
                  strokeWidth={2}
                />
              )}
              <span
                className={`mt-1.5 max-w-full truncate px-0.5 text-[10.5px] font-semibold leading-none tracking-[-0.01em] transition-colors duration-200 max-[390px]:text-[9px] ${
                  isDarkPresetPage
                    ? isActive ? "text-[#84E600]" : isTrack ? "text-[#F5F0ED]" : "text-[#8D817B]"
                    : isActive ? "text-[#8B6FB3]" : isTrack ? "text-[#262235]" : "text-[#8E8E93]"
                }`}
              >
                {isTrack ? "Трек" : tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default AppTabBar;
