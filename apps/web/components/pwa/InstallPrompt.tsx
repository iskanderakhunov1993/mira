"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  }

  if (!promptEvent || installed) return null;

  return (
    <div className="fixed bottom-24 left-3 right-3 z-30 mx-auto max-w-[480px] rounded-[24px] border border-[#2E2826] bg-[#1D1816] p-4 text-[#F5F0ED] shadow-[0_18px_44px_rgba(0,0,0,0.34)]">
      <p className="text-sm font-black text-[#F5F0ED]">Установить Mira</p>
      <p className="mt-1 text-xs font-semibold leading-relaxed text-[#B7AAA4]">
        Добавь приложение на главный экран телефона, чтобы открывать его как нативное.
      </p>
      <Button
        type="button"
        className="mt-4 w-full rounded-2xl bg-[#84E600] text-[#11100F] hover:bg-[#73CC00]"
        onClick={install}
      >
        Установить приложение
      </Button>
    </div>
  );
}
