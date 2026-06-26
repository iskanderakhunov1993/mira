"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Droplets, Activity, Brain, Flame, BedDouble, Heart,
  Sparkles, BookOpen, RotateCcw, X, Eye, CircleDot,
  ThermometerSun, Check, AlertCircle, Lightbulb,
} from "lucide-react";
import { getMicroInsight } from "@/lib/insights";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { saveCheckIn, dateKey, getCheckIn } from "@/lib/store";
import { recordPeriodStart } from "@/lib/cycleEngine";
import { getStreak, getGarden } from "@/lib/gamification";
import type {
  MiraLocalData, DailyCheckIn, PeriodIntensity, PeriodType,
  PainKind, PainLevel, MoodValue, EnergyValue, SleepQuality,
  IntimacyProtection, IntimacyFeeling,
} from "@/lib/types";

type Category =
  | "period" | "bleeding" | "pain" | "mood" | "energy" | "sleep"
  | "sex" | "discharge" | "stress" | "pms" | "note";

const categories: { id: Category; label: string; icon: typeof Droplets; color: string }[] = [
  { id: "period", label: "Месячные", icon: Droplets, color: "text-[#C47E9B] bg-[#F5E0EA]" },
  { id: "bleeding", label: "Кровотечение", icon: CircleDot, color: "text-[#C47E7E] bg-[#F5E0E0]" },
  { id: "pain", label: "Боль", icon: Activity, color: "text-[#C4A07E] bg-[#F5ECE0]" },
  { id: "mood", label: "Настроение", icon: Brain, color: "text-[#9B8EC4] bg-[#EDE8F5]" },
  { id: "sleep", label: "Сон", icon: BedDouble, color: "text-[#7E8EC4] bg-[#E0E8F5]" },
  { id: "energy", label: "Энергия", icon: Flame, color: "text-[#C4B07E] bg-[#F5F0E0]" },
  { id: "sex", label: "Секс", icon: Heart, color: "text-[#C47E9B] bg-[#F5E0EA]" },
  { id: "discharge", label: "Выделения", icon: ThermometerSun, color: "text-[#7BAF8D] bg-[#E0F5E8]" },
  { id: "stress", label: "Стресс", icon: AlertCircle, color: "text-[#C4887E] bg-[#F5E8E0]" },
  { id: "pms", label: "ПМС", icon: Sparkles, color: "text-[#A07EC4] bg-[#EDE0F5]" },
  { id: "note", label: "Заметка", icon: BookOpen, color: "text-mira-muted bg-mira-lavender-light" },
];

const pmsSymptoms = [
  "Вздутие", "Раздражительность", "Тяга к еде", "Акне",
  "Усталость", "Болезненность груди", "Головная боль", "Тревожность",
];

function Chip({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
      active ? "border-mira-primary bg-mira-lavender-light text-mira-primary" : "border-mira-lavender/40 bg-white text-mira-muted hover:border-mira-primary/30"
    }`}>{label}</button>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`relative h-7 w-12 rounded-full transition ${on ? "bg-mira-primary" : "bg-mira-lavender"}`}>
      <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  data: MiraLocalData;
  persist: (data: MiraLocalData) => void;
  targetDate?: string; // дата записи (по умолчанию сегодня) — для backfill прошлых дней
};

export function CheckInModal({ open, onClose, data, persist, targetDate }: Props) {
  const entryDate = targetDate ?? dateKey();
  const isToday = entryDate === dateKey();
  const modalTitle = isToday
    ? "Отметить состояние"
    : new Date(entryDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [insightData, setInsightData] = useState<ReturnType<typeof getMicroInsight> | null>(null);
  const existing = getCheckIn(data, entryDate);

  const [periodIntensity, setPeriodIntensity] = useState<PeriodIntensity | null>(null);
  const [periodType, setPeriodType] = useState<PeriodType | null>(null);
  const [bleedingLevel, setBleedingLevel] = useState<string | null>(null);
  const [painKinds, setPainKinds] = useState<PainKind[]>([]);
  const [painLevel, setPainLevel] = useState<PainLevel | null>(null);
  const [painImpact, setPainImpact] = useState<boolean>(false);
  const [mood, setMood] = useState<MoodValue | null>(null);
  const [energy, setEnergy] = useState<EnergyValue | null>(null);
  const [sleepQuality, setSleepQuality] = useState<SleepQuality | null>(null);
  const [sleepHours, setSleepHours] = useState<number | null>(null);
  const [intimacyHappened, setIntimacyHappened] = useState(false);
  const [intimacyProtection, setIntimacyProtection] = useState<IntimacyProtection | null>(null);
  const [intimacyFeeling, setIntimacyFeeling] = useState<IntimacyFeeling | null>(null);
  const [intimacyShowCalendar, setIntimacyShowCalendar] = useState(false);
  const [discharge, setDischarge] = useState<string | null>(null);
  const [stressLevel, setStressLevel] = useState<string | null>(null);
  const [pmsSelected, setPmsSelected] = useState<string[]>([]);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    if (open && existing) {
      setPeriodIntensity(existing.period?.intensity ?? null);
      setPeriodType(existing.period?.type ?? null);
      setPainKinds(existing.pain?.kinds ?? []);
      setPainLevel(existing.pain?.level ?? null);
      setMood(existing.mood?.value ?? null);
      setEnergy(existing.energy?.value ?? null);
      setSleepQuality(existing.sleep?.quality ?? null);
      setSleepHours(existing.sleep?.hours ?? null);
      setIntimacyHappened(existing.intimacy?.happened ?? false);
      setIntimacyProtection(existing.intimacy?.protection ?? null);
      setIntimacyFeeling(existing.intimacy?.feeling ?? null);
      setIntimacyShowCalendar(existing.intimacy?.showInCalendar ?? false);
      setPmsSelected(existing.pms?.symptoms ?? []);
      setNoteText(existing.note?.text ?? "");
    }
  }, [open, entryDate, existing]);

  if (!open) return null;

  function save() {
    const date = entryDate;
    const checkIn: DailyCheckIn = {
      date,
      savedAt: new Date().toISOString(),
      ...(existing ?? {}),
    };
    if (periodIntensity) checkIn.period = { intensity: periodIntensity, type: periodType ?? undefined };
    if (painKinds.length > 0) checkIn.pain = { kinds: painKinds, level: painLevel ?? undefined };
    if (mood) checkIn.mood = { value: mood };
    if (energy) checkIn.energy = { value: energy };
    if (sleepQuality) checkIn.sleep = { quality: sleepQuality, hours: sleepHours ?? undefined };
    if (intimacyHappened || existing?.intimacy) {
      checkIn.intimacy = { happened: intimacyHappened, protection: intimacyProtection ?? undefined, feeling: intimacyFeeling ?? undefined, showInCalendar: intimacyShowCalendar };
    }
    if (pmsSelected.length > 0) checkIn.pms = { symptoms: pmsSelected };
    if (noteText.trim()) checkIn.note = { text: noteText.trim() };
    if (discharge) checkIn.discharge = discharge;
    if (stressLevel) checkIn.stress = stressLevel;

    let newData = saveCheckIn(data, checkIn);

    // Движок нормы: если отмечены месячные и это новый старт
    // (вчера месячных не было) — записываем дату в историю циклов.
    if (periodIntensity && newData.profile) {
      const yesterday = new Date(date);
      yesterday.setDate(yesterday.getDate() - 1);
      const hadPeriodYesterday = !!newData.checkIns[dateKey(yesterday)]?.period;
      if (!hadPeriodYesterday) {
        newData = { ...newData, profile: recordPeriodStart(newData.profile, date) };
      }
    }

    persist(newData);
    setActiveCategory(null);
    const insight = getMicroInsight(newData, checkIn);
    setInsightData(insight);
  }

  function saveAsUsual() {
    const date = entryDate;
    const checkIn: DailyCheckIn = {
      date,
      savedAt: new Date().toISOString(),
      ...(existing ?? {}),
      mood: { value: "normal" },
      energy: { value: "normal" },
      sleep: { quality: "normal" },
    };
    const newData = saveCheckIn(data, checkIn);
    persist(newData);
    const insight = getMicroInsight(newData, checkIn);
    setInsightData(insight);
  }

  function repeatYesterday() {
    const dayBefore = new Date(entryDate);
    dayBefore.setDate(dayBefore.getDate() - 1);
    const yData = data.checkIns[dateKey(dayBefore)];
    if (!yData) return;
    const checkIn: DailyCheckIn = { ...yData, date: entryDate, savedAt: new Date().toISOString() };
    persist(saveCheckIn(data, checkIn));
    onClose();
  }

  const hasYesterday = (() => {
    const y = new Date(entryDate);
    y.setDate(y.getDate() - 1);
    return !!data.checkIns[dateKey(y)];
  })();

  function hasData(cat: Category): boolean {
    if (!existing) return false;
    const m: Record<Category, boolean> = {
      period: !!existing.period, bleeding: !!existing.period,
      pain: !!existing.pain, mood: !!existing.mood,
      energy: !!existing.energy, sleep: !!existing.sleep,
      sex: !!existing.intimacy, discharge: false,
      stress: false, pms: !!existing.pms, note: !!existing.note,
    };
    return m[cat];
  }

  function togglePms(s: string) {
    setPmsSelected(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  function closeAndReset() {
    setInsightData(null);
    setActiveCategory(null);
    onClose();
  }

  if (insightData) {
    const insightIcons: Record<string, string> = {
      pain: "text-[#C47E9B] bg-[#F5E0EA]",
      sleep: "text-[#7E8EC4] bg-[#E0E8F5]",
      mood: "text-[#9B8EC4] bg-[#EDE8F5]",
      energy: "text-[#C4B07E] bg-[#F5F0E0]",
      pms: "text-[#A07EC4] bg-[#EDE0F5]",
      cycle: "text-mira-primary bg-mira-lavender-light",
      norm: "text-mira-primary bg-mira-lavender-light",
      positive: "text-mira-success bg-[#E0F5E8]",
    };
    const typeLabels: Record<string, string> = {
      observation: "Наблюдение",
      connection: "Связь",
      action: "Рекомендация",
    };
    const insightContent = (
      <div className="flex flex-col items-center text-center py-4">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className={`flex h-16 w-16 items-center justify-center rounded-full ${insightIcons[insightData.icon] ?? "bg-mira-lavender-light text-mira-primary"}`}
        >
          <Lightbulb className="h-7 w-7" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <span className="mt-4 inline-block rounded-full bg-mira-lavender-light px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-mira-primary">
            {typeLabels[insightData.type]}
          </span>
          <h3 className="mt-3 text-lg font-bold text-mira-text">{insightData.title}</h3>
          <p className="mt-2 text-sm text-mira-muted leading-relaxed max-w-xs mx-auto">{insightData.body}</p>
        </motion.div>

        {/* #3 Награда в момент: streak + сад подрос */}
        {(() => {
          const streak = getStreak(data);
          const garden = getGarden(data);
          return (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35, type: "spring" }}
              className="sheen mt-5 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#EAF6EE] to-[#F2EDFA] px-4 py-3">
              <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.5, type: "spring", stiffness: 220, damping: 10 }} className="text-2xl">
                {garden.emoji}
              </motion.span>
              <div className="text-left">
                <p className="text-sm font-bold text-mira-text">🔥 Серия {streak.current} {streak.current === 1 ? "день" : streak.current < 5 ? "дня" : "дней"}</p>
                <p className="text-[11px] text-mira-muted">{garden.title} · сад растёт</p>
              </div>
            </motion.div>
          );
        })()}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-6 w-full">
          <Button className="w-full" onClick={closeAndReset}>Понятно</Button>
        </motion.div>
      </div>
    );

    return (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" onClick={closeAndReset} />
        <motion.div initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed inset-y-0 right-0 z-50 hidden w-[420px] overflow-y-auto border-l border-mira-lavender/20 bg-white p-6 shadow-soft lg:flex lg:items-center">
          <div className="w-full">{insightContent}</div>
        </motion.div>
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-mira-lavender/20 bg-white p-5 shadow-soft lg:hidden">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-mira-lavender" />
          {insightContent}
        </motion.div>
      </>
    );
  }

  const categoryContent = activeCategory ? (
    <div>
      <button onClick={() => setActiveCategory(null)} className="mb-4 flex items-center gap-1 text-sm text-mira-muted hover:text-mira-primary transition">
        ← Назад
      </button>

      {activeCategory === "period" && (
        <>
          <h3 className="mb-1 text-lg font-bold text-mira-text">Месячные</h3>
          <p className="mb-4 text-xs text-mira-muted">Начались или закончились?</p>
          <div className="mb-4 grid grid-cols-2 gap-2">
            <button onClick={() => setPeriodIntensity("moderate")} className={`rounded-2xl border p-3 text-sm font-semibold transition ${periodIntensity ? "border-mira-primary bg-mira-lavender-light text-mira-primary" : "border-mira-lavender/30 text-mira-muted"}`}>
              Начались
            </button>
            <button onClick={() => { setPeriodIntensity(null); setPeriodType(null); }} className={`rounded-2xl border p-3 text-sm font-semibold transition ${!periodIntensity ? "border-mira-primary bg-mira-lavender-light text-mira-primary" : "border-mira-lavender/30 text-mira-muted"}`}>
              Закончились
            </button>
          </div>
          {periodIntensity && (
            <>
              <p className="mb-2 text-sm font-semibold text-mira-text">Интенсивность</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {(["light", "moderate", "heavy", "very_heavy"] as PeriodIntensity[]).map(v => (
                  <Chip key={v} label={periodL(v)} active={periodIntensity === v} onClick={() => setPeriodIntensity(v)} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {activeCategory === "bleeding" && (
        <>
          <h3 className="mb-4 text-lg font-bold text-mira-text">Кровотечение</h3>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {["Нет", "Мало", "Средне", "Сильно"].map(v => (
              <button key={v} onClick={() => setBleedingLevel(v)} className={`rounded-2xl border p-3 text-sm font-semibold transition ${
                bleedingLevel === v ? "border-mira-primary bg-mira-lavender-light text-mira-primary" : "border-mira-lavender/30 text-mira-muted"
              }`}>{v}</button>
            ))}
          </div>
        </>
      )}

      {activeCategory === "pain" && (
        <>
          <h3 className="mb-4 text-lg font-bold text-mira-text">Боль</h3>
          <p className="mb-2 text-sm font-semibold text-mira-text">Интенсивность</p>
          <div className="mb-4 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setPainLevel(n <= 2 ? "light" : n <= 3 ? "medium" : "strong")}
                className={`flex-1 rounded-xl py-3 text-sm font-bold transition ${
                  (painLevel === "light" && n <= 2) || (painLevel === "medium" && n === 3) || (painLevel === "strong" && n >= 4)
                    ? "bg-mira-cycle text-white" : "bg-mira-lavender-light text-mira-muted"
                }`}>{n}</button>
            ))}
          </div>
          <p className="mb-2 text-sm font-semibold text-mira-text">Где болит</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {(["cramps", "lower_abdomen", "headache", "breast", "back"] as PainKind[]).map(v => (
              <Chip key={v} label={painKL(v)} active={painKinds.includes(v)}
                onClick={() => setPainKinds(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])} />
            ))}
          </div>
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-mira-lavender/20 bg-mira-bg p-3">
            <span className="text-sm text-mira-text">Мешало делам?</span>
            <Toggle on={painImpact} onToggle={() => setPainImpact(!painImpact)} />
          </div>
          {painLevel === "strong" && (
            <div className="mb-4 rounded-2xl border border-mira-cycle/15 bg-mira-rose-light/30 p-3">
              <p className="text-xs text-mira-cycle">Если сильная боль повторяется, стоит обсудить это с врачом.</p>
            </div>
          )}
        </>
      )}

      {activeCategory === "mood" && (
        <>
          <h3 className="mb-4 text-lg font-bold text-mira-text">Настроение</h3>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {(["normal", "joy", "sadness", "anger", "anxiety", "swings"] as MoodValue[]).map(v => (
              <button key={v} onClick={() => setMood(v)} className={`rounded-2xl border p-3 text-sm font-semibold transition ${
                mood === v ? "border-mira-primary bg-mira-lavender-light text-mira-primary" : "border-mira-lavender/30 text-mira-muted"
              }`}>{moodL(v)}</button>
            ))}
          </div>
        </>
      )}

      {activeCategory === "energy" && (
        <>
          <h3 className="mb-4 text-lg font-bold text-mira-text">Энергия</h3>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {(["exhausted", "low", "normal", "high"] as EnergyValue[]).map(v => (
              <button key={v} onClick={() => setEnergy(v)} className={`rounded-2xl border p-3 text-sm font-semibold transition ${
                energy === v ? "border-mira-primary bg-mira-lavender-light text-mira-primary" : "border-mira-lavender/30 text-mira-muted"
              }`}>{energyL(v)}</button>
            ))}
          </div>
        </>
      )}

      {activeCategory === "sleep" && (
        <>
          <h3 className="mb-4 text-lg font-bold text-mira-text">Сон</h3>
          <div className="mb-4 grid grid-cols-3 gap-2">
            {(["good", "normal", "bad"] as SleepQuality[]).map(v => (
              <button key={v} onClick={() => setSleepQuality(v)} className={`rounded-2xl border p-3 text-sm font-semibold transition ${
                sleepQuality === v ? "border-mira-primary bg-mira-lavender-light text-mira-primary" : "border-mira-lavender/30 text-mira-muted"
              }`}>{sleepQL(v)}</button>
            ))}
          </div>
          <p className="mb-2 text-sm font-semibold text-mira-text">Часов сна</p>
          <div className="mb-4 flex items-center gap-1 rounded-2xl border border-mira-lavender/30 bg-mira-bg p-1">
            {[4, 5, 6, 7, 8, 9].map(h => (
              <button key={h} onClick={() => setSleepHours(h)} className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                sleepHours === h ? "bg-white text-mira-primary shadow-card" : "text-mira-muted"
              }`}>{h}</button>
            ))}
          </div>
        </>
      )}

      {activeCategory === "sex" && (
        <>
          <h3 className="mb-1 text-lg font-bold text-mira-text">Секс</h3>
          <p className="mb-4 text-xs text-mira-muted">Данные приватны и скрыты по умолчанию</p>
          <p className="mb-2 text-sm font-semibold text-mira-text">Был защищённый секс?</p>
          <div className="mb-4 grid grid-cols-3 gap-2">
            {[
              { label: "Да", value: "protected" as IntimacyProtection },
              { label: "Нет", value: "unprotected" as IntimacyProtection },
              { label: "Не хочу указывать", value: null },
            ].map(opt => (
              <button key={opt.label} onClick={() => { setIntimacyHappened(true); setIntimacyProtection(opt.value); }}
                className={`rounded-2xl border p-3 text-xs font-semibold transition ${
                  intimacyHappened && intimacyProtection === opt.value ? "border-mira-primary bg-mira-lavender-light text-mira-primary" : "border-mira-lavender/30 text-mira-muted"
                }`}>{opt.label}</button>
            ))}
          </div>
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-mira-lavender/20 bg-mira-bg p-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-mira-muted" />
              <span className="text-sm text-mira-text">Показывать в календаре</span>
            </div>
            <Toggle on={intimacyShowCalendar} onToggle={() => setIntimacyShowCalendar(!intimacyShowCalendar)} />
          </div>
        </>
      )}

      {activeCategory === "discharge" && (
        <>
          <h3 className="mb-4 text-lg font-bold text-mira-text">Выделения</h3>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {["Обычные", "Необычные"].map(v => (
              <button key={v} onClick={() => setDischarge(v)} className={`rounded-2xl border p-3 text-sm font-semibold transition ${
                discharge === v ? "border-mira-primary bg-mira-lavender-light text-mira-primary" : "border-mira-lavender/30 text-mira-muted"
              }`}>{v}</button>
            ))}
          </div>
          {discharge === "Необычные" && (
            <div className="mb-4 rounded-2xl border border-[#C4B07E]/15 bg-[#F5F0E0]/40 p-3">
              <p className="text-xs text-[#A09060]">Если необычные выделения продолжаются, стоит обратиться к специалисту.</p>
            </div>
          )}
        </>
      )}

      {activeCategory === "stress" && (
        <>
          <h3 className="mb-4 text-lg font-bold text-mira-text">Стресс</h3>
          <div className="mb-4 grid grid-cols-3 gap-2">
            {["Низкий", "Средний", "Высокий"].map(v => (
              <button key={v} onClick={() => setStressLevel(v)} className={`rounded-2xl border p-3 text-sm font-semibold transition ${
                stressLevel === v ? "border-mira-primary bg-mira-lavender-light text-mira-primary" : "border-mira-lavender/30 text-mira-muted"
              }`}>{v}</button>
            ))}
          </div>
        </>
      )}

      {activeCategory === "pms" && (
        <>
          <h3 className="mb-4 text-lg font-bold text-mira-text">ПМС</h3>
          <p className="mb-3 text-xs text-mira-muted">Выбери симптомы</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {pmsSymptoms.map(s => (
              <Chip key={s} label={s} active={pmsSelected.includes(s)} onClick={() => togglePms(s)} />
            ))}
          </div>
        </>
      )}

      {activeCategory === "note" && (
        <>
          <h3 className="mb-4 text-lg font-bold text-mira-text">Заметка</h3>
          <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
            placeholder="Запиши что-нибудь..."
            className="mb-4 w-full rounded-2xl border border-mira-lavender/30 bg-mira-bg p-3 text-sm text-mira-text placeholder:text-mira-muted focus:border-mira-primary focus:outline-none"
            rows={4} />
        </>
      )}

      <Button className="w-full" onClick={save}>Сохранить</Button>
    </div>
  ) : (
    <div>
      {/* Quick actions */}
      <div className="mb-5 grid grid-cols-2 gap-2">
        <button onClick={saveAsUsual}
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-mira-success/30 bg-[#E0F5E8]/40 p-3.5 text-sm font-semibold text-mira-success transition active:scale-[0.97]">
          <Check className="h-4 w-4" /> Всё как обычно
        </button>
        {hasYesterday && (
          <Button variant="secondary" size="sm" className="h-auto py-3.5" onClick={repeatYesterday}>
            <RotateCcw className="h-3.5 w-3.5" /> Как вчера
          </Button>
        )}
      </div>

      {/* ── Flo-style categories ── */}
      {(() => {
        const isIslam = data.profile?.additionalMode === "islam";
        const isTeen = !data.profile?.age || data.profile.age < 18;
        const hideSex = isIslam || isTeen;

        type CatItem = { id: Category; emoji: string; label: string; bg: string; border: string };
        const mainCats: CatItem[] = [
          { id: "period", emoji: "🩸", label: "Месячные", bg: "bg-gradient-to-br from-[#FFB3C1] to-[#FF8FA3]", border: "border-[#FF8FA3]/30" },
          { id: "pain", emoji: "😣", label: "Боль", bg: "bg-gradient-to-br from-[#FFD6A5] to-[#FFAB76]", border: "border-[#FFAB76]/30" },
          { id: "mood", emoji: "😊", label: "Настроение", bg: "bg-gradient-to-br from-[#D4B8F0] to-[#B8A0E0]", border: "border-[#B8A0E0]/30" },
        ];
        const bodyCats: CatItem[] = [
          { id: "sleep", emoji: "😴", label: "Сон", bg: "bg-gradient-to-br from-[#A8C8F0] to-[#7EB0E0]", border: "border-[#7EB0E0]/30" },
          { id: "energy", emoji: "⚡", label: "Энергия", bg: "bg-gradient-to-br from-[#F0E0A0] to-[#E0C870]", border: "border-[#E0C870]/30" },
          { id: "pms", emoji: "😤", label: "ПМС", bg: "bg-gradient-to-br from-[#D0B8F0] to-[#A888D8]", border: "border-[#A888D8]/30" },
        ];
        const extraCats: CatItem[] = [
          ...(hideSex ? [] : [{ id: "sex" as Category, emoji: "❤️", label: "Секс", bg: "bg-gradient-to-br from-[#FFB3C1] to-[#E88098]", border: "border-[#E88098]/30" }]),
          { id: "stress", emoji: "😰", label: "Стресс", bg: "bg-gradient-to-br from-[#F0C8A8] to-[#D8A880]", border: "border-[#D8A880]/30" },
          { id: "bleeding", emoji: "🔴", label: "Кровотечение", bg: "bg-gradient-to-br from-[#F0A0A0] to-[#D88080]", border: "border-[#D88080]/30" },
          { id: "note", emoji: "📝", label: "Заметка", bg: "bg-gradient-to-br from-[#D4CCE6] to-[#B8B0D0]", border: "border-[#B8B0D0]/30" },
        ];

        function renderCatButton(cat: CatItem) {
          const marked = hasData(cat.id);
          return (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`flex flex-col items-center gap-2 rounded-3xl border p-4 transition-all duration-200 active:scale-[0.93] hover:translate-y-[-2px] hover:shadow-lg ${cat.border} ${marked ? "ring-2 ring-mira-primary ring-offset-2" : ""}`}>
              <div className={`flex h-14 w-14 items-center justify-center rounded-full ${cat.bg} shadow-lg`}>
                <span className="text-2xl">{cat.emoji}</span>
              </div>
              <span className="text-xs font-semibold text-mira-text">{cat.label}</span>
              {marked && <span className="text-[9px] text-mira-primary font-semibold">✓ отмечено</span>}
            </button>
          );
        }

        return (
          <>
            {/* Main — most used */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted mb-2">Основное</p>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {mainCats.map(renderCatButton)}
            </div>

            {/* Body */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted mb-2">Тело</p>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {bodyCats.map(renderCatButton)}
            </div>

            {/* Extra */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted mb-2">Ещё</p>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {extraCats.map(renderCatButton)}
            </div>

            {/* Marked summary */}
            {(() => {
              const allCats = [...mainCats, ...bodyCats, ...extraCats];
              const marked = allCats.filter(c => hasData(c.id));
              if (marked.length === 0) return null;
              return (
                <div className="border-t border-mira-lavender/20 pt-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted mb-2">Уже отмечено</p>
                  <div className="flex flex-wrap gap-2">
                    {marked.map(c => (
                      <div key={c.id} className="flex items-center gap-1.5 rounded-full bg-mira-lavender-light/50 px-3 py-1.5">
                        <span className="text-sm">{c.emoji}</span>
                        <span className="text-[10px] font-semibold text-mira-primary">{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </>
        );
      })()}

      {/* Old grid hidden — replaced above */}
      <div className="hidden grid grid-cols-3 gap-2.5">
        {categories.filter(cat => {
          const isIslam = data.profile?.additionalMode === "islam";
          const age = data.profile?.age;
          const isTeen = !age || age < 18;
          if (isIslam || isTeen) return !["sex", "discharge"].includes(cat.id);
          return true;
        }).map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className="flex flex-col items-center gap-2.5 rounded-2xl border border-white/60 bg-white/80 backdrop-blur-sm p-3.5 shadow-card transition-all duration-200 hover:shadow-card-hover hover:translate-y-[-2px] active:scale-[0.95]">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${cat.color} shadow-inner-glow`}>
              <cat.icon className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-semibold text-mira-text">{cat.label}</span>
            {hasData(cat.id) && <span className="h-1.5 w-1.5 rounded-full bg-mira-primary" />}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" onClick={onClose}
      />

      {/* Desktop: side panel */}
      <motion.div
        initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-y-0 right-0 z-50 hidden w-[420px] overflow-y-auto border-l border-mira-lavender/20 bg-white p-6 shadow-soft lg:block"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-mira-text">{modalTitle}</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-mira-muted hover:bg-mira-lavender-light transition">
            <X className="h-4 w-4" />
          </button>
        </div>
        {categoryContent}
      </motion.div>

      {/* Mobile: bottom sheet */}
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-mira-lavender/20 bg-white p-5 shadow-soft lg:hidden"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-mira-lavender" />
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-mira-text">{modalTitle}</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-mira-muted hover:bg-mira-lavender-light transition">
            <X className="h-4 w-4" />
          </button>
        </div>
        {categoryContent}
      </motion.div>
    </>
  );
}

function periodL(v: string) { return ({ light: "Скудная", moderate: "Умеренная", heavy: "Обильная", very_heavy: "Очень сильная" } as Record<string, string>)[v] ?? v; }
function painKL(v: string) { return ({ cramps: "Спазмы", lower_abdomen: "Низ живота", headache: "Голова", breast: "Грудь", back: "Спина" } as Record<string, string>)[v] ?? v; }
function moodL(v: string) { return ({ normal: "Спокойно", joy: "Радость", sadness: "Грусть", anger: "Раздражение", anxiety: "Тревога", swings: "Перепады" } as Record<string, string>)[v] ?? v; }
function energyL(v: string) { return ({ exhausted: "Истощение", low: "Низкая", normal: "Нормальная", high: "Высокая" } as Record<string, string>)[v] ?? v; }
function sleepQL(v: string) { return ({ good: "Хорошо", normal: "Нормально", bad: "Плохо" } as Record<string, string>)[v] ?? v; }
