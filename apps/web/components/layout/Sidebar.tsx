"use client";

import {
  Sun, Calendar, BookOpen, Salad, Dumbbell,
  ChartNoAxesCombined, UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MiraLogo } from "@/components/ui/MiraLogo";
import type { NavPage } from "./types";

const items: { id: NavPage; label: string; icon: typeof Sun }[] = [
  { id: "today", label: "Сегодня", icon: Sun },
  { id: "cycle", label: "Цикл", icon: Calendar },
  { id: "diary", label: "Дневник", icon: BookOpen },
  { id: "nutrition", label: "Питание", icon: Salad },
  { id: "workout", label: "Тренировка", icon: Dumbbell },
  { id: "analytics", label: "Аналитика", icon: ChartNoAxesCombined },
  { id: "profile", label: "Профиль", icon: UserRound },
];

export function Sidebar({ active, onChange }: { active: NavPage; onChange: (p: NavPage) => void }) {
  return (
    <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-mira-lavender/20 bg-mira-bg p-4 h-screen sticky top-0">
      <div className="mb-6 flex items-center gap-2.5 px-3">
        <MiraLogo size={32} />
        <span className="text-base font-bold text-mira-text">Mira</span>
      </div>

      <nav className="flex-1 space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
              active === item.id
                ? "bg-mira-lavender-light font-semibold text-mira-primary"
                : "text-mira-muted hover:bg-mira-lavender-light/50"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
