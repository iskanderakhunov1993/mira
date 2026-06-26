"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/ui/CountUp";
import { getStreak, getGarden, getDailyRitual } from "@/lib/gamification";
import type { MiraLocalData } from "@/lib/types";

export function GardenCard({ data, onCheckIn }: { data: MiraLocalData; onCheckIn?: (date?: string) => void }) {
  const streak = getStreak(data);
  const garden = getGarden(data);
  const ritual = getDailyRitual(data);

  const progress = garden.nextAt
    ? Math.min(100, Math.round((garden.totalDays / garden.nextAt) * 100))
    : 100;

  return (
    <Card className="sheen p-4 border-0 bg-gradient-to-br from-[#EAF6EE] via-[#F2EDFA] to-white overflow-hidden animate-gradient">
      <div className="flex items-center gap-4">
        {/* Растение */}
        <motion.button
          onClick={() => onCheckIn?.()}
          whileTap={{ scale: 0.85 }}
          className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/70 shadow-inner-glow"
        >
          <motion.span
            key={garden.emoji}
            initial={{ scale: 0.5, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 12 }}
            className="text-3xl animate-wobble"
          >
            {garden.emoji}
          </motion.span>
          {!ritual.done && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mira-primary/40" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-mira-primary" />
            </span>
          )}
        </motion.button>

        {/* Текст + прогресс */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-mira-text">{garden.title}</p>
            {/* Streak */}
            <div className="flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 shadow-sm">
              <span className="text-xs animate-breathe">🔥</span>
              <span className="text-xs font-bold text-mira-text"><CountUp value={streak.current} /></span>
            </div>
          </div>

          <p className="text-[11px] text-mira-muted mt-0.5">{ritual.title}</p>

          {/* прогресс до следующей стадии */}
          {garden.nextAt && (
            <div className="mt-2">
              <div className="h-1.5 rounded-full bg-white/60 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-mira-success to-mira-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
              <p className="text-[9px] text-mira-muted mt-1">
                {garden.totalDays} / {garden.nextAt} дней до следующей стадии
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
