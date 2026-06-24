"use client";

import {
  Sun, Calendar, BookOpen,
  ChartNoAxesCombined, UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavPage } from "./types";

const items: { id: NavPage; label: string; icon: typeof Sun }[] = [
  { id: "today", label: "Сегодня", icon: Sun },
  { id: "cycle", label: "Цикл", icon: Calendar },
  { id: "diary", label: "Дневник", icon: BookOpen },
  { id: "analytics", label: "Аналитика", icon: ChartNoAxesCombined },
  { id: "profile", label: "Профиль", icon: UserRound },
];

export function BottomNav({ active, onChange }: { active: NavPage; onChange: (p: NavPage) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-around border-t border-mira-lavender/20 bg-white/80 px-2 pb-[env(safe-area-inset-bottom,8px)] pt-2 backdrop-blur-sm lg:hidden">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={cn(
            "flex flex-col items-center gap-1 py-1 transition",
            active === item.id ? "text-mira-primary" : "text-mira-muted"
          )}
        >
          <item.icon className="h-5 w-5" />
          <span className="text-[10px] font-semibold">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
