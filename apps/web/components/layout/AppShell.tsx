"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import type { NavPage } from "./types";
import type { MiraLocalData } from "@/lib/types";
import { readData, writeData, createEmpty } from "@/lib/store";

import { TodayScreen } from "@/components/screens/TodayScreen";
import { AnalyticsScreen } from "@/components/screens/AnalyticsScreen";
import { CareScreen } from "@/components/screens/CareScreen";
import { IslamicScreen } from "@/components/screens/IslamicScreen";
import { ReportScreen } from "@/components/screens/ReportScreen";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
import { OnboardingScreen } from "@/components/screens/OnboardingScreen";
import { CheckInModal } from "@/components/screens/CheckInModal";

export function AppShell() {
  const [page, setPage] = useState<NavPage>("today");
  const [data, setData] = useState<MiraLocalData>(createEmpty);
  const [ready, setReady] = useState(false);
  const [showApp, setShowApp] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkInDate, setCheckInDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    const loaded = readData();
    setData(loaded);
    setShowApp(loaded.onboardingCompleted && !!loaded.profile);
    setReady(true);
    // Локальное напоминание при заходе (не чаще раза в день)
    if (loaded.onboardingCompleted) {
      import("@/lib/notifications").then(m => m.maybeShowDailyNotification(loaded));
    }
  }, []);

  const persist = useCallback((next: MiraLocalData) => {
    setData(next);
    writeData(next);
  }, []);

  const openCheckIn = useCallback((date?: string) => {
    setCheckInDate(typeof date === "string" ? date : undefined);
    setCheckInOpen(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mira-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-[22%] bg-gradient-to-br from-[#C9B8E8] to-[#A08CC8]" />
          <span className="text-sm text-mira-muted">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (!showApp) {
    return (
      <OnboardingScreen
        data={data}
        persist={persist}
        onComplete={() => {
          setData(readData());
          setShowApp(true);
          // #2 «Первая победа» — сразу предлагаем отметить состояние
          setTimeout(() => { setCheckInDate(undefined); setCheckInOpen(true); }, 600);
        }}
      />
    );
  }

  const screenProps = { data, persist, navigate: setPage, onCheckIn: openCheckIn };
  const isIslamic = data.profile?.additionalMode === "islam";

  const screens: Record<NavPage, React.ReactNode> = {
    today: <TodayScreen {...screenProps} />,
    analytics: <AnalyticsScreen {...screenProps} />,
    care: <CareScreen {...screenProps} />,
    islamic: <IslamicScreen {...screenProps} />,
    report: <ReportScreen {...screenProps} />,
    profile: <ProfileScreen {...screenProps} />,
  };

  return (
    <div className="min-h-screen bg-mira-bg text-mira-text lg:flex">
      <Sidebar active={page} onChange={setPage} onCheckIn={openCheckIn} isIslamic={isIslamic} />
      <main className="flex-1 pb-24 lg:pb-0">
        <div className="mx-auto max-w-[600px] px-4 py-6 sm:px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {screens[page]}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <BottomNav active={page} onChange={setPage} onCheckIn={openCheckIn} isIslamic={isIslamic} />
      <AnimatePresence>
        {checkInOpen && (
          <CheckInModal
            open={checkInOpen}
            onClose={() => setCheckInOpen(false)}
            data={data}
            persist={persist}
            targetDate={checkInDate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
