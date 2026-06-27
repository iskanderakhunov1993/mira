"use client";

import { ChevronRight, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getHealthSummary, statusMeta } from "@/lib/healthScore";
import type { MiraLocalData } from "@/lib/types";

/*
 * «Норма-скан» — что приложение уже поняло про твою норму.
 * Светофор по метрикам (цикл, боль, сон, энергия, настроение) + блок «когда к врачу».
 * Данные берём из getHealthSummary (тот же движок, что и мини-светофор).
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
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Норма-скан</p>
          <p className="text-sm font-bold text-mira-text">Что уже понятно</p>
        </div>
        <button
          onClick={onOpenAnalytics}
          className="flex items-center gap-0.5 text-xs font-semibold text-mira-primary transition active:scale-95"
        >
          Аналитика <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {summary.metrics.map((m) => {
          const meta = statusMeta[m.status];
          return (
            <button
              key={m.id}
              onClick={onOpenAnalytics}
              className="flex flex-col items-start rounded-2xl border p-3 text-left transition active:scale-[0.98]"
              style={{ borderColor: `${meta.color}33`, background: `${meta.bg}66` }}
            >
              <div className="mb-1 flex w-full items-center justify-between">
                <span className="text-base">{m.emoji}</span>
                <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
              </div>
              <p className="text-xs font-semibold text-mira-text">{m.label}</p>
              <p className="text-sm font-bold" style={{ color: meta.color }}>{m.verdict}</p>
              <p className="mt-0.5 text-[10px] leading-tight text-mira-muted">{m.detail}</p>
            </button>
          );
        })}
      </div>

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
