"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type React from "react";
import { AppTabBar } from "@/components/layout/AppTabBar";
import { OnlineStatus } from "@/components/pwa/OnlineStatus";
import { UpdatePrompt } from "@/components/pwa/UpdatePrompt";
import { PainModal } from "@/components/screens/PainModal";
import { usePainModal } from "@/hooks/usePainModal";
import { scheduleReminders } from "@/services/reminder.service";

const hiddenShellPrefixes = ["/auth", "/demo", "/design", "/partner"];

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

  if (hideShell) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24">
      {children}

      <button
        type="button"
        aria-label="Мне больно"
        className="fixed bottom-[90px] right-5 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-[#FF6B6B] text-[28px] shadow-[0_4px_12px_rgba(255,107,107,0.4)] transition active:scale-95"
        style={{ animation: "miraPainPulse 1.8s ease-in-out infinite" }}
        onClick={painModal.open}
      >
        🆘
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
