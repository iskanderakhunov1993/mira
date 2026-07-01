"use client";

import { Activity, BarChart3, BookOpen, HeartPulse, Plus, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { QuickTrackModal } from "@/components/screens/QuickTrackModal";
import { TABS, type TabConfig, type TabType } from "@/types/navigation";

function getActiveTab(pathname: string): TabType {
  if (pathname === "/today") return "today";
  if (pathname === "/care") return "care";
  if (pathname.startsWith("/content") || pathname.startsWith("/article")) return "content";
  if (pathname === "/profile") return "profile";
  return "analytics";
}

const iconMap = {
  today: Activity,
  care: HeartPulse,
  track: Plus,
  analytics: BarChart3,
  content: BookOpen,
  profile: UserRound,
} satisfies Record<TabType, typeof Activity>;

export function AppTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [trackOpen, setTrackOpen] = useState(false);
  const activeTab = getActiveTab(pathname);

  function handleTabClick(tab: TabConfig) {
    if (tab.id === "track") {
      setTrackOpen(true);
      return;
    }
    router.push(tab.path);
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-3">
        <div className="mx-auto flex h-[82px] max-w-[720px] items-center justify-around rounded-[34px] border border-[#E8E1E7] bg-white/88 px-3 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_18px_42px_rgba(62,52,83,0.12)] backdrop-blur-2xl">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const isTrack = tab.id === "track";
            const Icon = iconMap[tab.id];
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab)}
                className={`relative flex h-[70px] flex-1 flex-col items-center justify-center rounded-[30px] transition-all duration-200 ${
                  isTrack
                    ? "-mt-7 mx-1 max-w-[104px] bg-[#262235] text-white shadow-[0_16px_30px_rgba(38,34,53,0.22)]"
                    : isActive
                      ? "bg-[#FFF0F5] text-[#E872A0]"
                      : "text-[#8E8E93] hover:bg-[#FAF8F5]"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && !isTrack && (
                  <span className="absolute top-2 h-1.5 w-1.5 rounded-full bg-[#E872A0]" />
                )}
                <Icon className={`${isTrack ? "h-8 w-8" : "h-6 w-6"} transition-all duration-200 ${isActive && !isTrack ? "scale-110" : ""}`} strokeWidth={isTrack ? 2.4 : 2.2} />
                <span className={`mt-2 text-[11px] font-black leading-none transition-colors duration-200 max-[430px]:text-[9px] ${isTrack ? "text-white" : isActive ? "text-[#E872A0]" : "text-[#8E8E93]"}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
      <QuickTrackModal open={trackOpen} onClose={() => setTrackOpen(false)} />
    </>
  );
}

export default AppTabBar;
