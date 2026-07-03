"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ReportScreen } from "@/components/screens/ReportScreen";
import type { NavPage } from "@/components/layout/types";
import { createEmpty, readData, writeData } from "@/lib/store";
import type { MiraLocalData } from "@/lib/types";
import { mergeStoreIntoReportData } from "@/lib/miraStoreBridge";
import { useMiraStore } from "@/store";

function routeFor(page: NavPage) {
  if (page === "today") return "/today";
  if (page === "care") return "/care";
  if (page === "analytics") return "/analysis";
  return `/${page}`;
}

export default function Page() {
  const router = useRouter();
  const user = useMiraStore((state) => state.user);
  const cycle = useMiraStore((state) => state.cycle);
  const logs = useMiraStore((state) => state.logs.dailyLogs);
  const care = useMiraStore((state) => state.care);
  const [legacyData, setLegacyData] = useState<MiraLocalData>(() => createEmpty());

  useEffect(() => {
    setLegacyData(readData());
  }, []);

  const reportData = useMemo(
    () => mergeStoreIntoReportData(legacyData, user, cycle, logs, care),
    [care, cycle, legacyData, logs, user]
  );

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-6 text-[#F5F0ED]">
      <div className="mx-auto max-w-5xl">
        <ReportScreen
          data={reportData}
          persist={(nextData) => {
            writeData(nextData);
            setLegacyData(nextData);
          }}
          navigate={(page) => router.push(routeFor(page))}
          onCheckIn={() => router.push("/track")}
          onBadState={() => undefined}
          onDelayCheck={() => undefined}
        />
      </div>
    </main>
  );
}
