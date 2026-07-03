"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type React from "react";
import { HeartPulse } from "lucide-react";
import { AppTabBar } from "@/components/layout/AppTabBar";
import { OnlineStatus } from "@/components/pwa/OnlineStatus";
import { UpdatePrompt } from "@/components/pwa/UpdatePrompt";
import { PainModal } from "@/components/screens/PainModal";
import { usePainModal } from "@/hooks/usePainModal";
import { startStoreCloudSync, syncOnLoad } from "@/lib/sync";
import { scheduleReminders } from "@/services/reminder.service";

const hiddenShellPrefixes = ["/auth"];

function shouldHideShell(pathname: string) {
  return hiddenShellPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export function RouterShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const painModal = usePainModal();
  const hideShell = shouldHideShell(pathname);

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
    <div className="mira-stitch-page min-h-screen bg-transparent pb-24">
      {children}

      <button
        type="button"
        aria-label="Мне больно"
        className="fixed bottom-6 right-6 z-40 hidden h-14 w-14 items-center justify-center rounded-[22px] bg-[#7C5FA8] text-white shadow-[0_18px_36px_rgba(124,95,168,0.26)] transition active:scale-95 sm:flex"
        style={{ animation: "miraPainPulse 1.8s ease-in-out infinite" }}
        onClick={painModal.open}
      >
        <HeartPulse className="h-6 w-6" />
      </button>

      <AppTabBar />
      <OnlineStatus />
      <UpdatePrompt />

      <PainModal
        open={painModal.isOpen}
        onClose={painModal.close}
        onOpenDoctorReport={() => {
          painModal.close();
          router.push("/report");
        }}
      />

      <style jsx global>{`
        @keyframes miraPainPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
      `}</style>
    </div>
  );
}

export default RouterShell;
