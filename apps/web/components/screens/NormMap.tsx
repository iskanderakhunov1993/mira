"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { getNormMap, getNormOverallPercent } from "@/lib/insights";
import type { MiraLocalData } from "@/lib/types";

const statusColors: Record<string, string> = {
  empty: "bg-mira-lavender/30",
  building: "bg-[#C4B07E]",
  preliminary: "bg-mira-primary",
  stable: "bg-mira-success",
};

const categoryColors: Record<string, string> = {
  cycle: "from-mira-cycle to-mira-primary",
  pain: "from-[#C47E9B] to-[#C4A07E]",
  sleep: "from-[#7E8EC4] to-[#9B8EC4]",
  mood: "from-[#9B8EC4] to-[#B8A5D8]",
  energy: "from-[#C4B07E] to-[#C4A07E]",
};

export function NormMap({ data }: { data: MiraLocalData }) {
  const normMap = getNormMap(data);
  const overallPercent = getNormOverallPercent(data);

  return (
    <Card className="border-mira-primary/10 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-mira-primary">
            Что я уже изучила
          </p>
          <p className="mt-0.5 text-xs text-mira-muted">
            {overallPercent < 20 ? "Только начинаем тебя узнавать" :
             overallPercent < 50 ? "Собираю твои паттерны" :
             overallPercent < 80 ? "Уже многое понятно" :
             "Хорошо тебя знаю"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative h-12 w-12">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#EDE8F5" strokeWidth="3" />
              <motion.circle
                cx="18" cy="18" r="15" fill="none" stroke="#9B8EC4" strokeWidth="3"
                strokeLinecap="round"
                initial={{ strokeDasharray: "0 94.25" }}
                animate={{ strokeDasharray: `${(overallPercent / 100) * 94.25} ${94.25 - (overallPercent / 100) * 94.25}` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-mira-text">
              {overallPercent}%
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {normMap.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-mira-text">{cat.label}</span>
              <span className="text-[10px] text-mira-muted">{cat.description}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-mira-lavender-light overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${categoryColors[cat.id] ?? "from-mira-primary to-mira-primary-deep"}`}
                initial={{ width: 0 }}
                animate={{ width: `${cat.percent}%` }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
