"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
import type { NavPage } from "@/components/layout/types";
import { createEmpty, readData, writeData } from "@/lib/store";
import { schedulePush } from "@/lib/sync";
import { mergeStoreIntoReportData } from "@/lib/miraStoreBridge";
import type { MiraLocalData } from "@/lib/types";
import { useMiraStore } from "@/store";

function routeFor(page: NavPage) {
  if (page === "today") return "/today";
  if (page === "care") return "/today";
  if (page === "analytics") return "/analysis";
  if (page === "diary") return "/track";
  return `/${page}`;
}

export function ProfileRoute() {
  const router = useRouter();
  const user = useMiraStore((state) => state.user);
  const cycle = useMiraStore((state) => state.cycle);
  const logs = useMiraStore((state) => state.logs.dailyLogs);
  const care = useMiraStore((state) => state.care);
  const [data, setData] = useState<MiraLocalData>(() => createEmpty());
  const profileData = useMemo(
    () => mergeStoreIntoReportData(data, user, cycle, logs, care),
    [care, cycle, data, logs, user]
  );

  useEffect(() => {
    setData(readData());
  }, []);

  function persist(nextData: MiraLocalData) {
    setData(nextData);
    writeData(nextData);
    schedulePush(nextData);
  }

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-6">
      <div className="mx-auto max-w-5xl">
        <ProfileScreen
          data={profileData}
          persist={persist}
          navigate={(page) => router.push(routeFor(page))}
          onCheckIn={() => router.push("/track")}
          onBadState={() => undefined}
          onDelayCheck={() => undefined}
        />
      </div>
    </main>
  );
}
