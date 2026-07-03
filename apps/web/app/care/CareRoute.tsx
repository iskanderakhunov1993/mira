"use client";

import { useMemo } from "react";
import { CarePage } from "@/components/screens/CarePage";
import { buildCareDataFromStore } from "@/lib/routeData";
import { useMiraStore } from "@/store";

export function CareRoute() {
  const cycle = useMiraStore((state) => state.cycle);
  const logs = useMiraStore((state) => state.logs.dailyLogs);
  const care = useMiraStore((state) => state.care);
  const data = useMemo(() => buildCareDataFromStore(cycle, care, logs), [care, cycle, logs]);

  return <CarePage data={data} />;
}
