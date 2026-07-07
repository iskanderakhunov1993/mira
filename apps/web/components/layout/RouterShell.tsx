"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type React from "react";
import { AppTabBar } from "@/components/layout/AppTabBar";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { OnlineStatus } from "@/components/pwa/OnlineStatus";
import { UpdatePrompt } from "@/components/pwa/UpdatePrompt";
import { startStoreCloudSync, syncOnLoad } from "@/lib/sync";
import { scheduleReminders } from "@/services/reminder.service";

const hiddenShellPrefixes = ["/auth"];
const hiddenTabBarPaths = ["/onboarding"];

function shouldHideShell(pathname: string) {
  return hiddenShellPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export function RouterShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideShell = shouldHideShell(pathname);
  const hideTabBar = hiddenTabBarPaths.includes(pathname);

  useEffect(() => {
    scheduleReminders();
  }, [pathname]);

  useEffect(() => {
    let stopStoreSync: (() => void) | undefined;
    let cancelled = false;

    syncOnLoad()
      .catch((error) => console.warn("sync on load failed:", error))
      .finally(() => {
        if (!cancelled) stopStoreSync = startStoreCloudSync();
      });

    return () => {
      cancelled = true;
      stopStoreSync?.();
    };
  }, []);

  if (hideShell) {
    return <>{children}</>;
  }

  return (
    <div className={`mira-app-page min-h-screen bg-transparent ${hideTabBar ? "pb-0" : "pb-32"}`}>
      {children}

      {!hideTabBar && <AppTabBar />}
      <InstallPrompt />
      <OnlineStatus />
      <UpdatePrompt />
    </div>
  );
}

export default RouterShell;
