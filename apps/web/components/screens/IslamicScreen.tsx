"use client";

import { useState } from "react";
import { Shield, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { saveIslamicEntry, getIslamicEntry, countQadaDays, dateKey } from "@/lib/store";
import type { MiraLocalData, IslamicEntry, FastingStatus } from "@/lib/types";

type Props = {
  data: MiraLocalData;
  persist: (data: MiraLocalData) => void;
};

const islamicCategories = [
  { id: "hayd" as const, label: "Хайд", desc: "Менструация (фикх)", emoji: "🔴", info: "Период хайда — освобождение от намаза и поста" },
  { id: "istihadha" as const, label: "Истихада", desc: "Кровотечение вне хайда", emoji: "🟡", info: "Кровотечение, не являющееся хайдом" },
  { id: "nifas" as const, label: "Нифас", desc: "Послеродовое кровотечение", emoji: "🟣", info: "Период после родов" },
  { id: "purity" as const, label: "Чистота", desc: "Состояние тахара", emoji: "⚪", info: "Чистое состояние — все обязанности в силе" },
  { id: "ghusl" as const, label: "Гусль", desc: "Полное омовение", emoji: "💧", info: "Отметить совершение полного омовения" },
];

const fastingOptions: { id: FastingStatus; label: string; desc: string }[] = [
  { id: "fasted", label: "Постилась", desc: "Пост выдержан" },
  { id: "missed", label: "Пропущен", desc: "Добавится к восполнению" },
  { id: "exempt", label: "Освобождена", desc: "Хайд/нифас/болезнь" },
  { id: "makeup", label: "Восполнение", desc: "Каза — восполнение пропущенного" },
];

export function IslamicScreen({ data, persist }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const today = dateKey();
  const entry = getIslamicEntry(data) ?? {};
  const qadaDays = countQadaDays(data);

  function toggle(key: "hayd" | "istihadha" | "nifas" | "purity" | "ghusl") {
    const updated: IslamicEntry = { ...entry, [key]: !entry[key] };
    // Mutual exclusivity: hayd/nifas/purity/istihadha
    if (key === "hayd" && updated.hayd) { updated.nifas = false; updated.purity = false; updated.istihadha = false; }
    if (key === "nifas" && updated.nifas) { updated.hayd = false; updated.purity = false; updated.istihadha = false; }
    if (key === "purity" && updated.purity) { updated.hayd = false; updated.nifas = false; updated.istihadha = false; }
    if (key === "istihadha" && updated.istihadha) { updated.hayd = false; updated.nifas = false; }
    persist(saveIslamicEntry(data, today, updated));
  }

  function setFasting(status: FastingStatus) {
    const updated: IslamicEntry = { ...entry, fasting: entry.fasting === status ? undefined : status };
    persist(saveIslamicEntry(data, today, updated));
  }

  function saveNote(text: string) {
    persist(saveIslamicEntry(data, today, { ...entry, note: text }));
  }

  // Status summary
  const statusLabel = entry.hayd ? "Хайд" : entry.nifas ? "Нифас" : entry.istihadha ? "Истихада" : entry.purity ? "Чистота" : "Не отмечено";
  const statusColor = entry.hayd ? "text-[#C47E9B]" : entry.nifas ? "text-[#A07EC4]" : entry.purity ? "text-mira-success" : "text-mira-muted";

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-mira-text">Исламский режим</h1>
      <p className="mb-6 text-sm text-mira-muted">Дополнительные отметки для отслеживания</p>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Main column */}
        <div className="space-y-4">
          {/* Current status */}
          <Card className="border-mira-primary/15 bg-gradient-to-br from-mira-lavender-light/50 to-white p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Состояние сегодня</p>
            <p className={`mt-1 text-xl font-bold ${statusColor}`}>{statusLabel}</p>
            {entry.ghusl && <Badge className="mt-2 border-[#7E8EC4]/30 bg-[#E0E8F5] text-[#7E8EC4]">Гусль совершён</Badge>}
          </Card>

          {/* Category buttons */}
          <Card className="p-5">
            <p className="mb-4 text-sm font-semibold text-mira-text">Состояние</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {islamicCategories.map(cat => {
                const isActive = cat.id === "ghusl" ? !!entry.ghusl : !!entry[cat.id];
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggle(cat.id)}
                    className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.98] ${
                      isActive
                        ? "border-mira-primary bg-mira-lavender-light shadow-card"
                        : "border-mira-lavender/20 bg-white hover:border-mira-primary/30"
                    }`}
                  >
                    <span className="text-xl">{cat.emoji}</span>
                    <div>
                      <p className={`text-sm font-semibold ${isActive ? "text-mira-primary" : "text-mira-text"}`}>{cat.label}</p>
                      <p className="text-[10px] text-mira-muted">{cat.desc}</p>
                    </div>
                    {isActive && <Check className="ml-auto h-4 w-4 text-mira-primary" />}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Fasting */}
          <Card className="p-5">
            <p className="mb-2 text-sm font-semibold text-mira-text">🌙 Пост</p>
            <p className="mb-4 text-xs text-mira-muted">Отметьте статус поста на сегодня</p>
            <div className="grid grid-cols-2 gap-2">
              {fastingOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFasting(opt.id)}
                  className={`rounded-2xl border p-3 text-left transition ${
                    entry.fasting === opt.id
                      ? "border-mira-primary bg-mira-lavender-light"
                      : "border-mira-lavender/20 bg-white hover:border-mira-primary/30"
                  }`}
                >
                  <p className={`text-sm font-semibold ${entry.fasting === opt.id ? "text-mira-primary" : "text-mira-text"}`}>{opt.label}</p>
                  <p className="text-[10px] text-mira-muted">{opt.desc}</p>
                </button>
              ))}
            </div>
          </Card>

          {/* Note */}
          <Card className="p-5">
            <p className="mb-2 text-sm font-semibold text-mira-text">Заметка</p>
            <textarea
              value={entry.note ?? ""}
              onChange={e => saveNote(e.target.value)}
              placeholder="Приватная заметка..."
              className="w-full rounded-2xl border border-mira-lavender/30 bg-mira-bg p-3 text-sm text-mira-text placeholder:text-mira-muted focus:border-mira-primary focus:outline-none"
              rows={3}
            />
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Qada counter */}
          <Card className="border-mira-primary/15 bg-mira-lavender-light/50 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Дни к восполнению</p>
            <p className="mt-1 text-4xl font-bold text-mira-primary">{qadaDays}</p>
            <p className="mt-1 text-xs text-mira-muted">
              {qadaDays === 0 ? "Нет пропущенных дней" : `Пропущенных дней поста`}
            </p>
            {qadaDays > 0 && (
              <Button size="sm" variant="secondary" className="mt-3" onClick={() => setFasting("makeup")}>
                Отметить восполнение сегодня
              </Button>
            )}
          </Card>

          {/* Recent history */}
          <Card className="p-5">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-mira-muted">Последние записи</p>
            <div className="space-y-2">
              {Object.entries(data.islamicEntries ?? {})
                .sort(([a], [b]) => b.localeCompare(a))
                .slice(0, 7)
                .map(([date, e]) => (
                  <div key={date} className="flex items-center justify-between rounded-xl bg-mira-bg p-2.5">
                    <span className="text-xs text-mira-muted">{formatDate(date)}</span>
                    <div className="flex gap-1.5">
                      {e.hayd && <span className="rounded-full bg-[#F5E0EA] px-2 py-0.5 text-[10px] font-semibold text-[#C47E9B]">Хайд</span>}
                      {e.nifas && <span className="rounded-full bg-[#EDE0F5] px-2 py-0.5 text-[10px] font-semibold text-[#A07EC4]">Нифас</span>}
                      {e.istihadha && <span className="rounded-full bg-[#F5F0E0] px-2 py-0.5 text-[10px] font-semibold text-[#A09060]">Истихада</span>}
                      {e.purity && <span className="rounded-full bg-[#E0F5E8] px-2 py-0.5 text-[10px] font-semibold text-mira-success">Чистота</span>}
                      {e.ghusl && <span className="rounded-full bg-[#E0E8F5] px-2 py-0.5 text-[10px] font-semibold text-[#7E8EC4]">Гусль</span>}
                      {e.fasting === "fasted" && <span className="rounded-full bg-mira-lavender-light px-2 py-0.5 text-[10px] font-semibold text-mira-primary">Пост</span>}
                      {e.fasting === "missed" && <span className="rounded-full bg-[#F5E0EA] px-2 py-0.5 text-[10px] font-semibold text-[#C47E9B]">Пропуск</span>}
                      {e.fasting === "makeup" && <span className="rounded-full bg-[#E0F5E8] px-2 py-0.5 text-[10px] font-semibold text-mira-success">Каза</span>}
                    </div>
                  </div>
                ))}
              {(!data.islamicEntries || Object.keys(data.islamicEntries).length === 0) && (
                <p className="text-xs text-mira-muted italic">Пока нет записей</p>
              )}
            </div>
          </Card>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 rounded-2xl border border-mira-success/20 bg-[#E0F5E8]/50 p-3">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-mira-success" />
            <p className="text-xs text-mira-success">Mira не является источником фетв. В спорных вопросах лучше обратиться к знающему специалисту.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}
