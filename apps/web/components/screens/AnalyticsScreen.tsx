"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, Moon, Brain, Zap, Activity, Lightbulb, Link2 } from "lucide-react";
import { NormMap } from "./NormMap";
import { HealthDashboard } from "./HealthDashboard";
import { getSmartInsights } from "@/lib/insights";
import { getPhaseCorrelations } from "@/lib/alerts";
import { getCycleNorm } from "@/lib/cycleEngine";
import type { ScreenProps } from "./types";

function Progress({ value, color = "bg-mira-primary" }: { value: number; color?: string }) {
  return (
    <div className="h-2.5 w-full rounded-full bg-mira-lavender-light">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

const tabs = ["Цикл", "Боль", "ПМС", "Сон / Энергия", "Отклонения"];
const tabIcons = [TrendingUp, Activity, Brain, Moon, AlertCircle];

const moodLabels: Record<string, string> = { normal: "Спокойно", joy: "Радость", sadness: "Грусть", anger: "Раздражение", anxiety: "Тревога", swings: "Перепады" };
const energyLabels: Record<string, string> = { exhausted: "Истощение", low: "Низкая", normal: "Нормальная", high: "Высокая" };
const sleepLabels: Record<string, string> = { good: "Хороший", normal: "Нормальный", bad: "Плохой", little: "Мало сна", insomnia: "Бессонница" };

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
  const norm = getCycleNorm(profile);
  const cycleLength = norm.cycleLength; // реальная медианная длина из истории
  const periodLength = profile?.cycleConfig.periodLength ?? 5;
  const checkIns = Object.values(data.checkIns);
  const totalDays = checkIns.length;

  const painEntries = checkIns.filter(c => c.pain && c.pain.kinds.some(k => k !== "none"));
  const sleepEntries = checkIns.filter(c => c.sleep);
  const energyEntries = checkIns.filter(c => c.energy);
  const moodEntries = checkIns.filter(c => c.mood);
  const pmsEntries = checkIns.filter(c => c.pms && c.pms.symptoms.length > 0);

  const needsMoreData = totalDays < 7;

  function renderDistribution(counts: Record<string, number>, labels: Record<string, string>, total: number, color: string) {
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return <p className="text-xs text-mira-muted italic">Нет данных — начни отслеживать</p>;
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-mira-text">Аналитика</h1>
        <p className="mt-1 text-sm text-mira-muted">Посмотри и сразу пойми — всё ли в норме</p>
      </div>

      {/* Health Dashboard — светофор статусов */}
      <div className="mb-6">
        <HealthDashboard data={data} />
      </div>

      {/* Norm Map */}
      <div className="mb-6">
        <NormMap data={data} />
      </div>

      {/* Smart insights */}
      {(() => {
        const smartInsights = getSmartInsights(data);
        if (smartInsights.length === 0) return null;
        return (
          <div className="mb-6 space-y-3">
            {smartInsights.map((insight, i) => (
              <Card key={i} className="border-mira-primary/10 bg-mira-lavender-light/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mira-lavender-light">
                    <Lightbulb className="h-4 w-4 text-mira-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-mira-text">{insight.title}</p>
                    <p className="mt-1 text-xs text-mira-muted leading-relaxed">{insight.body}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        );
      })()}

      {/* Phase correlations (#4) */}
      {(() => {
        const correlations = getPhaseCorrelations(data);
        if (correlations.length === 0) return null;
        return (
          <div className="mb-6 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted px-1">
              <Link2 className="mr-1 inline h-3 w-3" />
              Связь симптомов с фазой цикла
            </p>
            {correlations.map((c, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-mira-text">{c.symptom}</p>
                  <Badge className="text-[10px]">{c.phase} · {c.frequency}x</Badge>
                </div>
                <p className="text-xs text-mira-muted leading-relaxed">{c.explanation}</p>
              </Card>
            ))}
          </div>
        );
      })()}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl bg-white p-1 shadow-card">
        {tabs.map((t, i) => {
          const Icon = tabIcons[i];
          return (
            <button key={t} onClick={() => setActiveTab(i)} className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition ${
              activeTab === i ? "bg-mira-lavender-light text-mira-primary shadow-card" : "text-mira-muted hover:text-mira-text"
            }`}>
              <Icon className="h-3.5 w-3.5" />
              {t}
            </button>
          );
        })}
      </div>

      {needsMoreData && (
        <Card className="mb-6 border-[#C4B07E]/15 bg-[#F5F0E0]/30 p-4">
          <p className="text-sm text-[#A09060]">Начни отслеживать каждый день — аналитика появится после первой недели данных.</p>
        </Card>
      )}

      {/* Tab content */}
      {activeTab === 0 && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Длительность цикла</p>
              <Badge className="text-[9px]">
                {norm.confidence === "high" ? "Точная норма" : norm.confidence === "medium" ? "Уточняется" : "Оценка"}
              </Badge>
            </div>
            <p className="mt-2 text-3xl font-bold text-mira-text">
              {cycleLength} <span className="text-lg font-normal text-mira-muted">дней</span>
              {norm.observedCycles >= 2 && norm.spread > 0 && (
                <span className="text-sm font-normal text-mira-muted"> ({norm.minLength}–{norm.maxLength})</span>
              )}
            </p>
            <div className="mt-3 rounded-xl bg-mira-bg p-3">
              <p className="text-xs text-mira-text">
                <span className="font-semibold">Что это значит:</span>{" "}
                {norm.observedCycles === 0
                  ? `Пока это оценка из онбординга. Отмечай начало месячных — и я посчитаю твою реальную норму.`
                  : norm.observedCycles === 1
                    ? `Зафиксирован 1 цикл (${cycleLength} дн.). Нужно ещё хотя бы один, чтобы понять твой ритм.`
                    : norm.isRegular
                      ? `Твой цикл регулярный: ${cycleLength} дн. (по ${norm.observedCycles} циклам). Разброс всего ${norm.spread} дн.`
                      : `Цикл нерегулярный: от ${norm.minLength} до ${norm.maxLength} дн. (по ${norm.observedCycles} циклам). Это бывает — но если разброс большой, стоит обсудить с врачом.`}
              </p>
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Длительность месячных</p>
            <p className="mt-2 text-3xl font-bold text-mira-text">{periodLength} <span className="text-lg font-normal text-mira-muted">дней</span></p>
            <div className="mt-3 rounded-xl bg-mira-bg p-3">
              <p className="text-xs text-mira-text">
                <span className="font-semibold">Что это значит:</span> Обычно месячные длятся {periodLength} дней.
                {periodLength > 7 ? " Это дольше среднего — стоит обсудить с врачом." : " Это в пределах нормы."}
              </p>
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Фазы цикла</p>
            <div className="mt-4 flex items-center gap-6">
              <div className="relative h-24 w-24 shrink-0">
                <svg viewBox="0 0 100 100" className="h-full w-full">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#EDE8F5" strokeWidth="12" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#E8A0B8" strokeWidth="12" strokeDasharray="43 196" strokeDashoffset="60" strokeLinecap="round" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#B8A5D8" strokeWidth="12" strokeDasharray="67 172" strokeDashoffset="17" strokeLinecap="round" opacity="0.7" />
                </svg>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { color: "bg-[#E8A0B8]", label: "Менструация", days: `${periodLength} дн.` },
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
          </Card>

          <Card className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Дней с данными</p>
            <p className="mt-2 text-3xl font-bold text-mira-text">{totalDays}</p>
            <p className="text-xs text-mira-muted">всего записей</p>
          </Card>
        </div>
      )}

      {activeTab === 1 && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Боль по дням</p>
            <div className="mt-4">
              {painEntries.length === 0
                ? <p className="text-xs text-mira-muted italic">Нет данных о боли</p>
                : (
                  <>
                    <p className="text-2xl font-bold text-mira-text">{painEntries.length} <span className="text-sm font-normal text-mira-muted">дней с болью</span></p>
                    <div className="mt-3 rounded-xl bg-mira-bg p-3">
                      <p className="text-xs text-mira-text">
                        <span className="font-semibold">Что это значит:</span>{" "}
                        {painEntries.length > 5
                          ? "Боль повторяется. Если она мешает обычной жизни, стоит обсудить с врачом."
                          : "Пока мало данных. Продолжай отмечать для выявления паттернов."}
                      </p>
                    </div>
                  </>
                )}
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Типы боли</p>
            <div className="mt-4">
              {(() => {
                const kinds = painEntries.flatMap(c => c.pain!.kinds.filter(k => k !== "none"));
                const painLabels: Record<string, string> = { cramps: "Спазмы", lower_abdomen: "Низ живота", headache: "Голова", breast: "Грудь", back: "Спина", ovulatory: "Овуляторная" };
                return renderDistribution(countBy(kinds, v => v), painLabels, kinds.length || 1, "bg-mira-cycle");
              })()}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 2 && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">ПМС-симптомы</p>
            <div className="mt-4">
              {pmsEntries.length === 0
                ? <p className="text-xs text-mira-muted italic">Нет данных о ПМС</p>
                : (() => {
                    const allSymptoms = pmsEntries.flatMap(c => c.pms!.symptoms);
                    const counts = countBy(allSymptoms, v => v);
                    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                    return (
                      <>
                        <div className="space-y-2">
                          {sorted.slice(0, 5).map(([sym, count]) => (
                            <div key={sym} className="flex items-center justify-between">
                              <span className="text-sm text-mira-text">{sym}</span>
                              <Badge>{count}x</Badge>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 rounded-xl bg-mira-bg p-3">
                          <p className="text-xs text-mira-text">
                            <span className="font-semibold">Что это значит:</span>{" "}
                            {sorted[0] ? `${sorted[0][0]} — самый частый ПМС-симптом.` : ""}{" "}
                            Со временем мы покажем, за сколько дней до месячных он появляется.
                          </p>
                        </div>
                      </>
                    );
                  })()
              }
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Настроение</p>
            <div className="mt-4">
              {renderDistribution(
                countBy(moodEntries.map(c => c.mood!.value), v => v),
                moodLabels,
                moodEntries.length || 1,
                "bg-mira-primary"
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 3 && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Качество сна</p>
            <div className="mt-4">
              {renderDistribution(
                countBy(sleepEntries.map(c => c.sleep!.quality), v => v),
                sleepLabels,
                sleepEntries.length || 1,
                "bg-[#7E8EC4]"
              )}
              {sleepEntries.length >= 7 && (
                <div className="mt-3 rounded-xl bg-mira-bg p-3">
                  <p className="text-xs text-mira-text">
                    <span className="font-semibold">Что это значит:</span>{" "}
                    {sleepEntries.filter(c => c.sleep!.quality === "bad" || c.sleep!.quality === "insomnia").length > sleepEntries.length * 0.3
                      ? "Сон часто ухудшается. Это может быть связано с фазой цикла."
                      : "Сон в целом в норме."}
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Энергия</p>
            <div className="mt-4">
              {renderDistribution(
                countBy(energyEntries.map(c => c.energy!.value), v => v),
                energyLabels,
                energyEntries.length || 1,
                "bg-[#C4B07E]"
              )}
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Средний сон</p>
            {(() => {
              const hours = sleepEntries.filter(c => c.sleep?.hours).map(c => c.sleep!.hours!);
              const avg = hours.length > 0 ? (hours.reduce((a, b) => a + b, 0) / hours.length).toFixed(1) : "—";
              return (
                <>
                  <p className="mt-2 text-3xl font-bold text-mira-text">{avg} <span className="text-lg font-normal text-mira-muted">ч</span></p>
                  <p className="text-xs text-mira-muted">за {hours.length} записей</p>
                </>
              );
            })()}
          </Card>
        </div>
      )}

      {activeTab === 4 && (
        <div className="space-y-5">
          <Card className="border-[#C47E7E]/15 p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-[#C47E7E]" />
              <p className="text-sm font-semibold text-mira-text">Что изменилось сейчас</p>
            </div>
            {totalDays < 14
              ? <p className="text-sm text-mira-muted">Нужно больше данных, чтобы заметить отклонения. Продолжай отмечать каждый день.</p>
              : (
                <div className="space-y-3">
                  {painEntries.length > 3 && (
                    <div className="flex items-start gap-2 text-sm">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#C47E7E]" />
                      <span className="text-mira-text">Боль отмечена в {painEntries.length} днях — стоит обратить внимание</span>
                    </div>
                  )}
                  {sleepEntries.filter(c => c.sleep!.quality === "bad" || c.sleep!.quality === "insomnia").length > 3 && (
                    <div className="flex items-start gap-2 text-sm">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#7E8EC4]" />
                      <span className="text-mira-text">Плохой сон повторяется — может быть связан с фазой цикла</span>
                    </div>
                  )}
                  {energyEntries.filter(c => c.energy!.value === "exhausted" || c.energy!.value === "low").length > energyEntries.length * 0.4 && (
                    <div className="flex items-start gap-2 text-sm">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#C4B07E]" />
                      <span className="text-mira-text">Энергия часто низкая — обрати внимание на сон и питание</span>
                    </div>
                  )}
                  {painEntries.length <= 3 && sleepEntries.filter(c => c.sleep!.quality === "bad").length <= 3 && (
                    <p className="text-sm text-mira-success">Пока всё в пределах нормы. Продолжай отслеживать.</p>
                  )}
                </div>
              )}
          </Card>

          <Card className="p-5">
            <p className="text-sm font-semibold text-mira-text mb-2">Когда стоит обратиться к врачу</p>
            <ul className="space-y-2">
              {[
                "Сильная боль повторяется 3+ цикла подряд",
                "Цикл стал значительно длиннее или короче",
                "Обильное кровотечение более 7 дней",
                "Необычные выделения",
                "Любые симптомы, которые вас беспокоят",
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-xs text-mira-muted">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-mira-lavender" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
