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

  return (
    <div className="rounded-2xl bg-[#FAF8F5] p-4">
      <p className="text-sm font-black text-[#1A1A1A]">📲 Установить Mira</p>
      <p className="mt-1 text-sm font-semibold leading-relaxed text-[#8E8E93]">
        Добавь приложение на главный экран телефона, чтобы открывать его как нативное.
      </p>
      <Button
        type="button"
        className="mt-4 w-full rounded-2xl bg-[#E872A0] text-white hover:bg-[#D95F8E]"
        disabled={!promptEvent || installed}
        onClick={install}
      >
        {installed ? "Уже установлено" : promptEvent ? "Установить приложение" : "Установка доступна в меню браузера"}
      </Button>
    </div>
  );
}
