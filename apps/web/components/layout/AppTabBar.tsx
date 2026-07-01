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
        <div className="mx-auto flex h-[86px] max-w-[720px] items-center justify-around rounded-[42px] border border-white/20 bg-[#33332F]/88 px-3 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_24px_58px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-2xl">
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
                    ? "-mt-7 mx-1 max-w-[104px] bg-[#8BDFFF] text-[#202033] shadow-[0_18px_34px_rgba(64,197,244,0.42),inset_0_1px_0_rgba(255,255,255,0.55)]"
                    : isActive
                      ? "bg-[#5BCDEB]/22 text-[#8BDFFF] shadow-[inset_0_0_36px_rgba(91,205,235,0.18)]"
                      : "text-white/88 hover:bg-white/8"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && !isTrack && (
                  <span className="absolute -right-1 top-2 h-3 w-3 rounded-full bg-[#8BDFFF] shadow-[0_0_18px_rgba(139,223,255,0.9)]" />
                )}
                <Icon className={`${isTrack ? "h-8 w-8" : "h-6 w-6"} transition-all duration-200 ${isActive && !isTrack ? "scale-110" : ""}`} strokeWidth={isTrack ? 2.4 : 2.2} />
                <span className={`mt-2 text-[11px] font-black leading-none transition-colors duration-200 max-[430px]:text-[9px] ${isTrack ? "text-[#202033]" : isActive ? "text-[#8BDFFF]" : "text-white"}`}>
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
