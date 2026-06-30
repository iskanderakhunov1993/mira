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

  return (
    <div className={`fixed right-4 top-4 z-50 rounded-full px-3 py-1.5 text-xs font-black shadow-sm ${online ? "bg-white text-[#34C759]" : "bg-[#FFF0F0] text-[#FF6B6B]"}`}>
      {online ? "онлайн" : "офлайн"}
    </div>
  );
}
