"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Moon, Droplets, BookOpen, Check, Calendar,
  ChevronRight, Sparkles, Shield, Plus, Minus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { saveIslamicEntry, dateKey } from "@/lib/store";
import {
  madhabs, getDayStatus, getBleedingAdvice, getQadaStats,
  getRamadanInfo, haydDuas, educationCards,
  type Madhab,
} from "@/lib/islamic";
import type { ScreenProps } from "./types";
import type { IslamicEntry, FastingStatus } from "@/lib/types";

export function IslamicScreen({ data, persist }: ScreenProps) {
  const profile = data.profile;
  const madhab: Madhab = profile?.madhab ?? "hanafi";
  const rules = madhabs[madhab];
  const todayKey = dateKey();
  const todayEntry = data.islamicEntries?.[todayKey];
  const dayStatus = getDayStatus(data, madhab);
  const qadaStats = getQadaStats(data);
  const ramadanInfo = getRamadanInfo(data);

  const [activeTab, setActiveTab] = useState(0);
  const [showDuaIndex, setShowDuaIndex] = useState(0);
  const [addQadaYear, setAddQadaYear] = useState(new Date().getFullYear());
  const [addQadaDays, setAddQadaDays] = useState(0);

  const tabs = ["Сегодня", "Каза", "Знание"];
  const tabIcons = [Moon, Calendar, BookOpen];

  const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

  function setTodayStatus(entry: Partial<IslamicEntry>) {
    const existing = data.islamicEntries?.[todayKey] ?? {};
    const cleared: IslamicEntry = { hayd: false, istihadha: false, nifas: false, purity: false, ...existing, ...entry };
    persist(saveIslamicEntry(data, todayKey, cleared));
  }

  function setFasting(status: FastingStatus) {
    const existing = data.islamicEntries?.[todayKey] ?? {};
    persist(saveIslamicEntry(data, todayKey, { ...existing, fasting: status }));
  }

  function addQadaMissed() {
    for (let i = 0; i < addQadaDays; i++) {
      const fakeDate = `${addQadaYear}-01-${String(i + 1).padStart(2, "0")}`;
      const existing = data.islamicEntries?.[fakeDate] ?? {};
      data = saveIslamicEntry(data, fakeDate, { ...existing, fasting: "missed" });
    }
    persist(data);
    setAddQadaDays(0);
  }

  function markQadaMadeUp() {
    persist(saveIslamicEntry(data, todayKey, { ...data.islamicEntries?.[todayKey], fasting: "makeup" }));
  }

  const statusColors: Record<string, string> = {
    hayd: "border-[#7F6AAD]/20 bg-[#F4F0FA]/30",
    nifas: "border-[#7F6AAD]/20 bg-[#F4F0FA]/30",
    istihada: "border-[#C4B07E]/20 bg-[#F5F0E0]/30",
    purity: "border-mira-success/20 bg-[#E0F5E8]/30",
    unknown: "border-mira-lavender/20 bg-mira-bg",
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }}>
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-6">
        <div className="flex items-center gap-2">
          <Moon className="h-5 w-5 text-mira-primary" />
          <h1 className="text-2xl font-bold text-mira-text">Мусульманка</h1>
        </div>
        <p className="mt-1 text-sm text-mira-muted">Мазхаб: {rules.name} · {rules.nameAr}</p>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} className="mb-6 flex gap-1 rounded-2xl bg-white p-1 shadow-card">
        {tabs.map((t, i) => {
          const Icon = tabIcons[i];
          return (
            <button key={t} onClick={() => setActiveTab(i)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition ${
              activeTab === i ? "bg-mira-lavender-light text-mira-primary shadow-card" : "text-mira-muted"
            }`}>
              <Icon className="h-3.5 w-3.5" />
              {t}
            </button>
          );
        })}
      </motion.div>

      {/* ══════ TAB: Сегодня ══════ */}
      {activeTab === 0 && (
        <div className="space-y-4">
          {/* Current status */}
          <motion.div variants={fadeUp}>
            <Card className={`p-5 ${statusColors[dayStatus.status]}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-mira-text">
                  {dayStatus.status === "hayd" && "🩸 Хайд"}
                  {dayStatus.status === "istihada" && "🔶 Истихада"}
                  {dayStatus.status === "nifas" && "🤱 Нифас"}
                  {dayStatus.status === "purity" && "✨ Чистота"}
                  {dayStatus.status === "unknown" && "❓ Не отмечено"}
                </p>
                {dayStatus.shouldPray ? (
                  <Badge className="bg-mira-success/15 text-mira-success border-mira-success/30">Молись</Badge>
                ) : (
                  <Badge className="bg-[#F4F0FA] text-[#7F6AAD] border-[#7F6AAD]/30">Намаз не обязателен</Badge>
                )}
              </div>
              <p className="text-xs text-mira-muted leading-relaxed">{dayStatus.explanation}</p>
            </Card>
          </motion.div>

          {/* Set today's status */}
          <motion.div variants={fadeUp}>
            <Card className="p-5">
              <p className="text-sm font-bold text-mira-text mb-3">Отметь статус</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Хайд", key: "hayd", emoji: "🩸", desc: "Менструация" },
                  { label: "Чистота", key: "purity", emoji: "✨", desc: "Тухр" },
                  { label: "Истихада", key: "istihadha", emoji: "🔶", desc: "Аномальное кровотечение" },
                  { label: "Нифас", key: "nifas", emoji: "🤱", desc: "Послеродовое" },
                ].map(opt => {
                  const isActive = (opt.key === "hayd" && todayEntry?.hayd) ||
                    (opt.key === "purity" && todayEntry?.purity) ||
                    (opt.key === "istihadha" && todayEntry?.istihadha) ||
                    (opt.key === "nifas" && todayEntry?.nifas);
                  return (
                    <button key={opt.key}
                      onClick={() => setTodayStatus({
                        hayd: opt.key === "hayd",
                        purity: opt.key === "purity",
                        istihadha: opt.key === "istihadha",
                        nifas: opt.key === "nifas",
                      })}
                      className={`flex items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition active:scale-[0.97] ${
                        isActive ? "border-mira-primary bg-mira-lavender-light" : "border-mira-lavender/20"
                      }`}>
                      <span className="text-lg">{opt.emoji}</span>
                      <div>
                        <p className={`text-sm font-semibold ${isActive ? "text-mira-primary" : "text-mira-text"}`}>{opt.label}</p>
                        <p className="text-[10px] text-mira-muted">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          {/* Fasting status */}
          <motion.div variants={fadeUp}>
            <Card className="p-5">
              <p className="text-sm font-bold text-mira-text mb-3">Пост сегодня</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Постилась", status: "fasted" as FastingStatus, emoji: "✅" },
                  { label: "Пропуск (каза)", status: "missed" as FastingStatus, emoji: "📋" },
                  { label: "Освобождена", status: "exempt" as FastingStatus, emoji: "🩸" },
                  { label: "Возмещение", status: "makeup" as FastingStatus, emoji: "🔄" },
                ].map(opt => (
                  <button key={opt.status} onClick={() => setFasting(opt.status)}
                    className={`flex items-center gap-2 rounded-2xl border-2 p-3 text-left transition active:scale-[0.97] ${
                      todayEntry?.fasting === opt.status ? "border-mira-primary bg-mira-lavender-light" : "border-mira-lavender/20"
                    }`}>
                    <span>{opt.emoji}</span>
                    <span className={`text-xs font-semibold ${todayEntry?.fasting === opt.status ? "text-mira-primary" : "text-mira-text"}`}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Ghusl reminder */}
          {todayEntry?.purity && !todayEntry?.ghusl && (
            <motion.div variants={fadeUp}>
              <Card className="border-mira-primary/15 bg-mira-lavender-light/30 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Droplets className="h-4 w-4 text-mira-primary" />
                  <p className="text-sm font-semibold text-mira-text">Напоминание: гусль</p>
                </div>
                <p className="text-xs text-mira-muted mb-2">Если хайд/нифас закончился — прими полное омовение перед намазом.</p>
                <Button size="sm" onClick={() => {
                  persist(saveIslamicEntry(data, todayKey, { ...todayEntry, ghusl: true }));
                }}>
                  <Check className="h-3.5 w-3.5" /> Гусль совершён
                </Button>
              </Card>
            </motion.div>
          )}

          {/* Daily dua */}
          {dayStatus.status === "hayd" && (
            <motion.div variants={fadeUp}>
              <Card className="border-mira-primary/10 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-mira-primary" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-mira-primary">Зикр для дней хайда</p>
                  </div>
                  <button onClick={() => setShowDuaIndex((showDuaIndex + 1) % haydDuas.length)}
                    className="text-xs text-mira-muted hover:text-mira-primary">Ещё →</button>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-mira-text mb-2 leading-relaxed" dir="rtl">{haydDuas[showDuaIndex].arabic}</p>
                  <p className="text-sm text-mira-primary font-semibold mb-1">{haydDuas[showDuaIndex].transliteration}</p>
                  <p className="text-xs text-mira-muted mb-2">{haydDuas[showDuaIndex].translation}</p>
                  <p className="text-[10px] text-mira-muted italic">{haydDuas[showDuaIndex].context}</p>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      )}

      {/* ══════ TAB: Каза ══════ */}
      {activeTab === 1 && (
        <div className="space-y-4">
          {/* Qada summary */}
          <motion.div variants={fadeUp}>
            <Card className="p-5 text-center">
              <p className="text-xs text-mira-muted">Осталось возместить</p>
              <p className="text-4xl font-bold text-mira-text mt-1">{qadaStats.remaining}</p>
              <p className="text-sm text-mira-muted mt-1">
                {qadaStats.remaining === 0 ? "дней" : qadaStats.remaining === 1 ? "день" : qadaStats.remaining < 5 ? "дня" : "дней"} поста
              </p>
              {qadaStats.remaining > 0 && (
                <p className="text-xs text-mira-primary font-semibold mt-2">
                  Совет: возмещай по 1 дню в пн и чт — это ещё и сунна
                </p>
              )}
            </Card>
          </motion.div>

          {/* Quick add today's makeup */}
          {qadaStats.remaining > 0 && (
            <motion.div variants={fadeUp}>
              <Button className="w-full" onClick={markQadaMadeUp}>
                <Check className="h-4 w-4" /> Сегодня возместила 1 день
              </Button>
            </motion.div>
          )}

          {/* By year */}
          {qadaStats.byYear.length > 0 && (
            <motion.div variants={fadeUp}>
              <Card className="p-5">
                <p className="text-sm font-bold text-mira-text mb-3">По годам</p>
                <div className="space-y-2">
                  {qadaStats.byYear.map(y => (
                    <div key={y.year} className="flex items-center justify-between rounded-xl bg-mira-bg p-3">
                      <span className="text-sm font-semibold text-mira-text">{y.year}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-mira-muted">Пропуск: {y.missed}</span>
                        <span className="text-xs text-mira-success">Каза: {y.madeUp}</span>
                        {y.remaining > 0 && (
                          <Badge className="bg-[#F4F0FA] text-[#7F6AAD] text-[10px]">Осталось: {y.remaining}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Add missed days from past */}
          <motion.div variants={fadeUp}>
            <Card className="p-5">
              <p className="text-sm font-bold text-mira-text mb-1">Добавить пропущенные дни</p>
              <p className="text-xs text-mira-muted mb-3">Если помнишь примерное количество за прошлые годы</p>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 rounded-xl border border-mira-lavender/20 bg-mira-bg p-2">
                  <label className="text-[10px] text-mira-muted">Год</label>
                  <input type="number" value={addQadaYear} onChange={e => setAddQadaYear(+e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-mira-text focus:outline-none" />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setAddQadaDays(Math.max(0, addQadaDays - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-mira-lavender/30 text-mira-muted">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-lg font-bold text-mira-text">{addQadaDays}</span>
                  <button onClick={() => setAddQadaDays(addQadaDays + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-mira-primary text-white">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {addQadaDays > 0 && (
                <Button variant="secondary" className="w-full" onClick={addQadaMissed}>
                  Добавить {addQadaDays} дн. за {addQadaYear}
                </Button>
              )}
            </Card>
          </motion.div>

          {/* Ramadan info */}
          <motion.div variants={fadeUp}>
            <Card className="border-mira-primary/10 bg-mira-lavender-light/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Moon className="h-4 w-4 text-mira-primary" />
                <p className="text-sm font-semibold text-mira-text">Рамадан {new Date().getFullYear()}</p>
              </div>
              <p className="text-xs text-mira-muted">
                Пропущено в этом году: {ramadanInfo.missedThisRamadan} дн.
              </p>
              <p className="text-xs text-mira-primary font-semibold mt-1">{ramadanInfo.planAfterRamadan}</p>
            </Card>
          </motion.div>
        </div>
      )}

      {/* ══════ TAB: Знание ══════ */}
      {activeTab === 2 && (
        <div className="space-y-4">
          {/* Madhab info */}
          <motion.div variants={fadeUp}>
            <Card className="p-5">
              <p className="text-sm font-bold text-mira-text mb-2">Твой мазхаб: {rules.name}</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="rounded-xl bg-mira-bg p-3">
                  <p className="text-[10px] text-mira-muted">Хайд</p>
                  <p className="text-sm font-bold text-mira-text">{rules.haydMin}–{rules.haydMax} дн.</p>
                </div>
                <div className="rounded-xl bg-mira-bg p-3">
                  <p className="text-[10px] text-mira-muted">Мин. чистота</p>
                  <p className="text-sm font-bold text-mira-text">{rules.tuhrMin} дн.</p>
                </div>
                <div className="rounded-xl bg-mira-bg p-3">
                  <p className="text-[10px] text-mira-muted">Нифас макс.</p>
                  <p className="text-sm font-bold text-mira-text">{rules.nifasMax} дн.</p>
                </div>
              </div>
              <p className="text-xs text-mira-muted">{rules.notes}</p>
            </Card>
          </motion.div>

          {/* Education cards */}
          {educationCards.map((card, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Card className="p-5">
                <p className="text-sm font-bold text-mira-text mb-2">{card.title}</p>
                <p className="text-xs text-mira-muted leading-relaxed">{card.body}</p>
              </Card>
            </motion.div>
          ))}

          {/* Duas collection */}
          <motion.div variants={fadeUp}>
            <Card className="p-5">
              <p className="text-sm font-bold text-mira-text mb-3">Зикр и дуа для дней хайда</p>
              <div className="space-y-4">
                {haydDuas.map((dua, i) => (
                  <div key={i} className="rounded-xl bg-mira-bg p-3">
                    <p className="text-base font-bold text-mira-text text-right leading-loose" dir="rtl">{dua.arabic}</p>
                    <p className="text-xs text-mira-primary font-semibold mt-1">{dua.transliteration}</p>
                    <p className="text-[11px] text-mira-muted mt-0.5">{dua.translation}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Disclaimer */}
          <motion.div variants={fadeUp}>
            <div className="rounded-2xl border border-mira-lavender/20 bg-white p-4">
              <div className="flex items-start gap-2">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-mira-muted" />
                <p className="text-xs text-mira-muted">
                  Приложение не является источником фетв. В спорных вопросах обращайся к знающему учёному.
                  Информация приведена в образовательных целях на основе классического фикха.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
