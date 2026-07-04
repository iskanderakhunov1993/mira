"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { TodayPage } from "@/components/screens/TodayPage";
import { buildTodayDataFromStore } from "@/lib/routeData";
import { useMiraStore } from "@/store";

export function TodayRoute() {
  const router = useRouter();
  const cycle = useMiraStore((state) => state.cycle);
  const logs = useMiraStore((state) => state.logs.dailyLogs);
  const data = useMemo(() => buildTodayDataFromStore(cycle, logs), [cycle, logs]);

  return (
    <TodayPage
      data={data}
      onCheckIn={() => router.push("/track")}
      onAnalyticsCycles={() => router.push("/analysis#cycle-history")}
      onProfile={() => router.push("/profile")}
    />
  );
}
