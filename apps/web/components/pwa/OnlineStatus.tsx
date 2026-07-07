"use client";

import { useEffect, useState } from "react";

export function OnlineStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed right-4 top-[calc(env(safe-area-inset-top)+12px)] z-50 rounded-full bg-[#FFF0F0] px-3 py-1.5 text-xs font-black text-[#FF6B6B] shadow-sm">
      офлайн
    </div>
  );
}
