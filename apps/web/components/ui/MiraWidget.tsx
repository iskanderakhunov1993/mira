"use client";

import React, { memo, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type MiraMood = "happy" | "sleepy" | "thoughtful" | "glowing" | "sad" | "hero";

export interface MiraWidgetProps {
  percentage: number;
  daysTracked: number;
  totalDays: number;
  mood: MiraMood;
  message: string;
  streakDays?: number;
  className?: string;
}

const moodConfig: Record<MiraMood, {
  emoji: string;
  label: string;
  title: string;
  description: string;
  bgColor: string;
  accent: string;
  statEmoji: string;
}> = {
  happy: {
    emoji: "◕",
    label: "Счастлива",
    title: "Мига счастлива! Она сияет.",
    description: "У нас отличная серия! Продолжай!",
    bgColor: "bg-green-50",
    accent: "#34C759",
    statEmoji: "🔥",
  },
  sleepy: {
    emoji: "◠",
    label: "Сонная",
    title: "Мига скучает по тебе.",
    description: "Я скучаю по тебе. Запиши что-нибудь.",
    bgColor: "bg-blue-50",
    accent: "#5BA7E5",
    statEmoji: "😴",
  },
  thoughtful: {
    emoji: "◔",
    label: "Задумчивая",
    title: "Мига думает, что лучше отметить.",
    description: "Хорошо, но можно лучше. Давай добавим воду?",
    bgColor: "bg-yellow-50",
    accent: "#FFB800",
    statEmoji: "💭",
  },
  glowing: {
    emoji: "✦",
    label: "Сияет",
    title: "Мига сияет! 30 дней подряд — это мощь!",
    description: "Мы суперкоманда! 30 дней — это мощь!",
    bgColor: "bg-purple-50",
    accent: "#A87CE8",
    statEmoji: "🌟",
  },
  sad: {
    emoji: "☹",
    label: "Грустная",
    title: "Мига рядом. Сегодня тяжело.",
    description: "Я с тобой. Сегодня тяжело, но мы справимся.",
    bgColor: "bg-gray-50",
    accent: "#8E8E93",
    statEmoji: "🤍",
  },
  hero: {
    emoji: "⚔️",
    label: "Героиня",
    title: "Мига — героиня! Ты готова к врачу.",
    description: "Мы прошли 3 цикла! Ты готова к врачу?",
    bgColor: "bg-red-50",
    accent: "#FF6B6B",
    statEmoji: "🦸‍♀️",
  },
};

function normalizePercentage(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function MiraWidgetComponent({
  percentage,
  daysTracked,
  totalDays,
  mood,
  message,
  streakDays,
  className,
}: MiraWidgetProps) {
  const config = moodConfig[mood];
  const progress = normalizePercentage(percentage);

  const circle = useMemo(() => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const dash = circumference * (progress / 100);
    const gap = circumference - dash;
    return { radius, dash, gap };
  }, [progress]);

  return (
    <Card className={cn("rounded-2xl border-0 bg-white p-5 text-center shadow-[0_4px_12px_rgba(0,0,0,0.05)]", className)}>
      <p className="text-sm font-black uppercase tracking-widest text-[#8E8E93]">✨ Твоя Mira сегодня</p>

      <div className="group relative mx-auto mt-5 h-36 w-36 sm:h-40 sm:w-40">
        <svg className="h-36 w-36 -rotate-90 sm:h-40 sm:w-40" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r={circle.radius} fill="none" stroke="#FFE4EC" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r={circle.radius}
            fill="none"
            stroke="#E872A0"
            strokeWidth="8"
            strokeDasharray={`${circle.dash} ${circle.gap}`}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            key={mood}
            className={cn(
              "flex h-20 w-20 items-center justify-center rounded-full text-6xl shadow-sm transition-all duration-300 group-hover:scale-105",
              config.bgColor
            )}
            style={{ color: config.accent, animation: "miraMoodIn 300ms ease both" }}
            aria-label={`Мига: ${config.label}`}
          >
            {config.emoji}
          </div>
          <p className="mt-1 text-sm font-black text-[#1A1A1A]">{progress}%</p>
        </div>

        <div className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-[#1A1A1A] px-3 py-2 text-xs font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
          Мига {config.label.toLowerCase()}!
        </div>
      </div>

      <div className="mt-4">
        <p className="text-4xl font-black text-[#1A1A1A]">{daysTracked}</p>
        <p className="text-sm font-bold text-[#8E8E93]">
          из {totalDays} дней отмечено {config.statEmoji}
        </p>
        {typeof streakDays === "number" && streakDays > 0 && (
          <p className="mt-1 text-xs font-black text-[#E872A0]">серия {streakDays} дня</p>
        )}
        <p className="mt-3 text-base font-black text-[#1A1A1A]">{config.title}</p>
        <p className="mt-1 text-sm font-semibold leading-relaxed text-[#8E8E93]">{config.description}</p>
      </div>

      <p className="mt-4 rounded-2xl bg-[#FAF8F5] px-4 py-3 text-sm italic leading-relaxed text-[#8E8E93]">
        💬 “{message}”
      </p>

      <style jsx global>{`
        @keyframes miraMoodIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </Card>
  );
}

export const MiraWidget = memo(MiraWidgetComponent);
MiraWidget.displayName = "MiraWidget";

export default MiraWidget;
