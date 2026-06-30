"use client";

import { ReportScreen } from "@/components/screens/ReportScreen";
import { createEmpty } from "@/lib/store";

export default function Page() {
  return (
    <main className="min-h-screen bg-[#FAF8F5] px-5 py-6">
      <div className="mx-auto max-w-5xl">
        <ReportScreen
          data={createEmpty()}
          persist={() => undefined}
          navigate={() => undefined}
          onCheckIn={() => undefined}
          onBadState={() => undefined}
          onDelayCheck={() => undefined}
        />
      </div>
    </main>
  );
}
