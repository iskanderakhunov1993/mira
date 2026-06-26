"use client";

import {
  Sun, ChartNoAxesCombined, HeartPulse, FileText, UserRound, Plus, Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavPage } from "./types";

export function BottomNav({
  active,
  onChange,
  onCheckIn,
  isIslamic,
}: {
  active: NavPage;
  onChange: (p: NavPage) => void;
  onCheckIn: () => void;
  isIslamic?: boolean;
}) {
  const left: { id: NavPage; label: string; icon: typeof Sun }[] = [
    { id: "today", label: "Сегодня", icon: Sun },
    { id: "analytics", label: "Аналитика", icon: ChartNoAxesCombined },
  ];

  const right: { id: NavPage; label: string; icon: typeof Sun }[] = isIslamic
    ? [{ id: "islamic", label: "Ибада", icon: Moon }, { id: "report", label: "Отчёт", icon: FileText }]
    : [{ id: "care", label: "Забота", icon: HeartPulse }, { id: "report", label: "Отчёт", icon: FileText }];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/40 bg-white/70 backdrop-blur-2xl lg:hidden" style={{ boxShadow: "0 -4px 30px rgba(155,142,196,0.08)" }}>
      <div className="relative flex items-end justify-around px-3 pb-[env(safe-area-inset-bottom,8px)] pt-2">
        {left.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-200",
              active === item.id ? "text-mira-primary bg-mira-lavender-light/50" : "text-mira-muted"
            )}
          >
            <item.icon className={cn("h-5 w-5 transition-transform duration-200", active === item.id && "scale-110")} />
            <span className="text-[10px] font-semibold">{item.label}</span>
            {active === item.id && <span className="h-1 w-1 rounded-full bg-mira-primary" />}
          </button>
        ))}

        {/* Center FAB */}
        <button
          onClick={onCheckIn}
          className="sheen relative -top-4 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-gradient-to-br from-[#C4B0E8] via-mira-primary to-mira-primary-deep shadow-[0_8px_28px_rgba(155,142,196,0.5),inset_0_1px_0_rgba(255,255,255,0.4)] transition-all duration-200 active:scale-90 hover:shadow-[0_14px_44px_rgba(155,142,196,0.6)] hover:-translate-y-1 animate-pulse-glow"
        >
          <Plus className="h-6 w-6 text-white drop-shadow-sm" strokeWidth={2.5} />
        </button>

        {right.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-200",
              active === item.id ? "text-mira-primary bg-mira-lavender-light/50" : "text-mira-muted"
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
