"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Droplets, Activity, Brain, Flame, BedDouble, Heart,
  Sparkles, Salad, BookOpen, RotateCcw, X, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { saveCheckIn, dateKey, getCheckIn } from "@/lib/store";
import type { MiraLocalData, DailyCheckIn, PeriodIntensity, PeriodType, PainKind, PainLevel, MoodValue, EnergyValue, SleepQuality, IntimacyProtection, IntimacyFeeling } from "@/lib/types";

type Category = "period" | "pain" | "mood" | "energy" | "sleep" | "intimacy" | "pms" | "nutrition_note" | "note";

const categories: { id: Category; label: string; icon: typeof Droplets; color: string }[] = [
  { id: "period", label: "Месячные", icon: Droplets, color: "text-[#C47E9B] bg-[#F5E0EA]" },
  { id: "pain", label: "Боль", icon: Activity, color: "text-[#C4A07E] bg-[#F5ECE0]" },
  { id: "mood", label: "Настроение", icon: Brain, color: "text-[#9B8EC4] bg-[#EDE8F5]" },
  { id: "energy", label: "Энергия", icon: Flame, color: "text-[#C4B07E] bg-[#F5F0E0]" },
  { id: "sleep", label: "Сон", icon: BedDouble, color: "text-[#7E8EC4] bg-[#E0E8F5]" },
  { id: "intimacy", label: "Интимность", icon: Heart, color: "text-[#C47E9B] bg-[#F5E0EA]" },
  { id: "pms", label: "ПМС", icon: Sparkles, color: "text-[#A07EC4] bg-[#EDE0F5]" },
  { id: "nutrition_note", label: "Питание", icon: Salad, color: "text-[#7BAF8D] bg-[#E0F5E8]" },
  { id: "note", label: "Заметка", icon: BookOpen, color: "text-mira-muted bg-mira-lavender-light" },
];

const pmsSymptoms = [
  "Вздутие", "Раздражительность", "Тяга к еде", "Акне",
  "Усталость", "Болезненность груди", "Головная боль", "Тревожность",
];

function Chip({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
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
};

export function CheckInModal({ open, onClose, data, persist }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const existing = getCheckIn(data);

  // Form state
  const [periodIntensity, setPeriodIntensity] = useState<PeriodIntensity | null>(null);
  const [periodType, setPeriodType] = useState<PeriodType | null>(null);
  const [painKinds, setPainKinds] = useState<PainKind[]>([]);
  const [painLevel, setPainLevel] = useState<PainLevel | null>(null);
  const [mood, setMood] = useState<MoodValue | null>(null);
  const [energy, setEnergy] = useState<EnergyValue | null>(null);
  const [sleepQuality, setSleepQuality] = useState<SleepQuality | null>(null);
  const [sleepHours, setSleepHours] = useState<number | null>(null);
  const [intimacyHappened, setIntimacyHappened] = useState(false);
  const [intimacyProtection, setIntimacyProtection] = useState<IntimacyProtection | null>(null);
  const [intimacyFeeling, setIntimacyFeeling] = useState<IntimacyFeeling | null>(null);
  const [intimacyShowCalendar, setIntimacyShowCalendar] = useState(false);
  const [pmsSelected, setPmsSelected] = useState<string[]>([]);
  const [noteText, setNoteText] = useState("");

  // Sync form state with existing data when opening
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
  }, [open, existing]);

  if (!open) return null;

  function save() {
    const date = dateKey();
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

    persist(saveCheckIn(data, checkIn));
    setActiveCategory(null);
    onClose();
  }

  function repeatYesterday() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = dateKey(yesterday);
    const yData = data.checkIns[yKey];
    if (!yData) return;

    const date = dateKey();
    const checkIn: DailyCheckIn = { ...yData, date, savedAt: new Date().toISOString() };
    persist(saveCheckIn(data, checkIn));
    onClose();
  }

  const hasYesterday = (() => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return !!data.checkIns[dateKey(y)];
  })();

  function hasData(cat: Category): boolean {
    if (!existing) return false;
    const m: Record<Category, boolean> = {
      period: !!existing.period, pain: !!existing.pain, mood: !!existing.mood,
      energy: !!existing.energy, sleep: !!existing.sleep, intimacy: !!existing.intimacy,
      pms: !!existing.pms, nutrition_note: (existing.meals?.length ?? 0) > 0, note: !!existing.note,
    };
    return m[cat];
  }

  function togglePms(s: string) {
    setPmsSelected(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  const categoryContent = activeCategory ? (
    <div>
      <button onClick={() => setActiveCategory(null)} className="mb-4 text-sm text-mira-muted hover:text-mira-primary">← Назад</button>

      {activeCategory === "period" && (
        <>
          <h3 className="mb-4 text-lg font-bold text-mira-text">Месячные</h3>
          <p className="mb-2 text-sm font-semibold text-mira-text">Интенсивность</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {(["light", "moderate", "heavy", "very_heavy"] as PeriodIntensity[]).map(v => (
              <Chip key={v} label={periodL(v)} active={periodIntensity === v} onClick={() => setPeriodIntensity(v)} />
            ))}
          </div>
          <p className="mb-2 text-sm font-semibold text-mira-text">Тип выделений</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {(["normal", "spotting", "brown", "clots"] as PeriodType[]).map(v => (
              <Chip key={v} label={periodTL(v)} active={periodType === v} onClick={() => setPeriodType(v)} />
            ))}
          </div>
          {periodIntensity === "very_heavy" && (
            <div className="mb-4 rounded-2xl border border-[#C4B07E]/20 bg-[#F5F0E0]/50 p-3">
              <p className="text-xs text-[#A09060]">Если это необычно для вас или сопровождается сильной слабостью, лучше обратиться к специалисту.</p>
            </div>
          )}
        </>
      )}

      {activeCategory === "pain" && (
        <>
          <h3 className="mb-4 text-lg font-bold text-mira-text">Боль</h3>
          <p className="mb-2 text-sm font-semibold text-mira-text">Тип</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {(["none", "cramps", "lower_abdomen", "headache", "breast", "back", "ovulatory"] as PainKind[]).map(v => (
              <Chip key={v} label={painKL(v)} active={painKinds.includes(v)}
                onClick={() => setPainKinds(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])} />
            ))}
          </div>
          <p className="mb-2 text-sm font-semibold text-mira-text">Сила</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {(["light", "medium", "strong"] as PainLevel[]).map(v => (
              <Chip key={v} label={painLL(v)} active={painLevel === v} onClick={() => setPainLevel(v)} />
            ))}
          </div>
          {painLevel === "strong" && (
            <div className="mb-4 rounded-2xl border border-mira-cycle/15 bg-mira-rose-light/30 p-3">
              <p className="text-xs text-mira-cycle">При сильной боли Mira не предложит интенсивную тренировку.</p>
            </div>
          )}
        </>
      )}

      {activeCategory === "mood" && (
        <>
          <h3 className="mb-4 text-lg font-bold text-mira-text">Настроение</h3>
          <div className="mb-4 flex flex-wrap gap-2">
            {(["normal", "joy", "sadness", "anger", "anxiety", "swings"] as MoodValue[]).map(v => (
              <Chip key={v} label={moodL(v)} active={mood === v} onClick={() => setMood(v)} />
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
          <p className="mb-2 text-sm font-semibold text-mira-text">Качество</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {(["good", "normal", "bad", "little", "insomnia"] as SleepQuality[]).map(v => (
              <Chip key={v} label={sleepQL(v)} active={sleepQuality === v} onClick={() => setSleepQuality(v)} />
            ))}
          </div>
          <p className="mb-2 text-sm font-semibold text-mira-text">Продолжительность</p>
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-mira-lavender/30 bg-mira-bg p-1">
            {[5, 6, 7, 8].map(h => (
              <button key={h} onClick={() => setSleepHours(h)} className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                sleepHours === h ? "bg-white text-mira-primary shadow-card" : "text-mira-muted"
              }`}>{h} ч</button>
            ))}
          </div>
        </>
      )}

      {activeCategory === "intimacy" && (
        <>
          <h3 className="mb-1 text-lg font-bold text-mira-text">Интимность</h3>
          <p className="mb-4 text-xs text-mira-muted">Данные приватны и скрыты по умолчанию</p>
          <div className="mb-4 grid grid-cols-2 gap-2">
            <button onClick={() => setIntimacyHappened(false)} className={`rounded-2xl border p-3 text-sm font-semibold ${
              !intimacyHappened ? "border-mira-primary bg-mira-lavender-light text-mira-primary" : "border-mira-lavender/30 text-mira-muted"
            }`}>Не было</button>
            <button onClick={() => setIntimacyHappened(true)} className={`rounded-2xl border p-3 text-sm font-semibold ${
              intimacyHappened ? "border-mira-primary bg-mira-lavender-light text-mira-primary" : "border-mira-lavender/30 text-mira-muted"
            }`}>Была</button>
          </div>
          {intimacyHappened && (
            <>
              <p className="mb-2 text-sm font-semibold text-mira-text">Детали</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {(["protected", "unprotected", "interrupted", "masturbation", "toy"] as IntimacyProtection[]).map(v => (
                  <Chip key={v} label={intimPL(v)} active={intimacyProtection === v} onClick={() => setIntimacyProtection(v)} />
                ))}
              </div>
              <p className="mb-2 text-sm font-semibold text-mira-text">Ощущения</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {(["good", "normal", "discomfort", "pain"] as IntimacyFeeling[]).map(v => (
                  <Chip key={v} label={intimFL(v)} active={intimacyFeeling === v} onClick={() => setIntimacyFeeling(v)} />
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
        </>
      )}

      {activeCategory === "pms" && (
        <>
          <h3 className="mb-4 text-lg font-bold text-mira-text">ПМС</h3>
          <p className="mb-3 text-sm text-mira-muted">Выберите симптомы</p>
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
            placeholder="Запишите что-нибудь..."
            className="mb-4 w-full rounded-2xl border border-mira-lavender/30 bg-mira-bg p-3 text-sm text-mira-text placeholder:text-mira-muted focus:border-mira-primary focus:outline-none"
            rows={4} />
        </>
      )}

      {activeCategory === "nutrition_note" && (
        <p className="text-sm text-mira-muted">Используйте раздел «Питание» для добавления приёмов пищи</p>
      )}

      {activeCategory !== "nutrition_note" && (
        <Button className="w-full" onClick={save}>Сохранить</Button>
      )}
    </div>
  ) : (
    <div>
      {hasYesterday && (
        <Button variant="secondary" size="sm" className="mb-4 w-full" onClick={repeatYesterday}>
          <RotateCcw className="h-3.5 w-3.5" /> Повторить вчерашние отметки
        </Button>
      )}
      <div className="grid grid-cols-3 gap-3">
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className="flex flex-col items-center gap-2 rounded-2xl border border-mira-lavender/20 bg-white p-3 shadow-card transition hover:shadow-soft active:scale-[0.98]">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cat.color}`}>
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
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" onClick={onClose}
      />

      {/* Desktop: side panel from right */}
      <motion.div
        initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-y-0 right-0 z-50 hidden w-[420px] overflow-y-auto border-l border-mira-lavender/20 bg-white p-6 shadow-soft lg:block"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-mira-text">Отследить сегодня</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-mira-muted hover:bg-mira-lavender-light">
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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-mira-text">Отследить сегодня</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-mira-muted hover:bg-mira-lavender-light">
            <X className="h-4 w-4" />
          </button>
        </div>
        {categoryContent}
      </motion.div>
    </>
  );
}

// Label helpers
function periodL(v: string) { return ({ light: "Скудная", moderate: "Умеренная", heavy: "Обильная", very_heavy: "Очень сильная" } as Record<string, string>)[v] ?? v; }
function periodTL(v: string) { return ({ normal: "Обычные", spotting: "Мажущие", brown: "Коричневые", clots: "Сгустки" } as Record<string, string>)[v] ?? v; }
function painKL(v: string) { return ({ none: "Нет боли", cramps: "Спазмы", lower_abdomen: "Низ живота", headache: "Голова", breast: "Грудь", back: "Спина", ovulatory: "Овуляторная" } as Record<string, string>)[v] ?? v; }
function painLL(v: string) { return ({ light: "Лёгкая", medium: "Средняя", strong: "Сильная" } as Record<string, string>)[v] ?? v; }
function moodL(v: string) { return ({ normal: "Нормально", joy: "Радость", sadness: "Грусть", anger: "Злость", anxiety: "Тревога", swings: "Перепады" } as Record<string, string>)[v] ?? v; }
function energyL(v: string) { return ({ exhausted: "Истощение", low: "Мало сил", normal: "Нормально", high: "Много сил" } as Record<string, string>)[v] ?? v; }
function sleepQL(v: string) { return ({ good: "Хороший", normal: "Нормальный", bad: "Плохой", little: "Мало сна", insomnia: "Бессонница" } as Record<string, string>)[v] ?? v; }
function intimPL(v: string) { return ({ protected: "С защитой", unprotected: "Без защиты", interrupted: "Прерванный акт", masturbation: "Мастурбация", toy: "Секс-игрушка" } as Record<string, string>)[v] ?? v; }
function intimFL(v: string) { return ({ good: "Хорошо", normal: "Нормально", discomfort: "Дискомфорт", pain: "Боль" } as Record<string, string>)[v] ?? v; }
