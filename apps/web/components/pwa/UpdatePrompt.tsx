"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type RegistrationWithWaiting = ServiceWorkerRegistration & {
  waiting: ServiceWorker | null;
};

export function UpdatePrompt() {
  const [registration, setRegistration] = useState<RegistrationWithWaiting | null>(null);

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const custom = event as CustomEvent<RegistrationWithWaiting>;
      setRegistration(custom.detail);
    };
    window.addEventListener("mira-sw-update", handleUpdate);
    return () => window.removeEventListener("mira-sw-update", handleUpdate);
  }, []);

  function update() {
    registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
    window.location.reload();
  }

  if (!registration) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl bg-white p-4 shadow-[0_16px_44px_rgba(0,0,0,0.16)]">
      <p className="text-sm font-black text-[#1A1A1A]">Доступно обновление</p>
      <p className="mt-1 text-sm font-semibold text-[#8E8E93]">Можно обновить Mira до новой версии.</p>
      <Button type="button" className="mt-3 w-full rounded-2xl bg-[#E872A0] text-white" onClick={update}>
        Обновить
      </Button>
    </div>
  );
}
