"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TodayPage } from "@/components/screens/TodayPage";
import { PainModal } from "@/components/screens/PainModal";
import { buildTodayDataFromStore } from "@/lib/routeData";
import { useMiraStore } from "@/store";

export function TodayRoute() {
  const router = useRouter();
  const [painOpen, setPainOpen] = useState(false);
  const cycle = useMiraStore((state) => state.cycle);
  const logs = useMiraStore((state) => state.logs.dailyLogs);
  const data = useMemo(() => buildTodayDataFromStore(cycle, logs), [cycle, logs]);

  return (
    <>
      <TodayPage
        data={data}
        onPain={() => setPainOpen(true)}
        onPeriod={() => router.push("/track")}
        onCheckIn={() => router.push("/track")}
        onAnalyticsCycles={() => router.push("/analysis#cycle-history")}
      />
      <PainModal
        open={painOpen}
        onClose={() => setPainOpen(false)}
        onOpenDoctorReport={() => {
          setPainOpen(false);
          router.push("/report");
        }}
      />
    </>
  );
}
