"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import type { NavPage } from "./types";
import type { MiraLocalData } from "@/lib/types";
import { readData, writeData, createEmpty } from "@/lib/store";
import { syncOnLoad, schedulePush } from "@/lib/sync";

import { TodayPage } from "@/components/screens/TodayPage";
import { DiaryScreen } from "@/components/screens/DiaryScreen";
import { AnalyticsPage } from "@/components/screens/AnalyticsPage";
import { CarePage } from "@/components/screens/CarePage";
import { IslamicScreen } from "@/components/screens/IslamicScreen";
import { LabsScreen } from "@/components/screens/LabsScreen";
import { ReportScreen } from "@/components/screens/ReportScreen";
import { ProfilePage } from "@/components/screens/ProfilePage";
import { OnboardingScreen } from "@/components/screens/OnboardingScreen";
import { CheckInModal } from "@/components/screens/CheckInModal";
import { PainModal } from "@/components/screens/PainModal";
import { DelayCheckModal } from "@/components/screens/DelayCheckModal";
import { getCycleNorm } from "@/lib/cycleEngine";
import { hasPin, verifyPin } from "@/lib/privacy";

export function AppShell() {
  const [page, setPage] = useState<NavPage>("today");
  const [data, setData] = useState<MiraLocalData>(createEmpty);
  const [ready, setReady] = useState(false);
  const [showApp, setShowApp] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkInDate, setCheckInDate] = useState<string | undefined>(undefined);
  const [badStateOpen, setBadStateOpen] = useState(false);
  const [delayCheckOpen, setDelayCheckOpen] = useState(false);
  const [privacyUnlocked, setPrivacyUnlocked] = useState(false);

  useEffect(() => {
    const loaded = readData();
    setData(loaded);
    setShowApp(loaded.onboardingCompleted && !!loaded.profile);
    setReady(true);
    // Локальное напоминание при заходе (не чаще раза в день)
    if (loaded.onboardingCompleted) {
      import("@/lib/notifications").then(m => m.maybeShowDailyNotification(loaded));
    }
    // Синк с облаком, если пользователь вошёл (иначе тихо отдаёт локальные данные).
    syncOnLoad()
      .then((merged) => {
        setData(merged);
        // На новом устройстве данные приходят из облака — показываем приложение.
        if (merged.onboardingCompleted && merged.profile) setShowApp(true);
      })
      .catch((e) => console.warn("syncOnLoad failed:", e));
  }, []);

  const persist = useCallback((next: MiraLocalData) => {
    setData(next);
    writeData(next);
    schedulePush(next); // дебаунс-пуш в облако (no-op, если не вошёл)
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
        }}
      />
    );
  }

  if (data.profile?.pinEnabled && hasPin() && !privacyUnlocked) {
    return <PrivacyLockScreen onUnlock={() => setPrivacyUnlocked(true)} />;
  }

  const screenProps = {
    data,
    persist,
    navigate: setPage,
    onCheckIn: openCheckIn,
    onBadState: () => setBadStateOpen(true),
    onDelayCheck: () => setDelayCheckOpen(true),
  };
  const isIslamic = data.profile?.additionalMode === "islam";
  const delayDays = data.profile ? getCycleNorm(data.profile).delayDays : 0;

  const screens: Record<NavPage, React.ReactNode> = {
    today: (
      <TodayPage
        onPain={() => setBadStateOpen(true)}
        onPeriod={openCheckIn}
        onCheckIn={openCheckIn}
        onCare={() => setPage("care")}
      />
    ),
    diary: <DiaryScreen {...screenProps} />,
    analytics: <AnalyticsPage onOpenDoctorReport={() => setPage("report")} />,
    care: <CarePage />,
    islamic: <IslamicScreen {...screenProps} />,
    labs: <LabsScreen {...screenProps} />,
    report: <ReportScreen {...screenProps} />,
    profile: <ProfilePage />,
  };

  return (
    <div className="min-h-screen bg-mira-bg text-mira-text lg:flex">
      <Sidebar active={page} onChange={setPage} onCheckIn={openCheckIn} onBadState={() => setBadStateOpen(true)} isIslamic={isIslamic} />
      <main className="flex-1 pb-24 lg:pb-0">
        <div className={`mx-auto w-full px-4 py-6 sm:px-6 lg:py-8 ${page === "analytics" ? "max-w-[1180px]" : page === "labs" ? "max-w-[920px]" : "max-w-[660px]"}`}>
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
      <BottomNav active={page} onChange={setPage} onCheckIn={openCheckIn} onBadState={() => setBadStateOpen(true)} isIslamic={isIslamic} />
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
        {badStateOpen && (
          <PainModal
            open={badStateOpen}
            onClose={() => setBadStateOpen(false)}
            onOpenDoctorReport={() => {
              setBadStateOpen(false);
              setPage("report");
            }}
          />
        )}
        {delayCheckOpen && (
          <DelayCheckModal
            open={delayCheckOpen}
            onClose={() => setDelayCheckOpen(false)}
            data={data}
            persist={persist}
            delayDays={delayDays}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PrivacyLockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    const ok = await verifyPin(pin);
    if (ok) {
      setError("");
      onUnlock();
      return;
    }
    setPin("");
    setError("Неверный PIN");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-mira-bg px-4">
      <div className="w-full max-w-sm rounded-3xl border border-mira-lavender/20 bg-white p-6 shadow-soft">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-mira-lavender-light text-mira-primary">
          <span className="text-xl font-bold">M</span>
        </div>
        <h1 className="text-center text-xl font-bold text-mira-text">Mira защищена</h1>
        <p className="mt-1 text-center text-sm text-mira-muted">Введи PIN, чтобы открыть дневник.</p>
        <input
          value={pin}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={(event) => { if (event.key === "Enter") void submit(); }}
          inputMode="numeric"
          type="password"
          autoFocus
          className="mt-5 w-full rounded-2xl border border-mira-lavender/25 bg-mira-bg px-4 py-3 text-center text-lg font-bold tracking-[0.35em] text-mira-text outline-none focus:border-mira-primary"
          placeholder="••••"
        />
        {error && <p className="mt-2 text-center text-xs font-semibold text-mira-cycle">{error}</p>}
        <button
          type="button"
          onClick={() => void submit()}
          disabled={pin.length < 4}
          className="mt-4 w-full rounded-2xl bg-mira-primary px-4 py-3 text-sm font-bold text-white transition disabled:opacity-40"
        >
          Открыть
        </button>
        <p className="mt-4 text-center text-[11px] leading-relaxed text-mira-muted">
          PIN хранится только на этом устройстве и не отправляется в облако.
        </p>
      </div>
    </div>
  );
}
