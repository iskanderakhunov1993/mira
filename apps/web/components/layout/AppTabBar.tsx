"use client";

import { usePathname, useRouter } from "next/navigation";
import { TABS, type TabConfig, type TabType } from "@/types/navigation";

function getActiveTab(pathname: string): TabType {
  if (pathname === "/today") return "today";
  if (pathname === "/care") return "care";
  if (pathname === "/profile") return "profile";
  return "analytics";
}

export function AppTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);

  function handleTabClick(tab: TabConfig) {
    router.push(tab.path);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#F0E6EA] bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="mx-auto flex h-[72px] max-w-md items-center justify-around px-2 pb-[env(safe-area-inset-bottom,0px)]">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab)}
              className="flex h-full flex-1 flex-col items-center justify-center transition-all duration-200"
              aria-current={isActive ? "page" : undefined}
            >
              <span className={`text-2xl transition-all duration-200 ${isActive ? "scale-110" : "grayscale"}`}>
                {tab.icon}
              </span>
              <span className={`mt-1 text-xs font-bold transition-colors duration-200 max-[480px]:hidden ${isActive ? "text-[#E872A0]" : "text-[#8E8E93]"}`}>
                {tab.label}
              </span>
              <span className={`mt-1 h-1 w-1 rounded-full transition ${isActive ? "bg-[#E872A0]" : "bg-transparent"}`} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default AppTabBar;
