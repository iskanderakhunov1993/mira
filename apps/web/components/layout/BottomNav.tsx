"use client";

import {
  Sun, CalendarDays, ChartNoAxesCombined, FileText, HeartPulse, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavPage } from "./types";

export function BottomNav({
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
  const left: { id: NavPage; label: string; icon: typeof Sun }[] = [
    { id: "today", label: "Сегодня", icon: Sun },
    { id: "diary", label: "Дневник", icon: CalendarDays },
  ];

  const right: { id: NavPage; label: string; icon: typeof Sun }[] = [
    { id: "analytics", label: "Аналитика", icon: ChartNoAxesCombined },
    { id: "report", label: "Отчёт", icon: FileText },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-mira-lavender/20 bg-white/95 backdrop-blur-xl lg:hidden" style={{ boxShadow: "0 -10px 28px rgba(45,38,64,0.08)" }}>
      <button
        type="button"
        onClick={onBadState}
        className="absolute -top-12 right-3 inline-flex items-center gap-2 rounded-full border border-mira-cycle/20 bg-white/95 px-3 py-2 text-xs font-bold text-mira-cycle shadow-soft backdrop-blur transition active:scale-[0.98]"
      >
        <HeartPulse className="h-4 w-4" />
        Мне плохо
      </button>

      <div className="relative flex items-end justify-around px-2 pb-[env(safe-area-inset-bottom,8px)] pt-2">
        {left.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              "flex min-w-[58px] flex-col items-center gap-1 rounded-lg px-2 py-1.5 transition-all duration-200",
              active === item.id ? "bg-mira-lavender-light text-mira-primary" : "text-mira-muted"
            )}
          >
            <item.icon className={cn("h-5 w-5 transition-transform duration-200", active === item.id && "scale-110")} />
            <span className="text-[10px] font-semibold">{item.label}</span>
            {active === item.id && <span className="h-1 w-1 rounded-full bg-mira-primary" />}
          </button>
        ))}

        {/* Center FAB */}
        <button
          aria-label="Отметить состояние"
          onClick={onCheckIn}
          className="relative -top-3 flex min-w-[76px] flex-col items-center justify-center gap-0.5 rounded-xl bg-mira-primary px-3 py-2 text-white shadow-[0_10px_26px_rgba(155,142,196,0.34)] transition-all duration-200 active:scale-[0.97]"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          <span className="text-[10px] font-bold leading-none">Отметить</span>
        </button>

        {right.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              "flex min-w-[58px] flex-col items-center gap-1 rounded-lg px-2 py-1.5 transition-all duration-200",
              active === item.id ? "bg-mira-lavender-light text-mira-primary" : "text-mira-muted"
            )}
          >
            <item.icon className={cn("h-5 w-5 transition-transform duration-200", active === item.id && "scale-110")} />
            <span className="text-[10px] font-semibold">{item.label}</span>
            {active === item.id && <span className="h-1 w-1 rounded-full bg-mira-primary" />}
          </button>
        ))}
      </div>
    </nav>
  );
}
