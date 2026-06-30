"use client";

import {
  Sun, CalendarDays, ChartNoAxesCombined, HeartPulse, FileText, UserRound, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MiraLogo } from "@/components/ui/MiraLogo";
import type { NavPage } from "./types";

const baseItems: { id: NavPage; label: string; icon: typeof Sun }[] = [
  { id: "today", label: "Сегодня", icon: Sun },
  { id: "diary", label: "Дневник", icon: CalendarDays },
  { id: "analytics", label: "Аналитика", icon: ChartNoAxesCombined },
  { id: "care", label: "Забота", icon: HeartPulse },
  { id: "report", label: "Отчёт врачу", icon: FileText },
  { id: "profile", label: "Профиль", icon: UserRound },
];

export function Sidebar({
  active,
  onChange,
  onCheckIn,
  onBadState,
}: {
  active: NavPage;
  onChange: (p: NavPage) => void;
  onCheckIn: () => void;
  onBadState: () => void;
  isIslamic?: boolean;
}) {
  const items = baseItems;
  return (
    <aside className="hidden lg:flex h-screen w-60 shrink-0 sticky top-0 flex-col border-r border-mira-lavender/20 bg-white/90 p-4">
      <div className="mb-6 flex items-center gap-2.5 px-3">
        <MiraLogo size={32} />
        <div>
          <span className="text-sm font-bold text-mira-text">Mira</span>
          <p className="text-[10px] text-mira-muted">Понять день и подготовиться</p>
        </div>
      </div>

      <button
        onClick={onCheckIn}
        className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg bg-mira-primary px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(155,142,196,0.25)] transition hover:bg-mira-primary-deep active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        Отметить состояние
      </button>

      <button
        onClick={onBadState}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-mira-cycle/20 bg-[#F8E8EE]/45 px-4 py-2.5 text-sm font-semibold text-mira-cycle transition hover:bg-[#F8E8EE]/70 active:scale-[0.98]"
      >
        <HeartPulse className="h-4 w-4" strokeWidth={2.5} />
        Мне плохо
      </button>

      <nav className="flex-1 space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              "relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
              active === item.id
                ? "bg-mira-lavender-light font-semibold text-mira-primary before:absolute before:left-0 before:top-2 before:h-5 before:w-1 before:rounded-r-full before:bg-mira-primary"
                : "text-mira-muted hover:bg-mira-lavender-light/50"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto rounded-lg border border-mira-lavender/20 bg-mira-bg p-3">
        <p className="text-[10px] font-semibold text-mira-muted uppercase tracking-widest">Приватность</p>
        <p className="mt-1 text-xs text-mira-muted">Ты управляешь хранением и синхронизацией</p>
      </div>
    </aside>
  );
}
