"use client";

import { Activity, Bell, CalendarDays, ChevronRight, Droplets, HeartPulse, Moon, Plus, SmilePlus, Sparkles, ThermometerSun, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/Chip";
import type { CheckIn } from "@/types/health";
import type { TodayViewModel } from "@/features/today/types";
import type { AddAction } from "@/features/add/types";

interface NewTodayPageProps {
  model: TodayViewModel;
  loading?: boolean;
  offline?: boolean;
  saving?: boolean;
  onCheckIn: (value: CheckIn["value"]) => void;
  onQuickTracker: () => void;
  onOnboarding: () => void;
  onAdd: () => void;
  onAddAction: (action: AddAction) => void;
}

const checkInOptions: Array<{ value: CheckIn["value"]; label: string }> = [
  { value: "good", label: "Хорошо" },
  { value: "normal", label: "Обычно" },
  { value: "not_great", label: "Не очень" },
  { value: "hard", label: "Тяжело" },
];

const trackerIcons = {
  water: Droplets,
  sleep: Moon,
  basal_temperature: ThermometerSun,
};

function checkInUiLabel(value: TodayViewModel["checkIn"]) {
  if (value === "good") return "Хорошо";
  if (value === "normal") return "Обычно";
  if (value === "not_great") return "Не очень";
  if (value === "hard") return "Тяжело";
  return null;
}

function dashboardMetrics(model: TodayViewModel) {
  const metrics = [
    {
      label: model.quickTracker.label,
      value: model.quickTracker.valueLabel,
      hint: model.quickTracker.actionLabel,
      icon: trackerIcons[model.quickTracker.type],
      tone: "bg-[var(--mira-token-lavender)] text-[var(--mira-token-primary)]",
    },
    {
      label: "Самочувствие",
      value: checkInUiLabel(model.checkIn) ?? "Не отмечено",
      hint: model.checkIn ? "изменить" : "отметить",
      icon: SmilePlus,
      tone: "bg-[var(--mira-token-peach)] text-[#A45F4C]",
    },
    {
      label: "Энергия",
      value: model.cardState === "period_soon" ? "Может снижаться" : "Обычная",
      hint: "контекст дня",
      icon: Zap,
      tone: "bg-[var(--mira-token-warning)] text-[#8A641D]",
    },
    {
      label: "Фаза",
      value: model.cycleDay ? model.cycleBadge : "пока без даты",
      hint: model.cardState === "long_cycle" ? "широкий прогноз" : "ориентировочно",
      icon: CalendarDays,
      tone: "bg-[var(--mira-token-sage)] text-[#35624B]",
    },
  ];

  return metrics.slice(0, model.hasProfile ? 4 : 2);
}

export function NewTodayPage({
  model,
  loading,
  offline,
  saving,
  onCheckIn,
  onQuickTracker,
  onOnboarding,
  onAdd,
  onAddAction,
}: NewTodayPageProps) {
  const metrics = dashboardMetrics(model);

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--mira-token-background)] px-5 pb-28 pt-6 text-[var(--mira-token-foreground)]">
        <div className="mx-auto max-w-md space-y-4">
          <div className="h-9 w-44 animate-pulse rounded-[8px] bg-[var(--mira-token-card-muted)]" />
          <div className="h-44 animate-pulse rounded-[8px] bg-[var(--mira-token-card)]" />
          <div className="h-28 animate-pulse rounded-[8px] bg-[var(--mira-token-card)]" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--mira-token-background)] px-5 pb-28 pt-6 text-[var(--mira-token-foreground)]">
      <div className="pointer-events-none fixed -left-20 -top-24 h-72 w-72 rounded-full bg-[var(--mira-token-lavender)] opacity-50 blur-3xl" />
      <div className="pointer-events-none fixed -right-24 top-24 h-80 w-80 rounded-full bg-[var(--mira-token-peach)] opacity-55 blur-3xl" />
      <div className="relative mx-auto max-w-md">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[var(--mira-token-muted)]">Доброе утро</p>
            <h1 className="mt-1 text-[34px] font-black leading-none">Сегодня</h1>
            <p className="mt-2 text-sm font-semibold capitalize text-[var(--mira-token-muted)]">{model.dateLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <Chip tone={model.cycleDay ? "success" : "neutral"}>{model.cycleBadge}</Chip>
            <button
              type="button"
              aria-label="Уведомления"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--mira-token-border)] bg-[var(--mira-token-card)] text-[var(--mira-token-primary)] shadow-[0_10px_24px_rgba(86,70,104,0.08)]"
            >
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </header>

        {offline && (
          <div className="mt-4 rounded-[8px] border border-[var(--mira-token-border)] bg-[var(--mira-token-card-muted)] px-4 py-3 text-sm font-bold text-[var(--mira-token-muted)]">
            Offline-режим. Записи сохраняются локально на устройстве.
          </div>
        )}

        <Card className="relative mt-5 overflow-hidden border-[#F1DCD4] bg-[var(--mira-token-peach)] p-4 shadow-[0_18px_44px_rgba(173,118,94,0.10)]">
          <div className="pointer-events-none absolute -right-8 top-8 h-32 w-32 rounded-full bg-[#E7B8C8]/40" />
          <div className="pointer-events-none absolute right-10 top-14 h-20 w-20 rounded-full bg-[#C897BC]/35" />
          <div className="relative flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/70 text-[var(--mira-token-primary)]">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black text-[var(--mira-token-muted)]">Сейчас</p>
              <h2 className="mt-1 text-[25px] font-black leading-tight">{model.cardTitle}</h2>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--mira-token-muted)]">{model.cardBody}</p>
              <button type="button" onClick={onAdd} className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-black text-[var(--mira-token-primary)]">
                Узнать почему <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          {!model.hasProfile && (
            <Button type="button" className="mt-5 w-full" onClick={onOnboarding}>
              Настроить Mira <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </Card>

        <section className="mt-5">
          <h2 className="mb-3 text-lg font-black">Что отметить быстро?</h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { action: "period" as const, label: "Месячные", icon: HeartPulse },
              { action: "symptom" as const, label: "Симптом", icon: Activity },
              { action: "wellbeing" as const, label: "Мне плохо", icon: SmilePlus },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.action}
                  type="button"
                  aria-label={`Быстро отметить: ${item.label}`}
                  onClick={() => onAddAction(item.action)}
                  className="min-h-[94px] rounded-[22px] border border-[var(--mira-token-border)] bg-[var(--mira-token-card)] px-2 py-3 text-center text-xs font-black shadow-[0_12px_30px_rgba(86,70,104,0.06)] transition active:scale-[0.98]"
                >
                  <span className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mira-token-lavender)] text-[var(--mira-token-primary)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black">Как вы себя чувствуете?</h2>
            {saving && <span className="text-xs font-black text-[var(--mira-token-muted)]">сохраняем...</span>}
          </div>
          <div className="grid grid-cols-4 gap-2 rounded-[24px] border border-[var(--mira-token-border)] bg-[var(--mira-token-card)] p-3 shadow-[0_12px_30px_rgba(86,70,104,0.06)]">
            {checkInOptions.map((option) => {
              const active = model.checkIn === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-label={`Отметить самочувствие: ${option.label}`}
                  aria-pressed={active}
                  onClick={() => onCheckIn(option.value)}
                  className={`min-h-[74px] rounded-[20px] px-1 text-xs font-black transition active:scale-[0.98] ${
                    active
                      ? "bg-[var(--mira-token-lavender)] text-[var(--mira-token-primary)]"
                      : "text-[var(--mira-token-muted)]"
                  }`}
                >
                  <span className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--mira-token-card-muted)] text-base">
                    {option.value === "good" ? ":)" : option.value === "hard" ? ":(" : ":|"}
                  </span>
                  {option.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black">Ваши показатели сегодня</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <button
                  key={metric.label}
                  type="button"
                  onClick={index === 0 ? onQuickTracker : onAdd}
                  className="min-h-[112px] rounded-[24px] border border-[var(--mira-token-border)] bg-[var(--mira-token-card)] p-4 text-left shadow-[0_12px_30px_rgba(86,70,104,0.06)] transition active:scale-[0.98]"
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full ${metric.tone}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="mt-3 block text-sm font-black text-[var(--mira-token-muted)]">{metric.label}</span>
                  <span className="mt-1 block text-[19px] font-black leading-tight">{metric.value}</span>
                  <span className="mt-2 block text-sm font-bold text-[var(--mira-token-primary)]">{metric.hint}</span>
                </button>
              );
            })}
          </div>
        </section>

        {model.insight && (
          <Card className="mt-5 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mira-token-lavender)] text-[var(--mira-token-primary)]">
                  <Sparkles className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-black">{model.insight.title}</h2>
              </div>
              <Chip>{model.insight.sample}</Chip>
            </div>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-[var(--mira-token-muted)]">{model.insight.body}</p>
          </Card>
        )}

        <Card className="mt-5 border-[var(--mira-token-border)] bg-[var(--mira-token-sage)] p-5">
          <h2 className="text-lg font-black">Сегодня можно немного бережнее к себе.</h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--mira-token-muted)]">{model.recommendation}</p>
          <Button type="button" variant="ghost" className="mt-4 w-full" onClick={onAdd}>
            <Plus className="h-4 w-4" /> Добавить другое
          </Button>
        </Card>
      </div>
    </main>
  );
}
