"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { getCycleDay, getCyclePhase, getPhaseLabel } from "@/lib/store";
import type { ScreenProps } from "./types";
import type { DailyCheckIn } from "@/lib/types";

function Progress({ value, color = "bg-mira-primary" }: { value: number; color?: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-mira-lavender-light">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

const tabs = ["Циклы", "Настроение", "Энергия", "Сон"];

const moodLabels: Record<string, string> = { normal: "Нормально", joy: "Радость", sadness: "Грусть", anger: "Злость", anxiety: "Тревога", swings: "Перепады" };
const energyLabels: Record<string, string> = { exhausted: "Истощение", low: "Мало сил", normal: "Нормально", high: "Много сил" };
const sleepLabels: Record<string, string> = { good: "Хороший", normal: "Нормальный", bad: "Плохой", little: "Мало сна", insomnia: "Бессонница" };
const painLabels: Record<string, string> = { none: "Нет", cramps: "Спазмы", lower_abdomen: "Низ живота", headache: "Голова", breast: "Грудь", back: "Спина", ovulatory: "Овуляторная" };

function countBy<T>(arr: T[], fn: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of arr) {
    const key = fn(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function AnalyticsScreen({ data }: ScreenProps) {
  const [activeTab, setActiveTab] = useState(0);
  const profile = data.profile;
  const cycleLength = profile?.cycleConfig.cycleLength ?? 28;

  const checkIns = Object.values(data.checkIns);
  const totalDays = checkIns.length;

  // Mood distribution
  const moodEntries = checkIns.filter(c => c.mood).map(c => c.mood!.value);
  const moodCounts = countBy(moodEntries, v => v);

  // Energy distribution
  const energyEntries = checkIns.filter(c => c.energy).map(c => c.energy!.value);
  const energyCounts = countBy(energyEntries, v => v);

  // Sleep quality distribution
  const sleepEntries = checkIns.filter(c => c.sleep).map(c => c.sleep!.quality);
  const sleepCounts = countBy(sleepEntries, v => v);

  // Pain frequency
  const painEntries = checkIns.filter(c => c.pain).flatMap(c => c.pain!.kinds.filter(k => k !== "none"));
  const painCounts = countBy(painEntries, v => v);

  // Last 28 days mood for chart
  const last28 = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    const key = d.toISOString().slice(0, 10);
    return data.checkIns[key];
  });

  const moodScores: Record<string, number> = { normal: 50, joy: 90, sadness: 25, anger: 20, anxiety: 15, swings: 35 };
  const energyScores: Record<string, number> = { exhausted: 10, low: 30, normal: 60, high: 90 };

  function renderDistribution(counts: Record<string, number>, labels: Record<string, string>, total: number, color: string) {
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return <p className="text-xs text-mira-muted italic">Нет данных — начните отслеживать</p>;
    return (
      <div className="space-y-3">
        {sorted.map(([key, count]) => (
          <div key={key}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-mira-text">{labels[key] ?? key}</span>
              <span className="text-mira-muted">{Math.round((count / total) * 100)}%</span>
            </div>
            <Progress value={(count / total) * 100} color={color} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-mira-text">Аналитика</h1>

      <Card className="p-6">
        <div className="mb-6 flex gap-1 rounded-2xl bg-mira-bg p-1">
          {tabs.map((t, i) => (
            <button key={t} onClick={() => setActiveTab(i)} className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
              activeTab === i ? "bg-white text-mira-primary shadow-card" : "text-mira-muted"
            }`}>{t}</button>
          ))}
        </div>

        {activeTab === 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-mira-bg p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Длительность цикла</p>
              <p className="mt-1 text-3xl font-bold text-mira-text">{cycleLength} <span className="text-lg font-normal text-mira-muted">дней</span></p>
              <p className="text-xs text-mira-muted">Настроено в профиле</p>
            </div>
            <div className="rounded-2xl bg-mira-bg p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Фазы цикла</p>
              <div className="mt-4 flex items-center gap-6">
                <div className="relative h-24 w-24">
                  <svg viewBox="0 0 100 100" className="h-full w-full">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#EDE8F5" strokeWidth="12" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#E8A0B8" strokeWidth="12" strokeDasharray="43 196" strokeDashoffset="60" strokeLinecap="round" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#B8A5D8" strokeWidth="12" strokeDasharray="67 172" strokeDashoffset="17" strokeLinecap="round" opacity="0.7" />
                  </svg>
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    { color: "bg-[#E8A0B8]", label: "Менструация", days: `${profile?.cycleConfig.periodLength ?? 5} дн.` },
                    { color: "bg-[#B8A5D8]", label: "Фолликулярная" },
                    { color: "bg-[#D4A0C8]", label: "Овуляция" },
                    { color: "bg-[#D4CCE6]", label: "Лютеиновая" },
                  ].map(p => (
                    <div key={p.label} className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${p.color}`} />
                      <span className="text-mira-text">{p.label}</span>
                      {p.days && <span className="text-mira-muted">{p.days}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-mira-bg p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Частые симптомы</p>
              <div className="mt-4">
                {renderDistribution(painCounts, painLabels, painEntries.length || 1, "bg-mira-cycle")}
              </div>
            </div>
            <div className="rounded-2xl bg-mira-bg p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Дней с данными</p>
              <p className="mt-1 text-3xl font-bold text-mira-text">{totalDays}</p>
              <p className="text-xs text-mira-muted">всего записей</p>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-mira-bg p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Распределение настроения</p>
              <div className="mt-4">{renderDistribution(moodCounts, moodLabels, moodEntries.length || 1, "bg-mira-primary")}</div>
            </div>
            <div className="rounded-2xl bg-mira-bg p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Настроение за 28 дней</p>
              <div className="mt-4 flex items-end gap-1 h-20">
                {last28.map((c, i) => {
                  const score = c?.mood ? (moodScores[c.mood.value] ?? 50) : 0;
                  return (
                    <div key={i} className="flex-1">
                      <div className={`w-full rounded-t-sm ${score > 0 ? (i === 27 ? "bg-mira-primary" : "bg-mira-lavender") : "bg-mira-lavender/30"}`}
                        style={{ height: `${Math.max(score, 5)}%` }} />
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-[10px] text-mira-muted">Последние 28 дней</p>
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-mira-bg p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Распределение энергии</p>
              <div className="mt-4">{renderDistribution(energyCounts, energyLabels, energyEntries.length || 1, "bg-[#C4B07E]")}</div>
            </div>
            <div className="rounded-2xl bg-mira-bg p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Энергия за 28 дней</p>
              <div className="mt-4 flex items-end gap-1 h-20">
                {last28.map((c, i) => {
                  const score = c?.energy ? (energyScores[c.energy.value] ?? 50) : 0;
                  return (
                    <div key={i} className="flex-1">
                      <div className={`w-full rounded-t-sm ${score > 0 ? (i === 27 ? "bg-[#C4B07E]" : "bg-mira-lavender") : "bg-mira-lavender/30"}`}
                        style={{ height: `${Math.max(score, 5)}%` }} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 3 && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-mira-bg p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Качество сна</p>
              <div className="mt-4">{renderDistribution(sleepCounts, sleepLabels, sleepEntries.length || 1, "bg-[#7E8EC4]")}</div>
            </div>
            <div className="rounded-2xl bg-mira-bg p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Средний сон</p>
              {(() => {
                const hours = checkIns.filter(c => c.sleep?.hours).map(c => c.sleep!.hours!);
                const avg = hours.length > 0 ? (hours.reduce((a, b) => a + b, 0) / hours.length).toFixed(1) : "—";
                return (
                  <>
                    <p className="mt-1 text-3xl font-bold text-mira-text">{avg} <span className="text-lg font-normal text-mira-muted">ч</span></p>
                    <p className="text-xs text-mira-muted">за {hours.length} записей</p>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
