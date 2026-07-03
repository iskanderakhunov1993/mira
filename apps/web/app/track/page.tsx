"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckInModal } from "@/components/screens/CheckInModal";
import { DiaryScreen } from "@/components/screens/DiaryScreen";
import type { NavPage } from "@/components/layout/types";
import { buildStoreStateFromLocalData } from "@/lib/localDataToStore";
import { createEmpty, readData, writeData } from "@/lib/store";
import { schedulePush } from "@/lib/sync";
import type { MiraLocalData } from "@/lib/types";
import { useMiraStore } from "@/store";

function routeFor(page: NavPage) {
  if (page === "today") return "/today";
  if (page === "care") return "/care";
  if (page === "analytics") return "/analysis";
  if (page === "diary") return "/track";
  return `/${page}`;
}

export default function Page() {
  const router = useRouter();
  const [data, setData] = useState<MiraLocalData>(() => createEmpty());
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkInDate, setCheckInDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    setData(readData());
  }, []);

  function persist(nextData: MiraLocalData) {
    setData(nextData);
    writeData(nextData);
    if (nextData.profile) useMiraStore.setState((state) => ({ ...state, ...buildStoreStateFromLocalData(nextData) }));
    schedulePush(nextData);
  }

  function openCheckIn(date?: string) {
    setCheckInDate(date);
    setCheckInOpen(true);
  }

  return (
    <>
      <main className="min-h-screen bg-[#050505] px-5 py-6">
        <div className="mx-auto max-w-5xl">
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
