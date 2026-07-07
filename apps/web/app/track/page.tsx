"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckInModal } from "@/components/screens/CheckInModal";
import { DiaryScreen } from "@/components/screens/DiaryScreen";
import { LocalHealthRepository } from "@/data/healthRepository";
import type { NavPage } from "@/components/layout/types";
import { mergeHealthSnapshotIntoLegacy, mergeLegacyIntoHealthSnapshot } from "@/lib/healthSnapshotBridge";
import { syncDerivedStoresFromHealthSnapshot } from "@/lib/healthSnapshotClientSync";
import { createEmpty, readData } from "@/lib/store";
import type { MiraLocalData } from "@/lib/types";

function routeFor(page: NavPage) {
  if (page === "today") return "/today";
  if (page === "care") return "/today";
  if (page === "analytics") return "/analysis";
  if (page === "diary") return "/track";
  return `/${page}`;
}

export default function Page() {
  const router = useRouter();
  const [repository] = useState(() => new LocalHealthRepository());
  const [data, setData] = useState<MiraLocalData>(() => createEmpty());
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkInDate, setCheckInDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      const localData = readData();
      const snapshot = await repository.getSnapshot();
      const merged = snapshot.ok ? mergeHealthSnapshotIntoLegacy(localData, snapshot.data) : localData;
      if (!cancelled) {
        setData(merged);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [repository]);

  async function persist(nextData: MiraLocalData) {
    const currentSnapshot = await repository.getSnapshot();
    if (!currentSnapshot.ok) {
      setData(nextData);
      return;
    }

    const nextSnapshot = mergeLegacyIntoHealthSnapshot(currentSnapshot.data, nextData);
    if (nextSnapshot.profile) await repository.saveProfile(nextSnapshot.profile);
    await repository.saveSettings(nextSnapshot.settings);
    await Promise.all(nextSnapshot.cycles.map((cycle) => repository.saveCycle(cycle)));
    await Promise.all(nextSnapshot.dailyEntries.map((entry) => repository.saveDailyEntry(entry)));

    const savedSnapshot = await repository.getSnapshot();
    setData(savedSnapshot.ok ? syncDerivedStoresFromHealthSnapshot(savedSnapshot.data) : nextData);
  }

  function openCheckIn(date?: string) {
    setCheckInDate(date);
    setCheckInOpen(true);
  }

  return (
    <>
      <main className="min-h-screen bg-[#050505]">
        <div className="mx-auto max-w-[720px]">
          <DiaryScreen
            data={data}
            persist={persist}
            navigate={(page) => router.push(routeFor(page))}
            onCheckIn={openCheckIn}
            onBadState={() => undefined}
            onDelayCheck={() => undefined}
          />
        </div>
      </main>
      <CheckInModal
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        data={data}
        persist={persist}
        targetDate={checkInDate}
      />
    </>
  );
}
