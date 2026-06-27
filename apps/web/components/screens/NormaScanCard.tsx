"use client";

import { ChevronRight, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getHealthSummary, statusMeta } from "@/lib/healthScore";
import type { MiraLocalData } from "@/lib/types";

/*
 * «Норма-скан» на главной — компактный светофор: по кружку на метрику
 * (норм / стоит следить / к врачу / нет данных), без текста. Подробный
 * разбор — на странице «Аналитика» по тапу.
 */

type Props = {
  data: MiraLocalData;
  onOpenAnalytics: () => void;
  onOpenReport: () => void;
};

export function NormaScanCard({ data, onOpenAnalytics, onOpenReport }: Props) {
  const summary = getHealthSummary(data);
  const concerns = summary.metrics.filter((m) => m.status === "concern");

  return (
    <Card className="p-4">
      <button onClick={onOpenAnalytics} className="mb-3 flex w-full items-center justify-between">
        <div className="text-left">
          <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Норма-скан</p>
          <p className="text-sm font-bold text-mira-text">Что уже понятно</p>
        </div>
        <span className="flex items-center gap-0.5 text-xs font-semibold text-mira-primary">
          Аналитика <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </button>

      {/* Список метрик: эмодзи + надпись + кружок-светофор */}
      <button onClick={onOpenAnalytics} className="flex w-full flex-col gap-1">
        {summary.metrics.map((m) => {
          const meta = statusMeta[m.status];
          return (
            <div key={m.id} className="flex items-center gap-2.5 rounded-xl px-1.5 py-2">
              <span className="text-lg leading-none">{m.emoji}</span>
              <span className="flex-1 text-left text-sm font-semibold text-mira-text">{m.label}</span>
              <span
                className="h-3.5 w-3.5 rounded-full border-2"
                style={{ background: meta.color, borderColor: `${meta.color}55` }}
              />
            </div>
          );
        })}
      </button>

      {/* Когда к врачу */}
      <div className="mt-3 flex items-center justify-between rounded-2xl border border-mira-lavender/20 bg-mira-bg/60 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Когда к врачу</p>
          <p className="text-xs font-semibold text-mira-text">
            {concerns.length > 0
              ? `Стоит обсудить: ${concerns.map((c) => c.label.toLowerCase()).join(", ")}`
              : "Сейчас срочных сигналов нет"}
          </p>
        </div>
        <button
          onClick={onOpenReport}
          className="ml-3 flex shrink-0 items-center gap-1 rounded-full bg-mira-primary px-3 py-1.5 text-xs font-semibold text-white transition active:scale-95"
        >
          <FileText className="h-3.5 w-3.5" /> Отчёт
        </button>
      </div>
    </Card>
  );
}
