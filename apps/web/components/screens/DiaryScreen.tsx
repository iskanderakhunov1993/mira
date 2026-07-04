"use client";

import { useMemo, useState } from "react";
import type React from "react";
import {
  Apple,
  Battery,
  Bed,
  Brain,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Droplet,
  Flame,
  Heart,
  HeartPulse,
  Moon,
  Search,
  ShieldCheck,
  Smile,
  Sparkles,
  Stethoscope,
  TestTube2,
  ThermometerSun,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScreenProps } from "./types";
import { useMiraStore, type DailyLog } from "@/store";

type TrackTone = "pink" | "orange" | "purple" | "blue";

type TrackItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone: TrackTone;
};

type TrackCategory = {
  title: string;
  subtitle?: string;
  items: TrackItem[];
};

const toneClass: Record<TrackTone, { chip: string; active: string; icon: string; iconActive: string }> = {
  pink: {
    chip: "bg-[#FDECF3] text-[#1A1A1A]",
    active: "bg-[#F64F86] text-white shadow-[0_12px_24px_rgba(246,79,134,0.22)]",
    icon: "bg-[#FFD7E4] text-[#F64F86]",
    iconActive: "bg-white/20 text-white",
  },
  orange: {
    chip: "bg-[#FFF4EA] text-[#1A1A1A]",
    active: "bg-[#F6A041] text-white shadow-[0_12px_24px_rgba(246,160,65,0.22)]",
    icon: "bg-[#FFE2BF] text-[#D97815]",
    iconActive: "bg-white/20 text-white",
  },
  purple: {
    chip: "bg-[#F2EAFE] text-[#1A1A1A]",
    active: "bg-[#8B6FE8] text-white shadow-[0_12px_24px_rgba(139,111,232,0.22)]",
    icon: "bg-[#E2D6FF] text-[#805BE0]",
    iconActive: "bg-white/20 text-white",
  },
  blue: {
    chip: "bg-[#EAF6FF] text-[#1A1A1A]",
    active: "bg-[#2C9FE8] text-white shadow-[0_12px_24px_rgba(44,159,232,0.20)]",
    icon: "bg-[#D4ECFF] text-[#247FC0]",
    iconActive: "bg-white/20 text-white",
  },
};

const menstrualCategory: TrackCategory = {
  title: "Менструальные выделения",
  subtitle: "Оцени интенсивность за день",
  items: [
    { id: "flow_spotting", label: "Скудные", icon: Droplet, tone: "pink" },
    { id: "flow_moderate", label: "Умеренные", icon: Droplet, tone: "pink" },
    { id: "flow_heavy", label: "Обильные", icon: DropletsIcon, tone: "pink" },
    { id: "flow_clots", label: "Сгустки крови", icon: CircleDot, tone: "pink" },
  ],
};

const trackCategories: TrackCategory[] = [
  {
    title: "Боль",
    items: [
      { id: "pain_lower", label: "Боли внизу живота", icon: HeartPulse, tone: "pink" },
      { id: "pain_back", label: "Боль в спине", icon: Stethoscope, tone: "pink" },
      { id: "pain_head", label: "Головная боль", icon: Brain, tone: "pink" },
      { id: "pain_breast", label: "Чувствительная грудь", icon: Heart, tone: "pink" },
      { id: "pain_joint", label: "Боль в суставах", icon: Sparkles, tone: "pink" },
    ],
  },
  {
    title: "Пищеварение и аппетит",
    items: [
      { id: "digestion_bloat", label: "Вздутие", icon: CircleDot, tone: "orange" },
      { id: "digestion_nausea", label: "Тошнота", icon: Utensils, tone: "orange" },
      { id: "stool_constipation", label: "Запор", icon: ShieldCheck, tone: "orange" },
      { id: "stool_diarrhea", label: "Диарея", icon: Droplet, tone: "orange" },
      { id: "appetite_high", label: "Повышенный аппетит", icon: Apple, tone: "orange" },
      { id: "craving_sweet", label: "Тяга к сладкому", icon: Sparkles, tone: "orange" },
    ],
  },
  {
    title: "Выделения",
    items: [
      { id: "discharge_mucus", label: "Слизистые", icon: Droplet, tone: "purple" },
      { id: "discharge_creamy", label: "Кремообразные", icon: Droplet, tone: "purple" },
      { id: "discharge_watery", label: "Водянистые", icon: DropletsIcon, tone: "purple" },
      { id: "discharge_sticky", label: "Липкие", icon: CircleDot, tone: "purple" },
      { id: "discharge_itch", label: "Зуд", icon: Flame, tone: "purple" },
      { id: "discharge_dryness", label: "Сухость", icon: Moon, tone: "purple" },
    ],
  },
  {
    title: "Настроение",
    items: [
      { id: "mood_calm", label: "Спокойствие", icon: Smile, tone: "orange" },
      { id: "mood_joy", label: "Радость", icon: Smile, tone: "orange" },
      { id: "mood_irritable", label: "Раздражение", icon: Flame, tone: "orange" },
      { id: "mood_sad", label: "Грусть", icon: Moon, tone: "orange" },
      { id: "mood_anxious", label: "Тревога", icon: Brain, tone: "orange" },
      { id: "mood_swings", label: "Перепады настроения", icon: ThermometerSun, tone: "orange" },
      { id: "mood_apathy", label: "Апатия", icon: CircleDot, tone: "orange" },
    ],
  },
  {
    title: "Энергия и сон",
    items: [
      { id: "energy_high", label: "Много энергии", icon: Battery, tone: "blue" },
      { id: "energy_low", label: "Мало энергии", icon: Battery, tone: "blue" },
      { id: "energy_exhausted", label: "Нет сил", icon: Battery, tone: "blue" },
      { id: "sleep_good", label: "Хороший сон", icon: Bed, tone: "blue" },
      { id: "sleep_bad", label: "Плохой сон", icon: Moon, tone: "blue" },
      { id: "sleep_insomnia", label: "Бессонница", icon: Moon, tone: "blue" },
    ],
  },
  {
    title: "Секс и сексуальное желание",
    items: [
      { id: "sex_none", label: "Секса не было", icon: ShieldCheck, tone: "pink" },
      { id: "sex_protected", label: "Секс с защитой", icon: ShieldCheck, tone: "pink" },
      { id: "sex_unprotected", label: "Секс без защиты", icon: Heart, tone: "pink" },
      { id: "sex_pain", label: "Боль после секса", icon: HeartPulse, tone: "pink" },
      { id: "sex_bleeding", label: "Кровь после секса", icon: Droplet, tone: "pink" },
      { id: "libido_high", label: "Сильное желание", icon: Heart, tone: "pink" },
      { id: "libido_medium", label: "Среднее желание", icon: Heart, tone: "pink" },
      { id: "libido_low", label: "Слабое желание", icon: Heart, tone: "pink" },
    ],
  },
  {
    title: "Тесты и беременность",
    items: [
      { id: "pregnancy_negative", label: "Тест отрицательный", icon: TestTube2, tone: "blue" },
      { id: "pregnancy_positive", label: "Тест положительный", icon: TestTube2, tone: "blue" },
      { id: "pregnancy_faint", label: "Неясный тест", icon: TestTube2, tone: "blue" },
      { id: "ovulation_positive", label: "Овуляционный тест +", icon: CircleDot, tone: "blue" },
      { id: "ovulation_negative", label: "Овуляционный тест -", icon: CircleDot, tone: "blue" },
    ],
  },
];

const optionById = new Map([menstrualCategory, ...trackCategories].flatMap((category) => category.items.map((item) => [item.id, item])));

function DropletsIcon(props: React.ComponentProps<typeof Droplet>) {
  return (
    <span className="relative flex h-5 w-5 items-center justify-center">
      <Droplet className="absolute left-0 top-0 h-4 w-4" {...props} />
      <Droplet className="absolute bottom-0 right-0 h-3.5 w-3.5" {...props} />
    </span>
  );
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyLog(date: string, cycleDay: number): DailyLog {
  return {
    date,
    cycleDay,
    symptoms: {
      bleeding: { amount: 0, pads: 0, color: null, clots: null },
      pain: {
        level: 0,
        type: null,
        location: [],
        radiation: [],
        affectedLife: "none",
        tookPainkiller: false,
        painkillerHelped: null,
      },
      mood: null,
      energy: null,
      sleep: { quality: null, hours: null, wokeUp: null, wokeUpReason: null },
      skin: { acne: false, acneCount: null, dryness: false, oiliness: false, hairLoss: false },
      libido: null,
      context: [],
      note: "",
    },
    selfCare: {
      water: 0,
      calories: null,
      protein: null,
      fats: null,
      carbs: null,
      walking: null,
      workout: null,
      weight: null,
      vitamins: { magnesium: false, omega3: false, zinc: false },
    },
  };
}

function addUnique(target: string[], values: string[]) {
  return Array.from(new Set([...target, ...values]));
}

function buildUpdatedLog(base: DailyLog, selectedIds: string[]): DailyLog {
  const selected = new Set(selectedIds);
  const labels = selectedIds.map((id) => optionById.get(id)?.label).filter(Boolean) as string[];
  const next: DailyLog = {
    ...base,
    symptoms: {
      ...base.symptoms,
      bleeding: { ...base.symptoms.bleeding },
      pain: {
        ...base.symptoms.pain,
        location: [...base.symptoms.pain.location],
        radiation: [...base.symptoms.pain.radiation],
      },
      sleep: { ...base.symptoms.sleep, wokeUpReason: base.symptoms.sleep.wokeUpReason ? [...base.symptoms.sleep.wokeUpReason] : null },
      skin: { ...base.symptoms.skin },
      context: [...base.symptoms.context],
    },
    selfCare: { ...base.selfCare, vitamins: { ...base.selfCare.vitamins } },
  };

  if (selected.has("flow_spotting")) next.symptoms.bleeding.amount = Math.max(next.symptoms.bleeding.amount, 1) as DailyLog["symptoms"]["bleeding"]["amount"];
  if (selected.has("flow_moderate")) next.symptoms.bleeding.amount = Math.max(next.symptoms.bleeding.amount, 2) as DailyLog["symptoms"]["bleeding"]["amount"];
  if (selected.has("flow_heavy")) {
    next.symptoms.bleeding.amount = 3;
    next.symptoms.bleeding.pads = Math.max(next.symptoms.bleeding.pads, 6);
  }
  if (selected.has("flow_clots")) next.symptoms.bleeding.clots = "small";

  const painLocations: string[] = [];
  if (selected.has("pain_lower")) painLocations.push("low_abdomen");
  if (selected.has("pain_back")) painLocations.push("back");
  if (selected.has("pain_head")) painLocations.push("head");
  if (selected.has("pain_breast")) painLocations.push("breast");
  if (selected.has("pain_joint")) painLocations.push("joints");
  if (selected.has("sex_pain")) painLocations.push("after_sex");
  if (painLocations.length > 0) {
    next.symptoms.pain.level = Math.max(next.symptoms.pain.level, 2) as DailyLog["symptoms"]["pain"]["level"];
    next.symptoms.pain.type = selected.has("pain_lower") ? "cramping" : "aching";
    next.symptoms.pain.location = addUnique(next.symptoms.pain.location, painLocations);
  }

  if (selected.has("mood_calm") || selected.has("mood_joy")) next.symptoms.mood = selected.has("mood_joy") ? "great" : "good";
  if (selected.has("mood_irritable")) next.symptoms.mood = "irritable";
  if (selected.has("mood_anxious")) next.symptoms.mood = "anxious";
  if (selected.has("mood_sad") || selected.has("mood_apathy")) next.symptoms.mood = "low";

  if (selected.has("energy_high")) next.symptoms.energy = "high";
  if (selected.has("energy_low")) next.symptoms.energy = "low";
  if (selected.has("energy_exhausted")) next.symptoms.energy = "exhausted";
  if (selected.has("sleep_good")) next.symptoms.sleep.quality = "good";
  if (selected.has("sleep_bad") || selected.has("sleep_insomnia")) next.symptoms.sleep.quality = "poor";

  if (selected.has("libido_high")) next.symptoms.libido = "high";
  if (selected.has("libido_medium")) next.symptoms.libido = "medium";
  if (selected.has("libido_low")) next.symptoms.libido = "low";
  if (selected.has("sex_none")) next.symptoms.libido = next.symptoms.libido ?? "none";
  if (selected.has("discharge_watery")) next.symptoms.bleeding.color = "watery";

  const contextIds = selectedIds.filter((id) => ![
    "flow_spotting",
    "flow_moderate",
    "flow_heavy",
    "flow_clots",
    "pain_lower",
    "pain_back",
    "pain_head",
    "pain_breast",
    "pain_joint",
    "mood_calm",
    "mood_joy",
    "mood_irritable",
    "mood_anxious",
    "mood_sad",
    "mood_apathy",
    "energy_high",
    "energy_low",
    "energy_exhausted",
    "sleep_good",
    "sleep_bad",
    "sleep_insomnia",
    "libido_high",
    "libido_medium",
    "libido_low",
    "sex_none",
    "discharge_watery",
  ].includes(id));
  next.symptoms.context = addUnique(next.symptoms.context, contextIds);

  if (labels.length > 0) {
    const line = `Отмечено: ${labels.join(", ")}`;
    next.symptoms.note = next.symptoms.note ? `${next.symptoms.note}\n${line}` : line;
  }

  return next;
}

function TrackChip({ item, selected, onClick }: { item: TrackItem; selected: boolean; onClick: () => void }) {
  const Icon = item.icon;
  const tone = toneClass[item.tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-[54px] items-center gap-3 rounded-full py-2 pl-2 pr-5 text-left text-[17px] font-bold leading-tight transition active:scale-[0.98] ${
        selected ? tone.active : tone.chip
      }`}
      aria-pressed={selected}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${selected ? tone.iconActive : tone.icon}`}>
        <Icon className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <span className={selected ? "text-white" : "text-[#1A1A1A]"}>{item.label}</span>
    </button>
  );
}

function FeelingShortcut({ item, selected, onClick }: { item: TrackItem; selected: boolean; onClick: () => void }) {
  const Icon = item.icon;
  const tone = toneClass[item.tone];
  return (
    <button type="button" onClick={onClick} className="min-w-0 text-center active:scale-[0.98]" aria-pressed={selected}>
      <span className={`mx-auto flex h-[76px] w-[76px] items-center justify-center rounded-full ${selected ? tone.active : tone.icon}`}>
        <Icon className="h-8 w-8" strokeWidth={2.4} />
      </span>
      <span className="mt-3 block text-sm font-bold leading-tight text-[#1A1A1A]">{item.label}</span>
    </button>
  );
}

export function DiaryScreen({ navigate }: ScreenProps) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const logs = useMiraStore((state) => state.logs.dailyLogs);
  const cycleDay = useMiraStore((state) => state.cycle.currentDay);
  const setDailyLog = useMiraStore((state) => state.setDailyLog);
  const topItems = trackCategories
    .flatMap((category) => category.items)
    .filter((item) => ["mood_calm", "mood_joy", "discharge_creamy", "discharge_watery"].includes(item.id));

  const visibleCategories = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return trackCategories;
    return trackCategories
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => item.label.toLowerCase().includes(normalized)),
      }))
      .filter((category) => category.items.length > 0);
  }, [query]);

  function toggle(id: string) {
    setSaved(false);
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function save() {
    const date = todayIso();
    const existingLog = logs.find((log) => log.date === date);
    const updatedLog = buildUpdatedLog(existingLog ?? createEmptyLog(date, cycleDay), selectedIds);
    const cleanNote = note.trim();
    if (cleanNote) {
      updatedLog.symptoms.note = updatedLog.symptoms.note
        ? `${updatedLog.symptoms.note}\nЗаметка: ${cleanNote}`
        : cleanNote;
    }
    setDailyLog(updatedLog);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="mx-auto min-h-screen max-w-[720px] bg-[#F1F1F1] pb-56 text-[#1A1A1A]">
      <div className="sticky top-0 z-20 bg-[#F1F1F1]/95 px-5 pb-4 pt-3 backdrop-blur-xl">
        <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-[#BDBDBD]" />
        <header className="flex items-center justify-between">
          <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full text-[#111]" aria-label="Назад">
            <ChevronLeft className="h-8 w-8" />
          </button>
          <div className="text-center">
            <h1 className="text-[32px] font-black leading-none">Сегодня</h1>
            <p className="mt-1 text-sm font-bold text-[#777]">{cycleDay}-й день цикла</p>
          </div>
          <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full text-[#B9B9B9]" aria-label="Следующий день">
            <ChevronRight className="h-8 w-8" />
          </button>
        </header>
        <div className="mt-6 flex h-[60px] items-center gap-3 rounded-full bg-[#E3E3E3] px-5">
          <Search className="h-7 w-7 shrink-0 text-[#9B9B9B]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Искать или задать вопрос"
            className="h-full min-w-0 flex-1 bg-transparent text-[20px] font-semibold text-[#1A1A1A] outline-none placeholder:text-[#A8A8A8]"
          />
        </div>
      </div>

      <main className="space-y-6 px-5">
        <section className="rounded-[28px] bg-white px-5 py-6 text-[#1A1A1A] shadow-[0_12px_32px_rgba(20,20,20,0.04)]">
          <h2 className="text-[24px] font-black leading-tight text-[#1A1A1A]">Как вы себя чувствуете сегодня?</h2>
          <div className="mt-6 grid grid-cols-4 gap-4">
            {topItems.map((item) => (
              <FeelingShortcut key={item.id} item={item} selected={selectedIds.includes(item.id)} onClick={() => toggle(item.id)} />
            ))}
          </div>
        </section>

        <div className="flex items-center">
          <h2 className="text-[30px] font-black">Категории</h2>
        </div>

        {visibleCategories.map((category) => (
          <section key={category.title} className="rounded-[28px] bg-white px-5 py-6 text-[#1A1A1A] shadow-[0_12px_32px_rgba(20,20,20,0.04)]">
            <h3 className="text-[26px] font-black leading-tight text-[#1A1A1A]">{category.title}</h3>
            {category.subtitle && <p className="mt-2 text-base font-semibold text-[#8E8E93]">{category.subtitle}</p>}
            <div className="mt-5 flex flex-wrap gap-3">
              {category.items.map((item) => (
                <TrackChip key={item.id} item={item} selected={selectedIds.includes(item.id)} onClick={() => toggle(item.id)} />
              ))}
            </div>
          </section>
        ))}

        {visibleCategories.length === 0 && (
          <section className="rounded-[28px] bg-white px-5 py-8 text-center">
            <p className="text-lg font-black">Ничего не нашла</p>
            <p className="mt-2 text-sm font-semibold text-[#8E8E93]">Попробуй другое слово или выбери из категорий.</p>
          </section>
        )}

        <section className="rounded-[28px] bg-white px-5 py-6 text-[#1A1A1A] shadow-[0_12px_32px_rgba(20,20,20,0.04)]">
          <h3 className="text-[26px] font-black leading-tight text-[#1A1A1A]">Заметка</h3>
          <textarea
            value={note}
            onChange={(event) => {
              setSaved(false);
              setNote(event.target.value);
            }}
            placeholder="Например: мало спала, стресс, тянет на сладкое..."
            className="mt-5 min-h-[120px] w-full resize-none rounded-[24px] bg-[#F1F1F1] px-5 py-4 text-base font-semibold leading-relaxed text-[#1A1A1A] outline-none placeholder:text-[#A8A8A8] focus:ring-2 focus:ring-[#F64F86]/35"
          />
        </section>
      </main>

      <footer className="fixed inset-x-0 bottom-24 z-50 px-5">
        <div className="mx-auto grid max-w-[720px] grid-cols-[1fr_auto] items-center gap-3 rounded-[28px] bg-white/95 px-4 py-3 shadow-[0_-14px_34px_rgba(0,0,0,0.08)] backdrop-blur-xl">
          <div>
            <p className="text-sm font-black text-[#1A1A1A]">{selectedIds.length ? `Выбрано: ${selectedIds.length}` : note.trim() ? "Есть заметка" : "Выберите отметки"}</p>
            <p className="mt-0.5 text-xs font-bold text-[#8E8E93]">
              {saved ? "Сохранено в Анализ и Отчёт. Секс и заметки скрыты по умолчанию." : "Секс и личные заметки скрыты из Report по умолчанию."}
            </p>
            {saved && (
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" className="rounded-full bg-[#F1F1F1] px-3 py-1.5 text-xs font-black text-[#1A1A1A]" onClick={() => navigate("analytics")}>
                  Анализ
                </button>
                <button type="button" className="rounded-full bg-[#F1F1F1] px-3 py-1.5 text-xs font-black text-[#1A1A1A]" onClick={() => navigate("report")}>
                  Отчёт врачу
                </button>
              </div>
            )}
          </div>
          <Button
            type="button"
            disabled={selectedIds.length === 0 && !note.trim()}
            className="h-13 rounded-full bg-[#F64F86] px-6 font-black text-white hover:bg-[#E83F78] disabled:bg-[#E8E8E8] disabled:text-[#9D9D9D]"
            onClick={save}
          >
            {saved ? "Сохранено" : "Сохранить"}
          </Button>
        </div>
      </footer>
    </div>
  );
}

export default DiaryScreen;
