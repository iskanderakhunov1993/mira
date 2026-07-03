"use client";

import React, { memo, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMiraStore, type DailyLog } from "@/store";

type Tone = "pink" | "orange" | "purple" | "green" | "blue" | "teal";

type SymptomOption = {
  id: string;
  label: string;
  icon: string;
  tone: Tone;
};

type SymptomCategory = {
  title: string;
  items: SymptomOption[];
};

type SymptomsModalProps = {
  open: boolean;
  onClose: () => void;
  initialCategoryTitle?: string;
};

const toneClass: Record<Tone, { chip: string; selected: string; icon: string }> = {
  pink: {
    chip: "bg-[#FBEAF3] text-[#1A1A1A]",
    selected: "bg-[#7C5FA8] text-white shadow-[0_12px_28px_rgba(124,95,168,0.24)]",
    icon: "bg-[#F6D2E4]",
  },
  orange: {
    chip: "bg-[#FFF4EA] text-[#1A1A1A]",
    selected: "bg-[#F6A041] text-white shadow-[0_12px_28px_rgba(246,160,65,0.22)]",
    icon: "bg-[#FFE0BC]",
  },
  purple: {
    chip: "bg-[#F0EAFE] text-[#1A1A1A]",
    selected: "bg-[#8C6BE8] text-white shadow-[0_12px_28px_rgba(140,107,232,0.22)]",
    icon: "bg-[#E0D3FF]",
  },
  green: {
    chip: "bg-[#EAF8EF] text-[#1A1A1A]",
    selected: "bg-[#28A965] text-white shadow-[0_12px_28px_rgba(40,169,101,0.22)]",
    icon: "bg-[#CDEFD9]",
  },
  blue: {
    chip: "bg-[#E8F6FE] text-[#1A1A1A]",
    selected: "bg-[#29A9E8] text-white shadow-[0_12px_28px_rgba(41,169,232,0.22)]",
    icon: "bg-[#C8ECFC]",
  },
  teal: {
    chip: "bg-[#E7F8F6] text-[#1A1A1A]",
    selected: "bg-[#20A7A0] text-white shadow-[0_12px_28px_rgba(32,167,160,0.22)]",
    icon: "bg-[#C8EEEA]",
  },
};

const symptomCategories: SymptomCategory[] = [
  {
    title: "Настроение",
    items: [
      { id: "mood_calm", label: "Спокойствие", icon: "😌", tone: "orange" },
      { id: "mood_joy", label: "Радость", icon: "🙂", tone: "orange" },
      { id: "energy_high", label: "Много энергии", icon: "⚡", tone: "orange" },
      { id: "mood_playful", label: "Игривость", icon: "😜", tone: "orange" },
      { id: "mood_swings", label: "Перепады настроения", icon: "🥲", tone: "orange" },
      { id: "mood_irritable", label: "Раздражение", icon: "😠", tone: "orange" },
      { id: "mood_sad", label: "Грусть", icon: "☹️", tone: "orange" },
      { id: "mood_anxious", label: "Тревога", icon: "😟", tone: "orange" },
      { id: "mood_depressed", label: "Подавленность", icon: "😔", tone: "orange" },
      { id: "mood_guilt", label: "Чувство вины", icon: "😞", tone: "orange" },
      { id: "mood_obsessive", label: "Навязчивые мысли", icon: "☁️", tone: "orange" },
      { id: "energy_low", label: "Мало энергии", icon: "🔋", tone: "orange" },
      { id: "mood_apathy", label: "Апатия", icon: "😑", tone: "orange" },
      { id: "mood_confused", label: "Растерянность", icon: "😶", tone: "orange" },
      { id: "mood_self_criticism", label: "Жесткая самокритика", icon: "😣", tone: "orange" },
    ],
  },
  {
    title: "Симптомы",
    items: [
      { id: "all_good", label: "Все в порядке", icon: "👍", tone: "pink" },
      { id: "lower_pain", label: "Боли внизу живота", icon: "🎯", tone: "pink" },
      { id: "breast_sensitive", label: "Чувствительная грудь", icon: "🎯", tone: "pink" },
      { id: "headache", label: "Головная боль", icon: "🤕", tone: "pink" },
      { id: "acne", label: "Прыщи", icon: "🟤", tone: "pink" },
      { id: "back_pain", label: "Боль в спине", icon: "🎯", tone: "pink" },
      { id: "fatigue", label: "Усталость", icon: "🔋", tone: "pink" },
      { id: "hot_flashes", label: "Приливы жара", icon: "🔥", tone: "pink" },
      { id: "night_sweats", label: "Ночная потливость", icon: "💦", tone: "pink" },
      { id: "forgetful", label: "Забывчивость", icon: "☁️", tone: "pink" },
      { id: "joint_pain", label: "Боль в суставах", icon: "🦵", tone: "pink" },
      { id: "burning_mouth", label: "Жжение во рту", icon: "🌶️", tone: "pink" },
      { id: "appetite_high", label: "Повышенный аппетит", icon: "🍔", tone: "pink" },
      { id: "insomnia", label: "Бессонница", icon: "🌙", tone: "pink" },
      { id: "abdomen_pain", label: "Боль в животе", icon: "🎯", tone: "pink" },
      { id: "vaginal_itch", label: "Зуд во влагалище", icon: "🌸", tone: "pink" },
      { id: "vaginal_dryness", label: "Сухость во влагалище", icon: "🌸", tone: "pink" },
    ],
  },
  {
    title: "Вагинальные выделения",
    items: [
      { id: "discharge_none", label: "Выделений нет", icon: "∅", tone: "purple" },
      { id: "discharge_creamy", label: "Кремообразные", icon: "💧", tone: "purple" },
      { id: "discharge_watery", label: "Водянистые", icon: "💦", tone: "purple" },
      { id: "discharge_sticky", label: "Липкие", icon: "●", tone: "purple" },
      { id: "discharge_mucus", label: "Слизистые", icon: "💧", tone: "purple" },
      { id: "discharge_spotting", label: "Кровомажущие", icon: "🩸", tone: "purple" },
      { id: "discharge_unusual", label: "Нетипичные", icon: "✦", tone: "purple" },
      { id: "discharge_white_clumpy", label: "Белые, комковатые", icon: "●●", tone: "purple" },
      { id: "discharge_gray", label: "Серые", icon: "●", tone: "purple" },
    ],
  },
  {
    title: "Пищеварение и стул",
    items: [
      { id: "nausea", label: "Тошнота", icon: "🤢", tone: "pink" },
      { id: "bloating", label: "Вздутие живота", icon: "🎈", tone: "pink" },
      { id: "constipation", label: "Запор", icon: "🔒", tone: "pink" },
      { id: "diarrhea", label: "Диарея", icon: "🧻", tone: "pink" },
    ],
  },
  {
    title: "Секс и сексуальное желание",
    items: [
      { id: "sex_none", label: "Секса не было", icon: "♡", tone: "pink" },
      { id: "sex_protected", label: "Секс с защитой", icon: "🔒", tone: "pink" },
      { id: "sex_unprotected", label: "Секс без защиты", icon: "🔓", tone: "pink" },
      { id: "sex_oral", label: "Оральный секс", icon: "👄", tone: "pink" },
      { id: "sex_anal", label: "Анальный секс", icon: "💧", tone: "pink" },
      { id: "sex_masturbation", label: "Мастурбация", icon: "♡", tone: "pink" },
      { id: "sex_touch", label: "Интимные прикосновения", icon: "💕", tone: "pink" },
      { id: "sex_toys", label: "Секс-игрушки", icon: "〰", tone: "pink" },
      { id: "sex_orgasm", label: "Оргазм", icon: "✨", tone: "pink" },
      { id: "libido_high", label: "Сильное желание", icon: "♡", tone: "pink" },
      { id: "libido_medium", label: "Среднее желание", icon: "♡", tone: "pink" },
      { id: "libido_low", label: "Слабое желание", icon: "♡", tone: "pink" },
    ],
  },
  {
    title: "Физическая активность",
    items: [
      { id: "activity_none", label: "Тренировки не было", icon: "🏋️", tone: "green" },
      { id: "activity_yoga", label: "Йога", icon: "🧘", tone: "green" },
      { id: "activity_gym", label: "Тренажерный зал", icon: "🏋️", tone: "green" },
      { id: "activity_dance", label: "Аэробика и танцы", icon: "🎵", tone: "green" },
      { id: "activity_swim", label: "Плавание", icon: "🏊", tone: "green" },
      { id: "activity_team", label: "Командный спорт", icon: "🏀", tone: "green" },
      { id: "activity_run", label: "Бег", icon: "👟", tone: "green" },
      { id: "activity_bike", label: "Велосипед", icon: "🚴", tone: "green" },
      { id: "activity_walk", label: "Ходьба", icon: "👟", tone: "green" },
    ],
  },
  {
    title: "Тесты и лекарства",
    items: [
      { id: "pregnancy_not_done", label: "Тест не делала", icon: "∅", tone: "orange" },
      { id: "pregnancy_positive", label: "Тест положительный", icon: "⇥", tone: "orange" },
      { id: "pregnancy_negative", label: "Тест отрицательный", icon: "⇤", tone: "orange" },
      { id: "pregnancy_faint", label: "Бледная полоска", icon: "Ⅱ", tone: "orange" },
      { id: "ovulation_add", label: "Отметить тест на овуляцию", icon: "+", tone: "teal" },
      { id: "ovulation_not_done", label: "Не делала", icon: "∅", tone: "teal" },
      { id: "pill_taken", label: "Таблетка принята вовремя", icon: "⊖", tone: "blue" },
      { id: "pill_yesterday", label: "Вчерашняя таблетка", icon: "⊖", tone: "blue" },
      { id: "other_pill", label: "Добавить таблетку", icon: "+", tone: "blue" },
    ],
  },
  {
    title: "Другое",
    items: [
      { id: "travel", label: "Путешествие", icon: "📍", tone: "orange" },
      { id: "stress", label: "Стресс", icon: "⚡", tone: "orange" },
      { id: "meditation", label: "Медитация", icon: "🧘", tone: "orange" },
      { id: "journal", label: "Ведение дневника", icon: "📘", tone: "orange" },
      { id: "kegel", label: "Упражнения Кегеля", icon: "🫶", tone: "orange" },
      { id: "breathing", label: "Дыхательные упражнения", icon: "🫁", tone: "orange" },
      { id: "illness", label: "Болезнь или травма", icon: "🩹", tone: "orange" },
      { id: "alcohol", label: "Алкоголь", icon: "🍷", tone: "orange" },
      { id: "hormone_therapy", label: "Гормональная терапия", icon: "🧴", tone: "orange" },
    ],
  },
];

const optionById = new Map(symptomCategories.flatMap((category) => category.items.map((item) => [item.id, item])));

const categoryWhy: Record<string, string> = {
  "Настроение": "Зачем: Mira проверит связь настроения с фазой цикла, сном и ПМС.",
  "Симптомы": "Зачем: Mira увидит, что повторяется, и что стоит показать врачу.",
  "Вагинальные выделения": "Зачем: помогает заметить изменения и включить важные факты в отчёт врачу.",
  "Пищеварение и стул": "Зачем: Mira проверит связь вздутия, аппетита и стула с фазой цикла.",
  "Секс и сексуальное желание": "Зачем: поможет понять задержку, боль и что включить в отчёт врачу.",
  "Физическая активность": "Зачем: Mira проверит связь движения с болью, энергией и сном.",
  "Тесты и лекарства": "Зачем: помогает объяснить задержку, симптомы и подготовить факты для врача.",
  "Другое": "Зачем: контекст помогает Mira отличать случайность от повторения.",
};

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
    selfCare: {
      ...base.selfCare,
      vitamins: { ...base.selfCare.vitamins },
    },
  };

  if (selected.has("all_good")) {
    next.symptoms.mood = "good";
    next.symptoms.energy = "normal";
    next.symptoms.pain.level = 0;
    next.symptoms.pain.type = null;
    next.symptoms.pain.location = [];
  }

  const painLocations: string[] = [];
  if (selected.has("lower_pain") || selected.has("abdomen_pain")) painLocations.push("low_abdomen");
  if (selected.has("back_pain")) painLocations.push("back");
  if (selected.has("headache")) painLocations.push("head");
  if (selected.has("joint_pain")) painLocations.push("joints");
  if (painLocations.length > 0) {
    next.symptoms.pain.level = Math.max(next.symptoms.pain.level, 2) as DailyLog["symptoms"]["pain"]["level"];
    next.symptoms.pain.type = selected.has("lower_pain") ? "cramping" : "aching";
    next.symptoms.pain.location = addUnique(next.symptoms.pain.location, painLocations);
  }

  if (selected.has("fatigue") || selected.has("energy_low")) next.symptoms.energy = "low";
  if (selected.has("energy_high")) next.symptoms.energy = "high";
  if (selected.has("insomnia")) next.symptoms.sleep.quality = "poor";
  if (selected.has("acne")) {
    next.symptoms.skin.acne = true;
    next.symptoms.skin.acneCount = next.symptoms.skin.acneCount ?? 1;
  }
  if (selected.has("vaginal_dryness")) next.symptoms.skin.dryness = true;

  if (selected.has("mood_joy")) next.symptoms.mood = "great";
  if (selected.has("mood_calm") || selected.has("mood_playful")) next.symptoms.mood = "good";
  if (selected.has("mood_anxious") || selected.has("mood_obsessive")) next.symptoms.mood = "anxious";
  if (selected.has("mood_irritable")) next.symptoms.mood = "irritable";
  if (selected.has("mood_sad") || selected.has("mood_depressed") || selected.has("mood_guilt") || selected.has("mood_apathy")) next.symptoms.mood = "low";

  if (selected.has("libido_high")) next.symptoms.libido = "high";
  if (selected.has("libido_medium")) next.symptoms.libido = "medium";
  if (selected.has("libido_low")) next.symptoms.libido = "low";
  if (selected.has("sex_none")) next.symptoms.libido = next.symptoms.libido ?? "none";

  if (selected.has("discharge_spotting")) next.symptoms.bleeding.amount = Math.max(next.symptoms.bleeding.amount, 1) as DailyLog["symptoms"]["bleeding"]["amount"];
  if (selected.has("discharge_watery")) next.symptoms.bleeding.color = "watery";
  if (selected.has("discharge_gray")) next.symptoms.bleeding.color = "brown";

  if (selected.has("activity_walk")) next.selfCare.walking = "normal";
  if (selected.has("activity_none")) next.selfCare.workout = "none";
  if (selected.has("activity_yoga") || selected.has("activity_walk")) next.selfCare.workout = "light";
  if (selected.has("activity_dance") || selected.has("activity_swim") || selected.has("activity_bike")) next.selfCare.workout = "medium";
  if (selected.has("activity_gym") || selected.has("activity_run") || selected.has("activity_team")) next.selfCare.workout = "heavy";

  const contextMap: Record<string, string> = {
    breast_sensitive: "breast_sensitive",
    hot_flashes: "hot_flashes",
    night_sweats: "night_sweats",
    forgetful: "forgetfulness",
    burning_mouth: "burning_mouth",
    appetite_high: "increased_appetite",
    vaginal_itch: "vaginal_itch",
    vaginal_dryness: "vaginal_dryness",
    discharge_none: "discharge_none",
    discharge_creamy: "discharge_creamy",
    discharge_sticky: "discharge_sticky",
    discharge_mucus: "discharge_mucus",
    discharge_unusual: "discharge_unusual",
    discharge_white_clumpy: "discharge_white_clumpy",
    nausea: "nausea",
    bloating: "bloating",
    constipation: "constipation",
    diarrhea: "diarrhea",
    mood_swings: "mood_swings",
    mood_confused: "confusion",
    mood_self_criticism: "self_criticism",
    sex_protected: "sex_protected",
    sex_unprotected: "sex_unprotected",
    sex_oral: "sex_oral",
    sex_anal: "sex_anal",
    sex_masturbation: "masturbation",
    sex_touch: "intimate_touch",
    sex_toys: "sex_toys",
    sex_orgasm: "orgasm",
    pregnancy_not_done: "pregnancy_test_not_done",
    pregnancy_positive: "pregnancy_test_positive",
    pregnancy_negative: "pregnancy_test_negative",
    pregnancy_faint: "pregnancy_test_faint",
    ovulation_add: "ovulation_test_added",
    ovulation_not_done: "ovulation_test_not_done",
    pill_taken: "pill_taken_on_time",
    pill_yesterday: "missed_pill_yesterday",
    other_pill: "other_pill",
    travel: "flight",
    stress: "stress",
    meditation: "meditation",
    journal: "journal",
    kegel: "kegel",
    breathing: "breathing",
    illness: "illness",
    alcohol: "alcohol",
    hormone_therapy: "hormone_therapy",
  };

  next.symptoms.context = addUnique(
    next.symptoms.context,
    selectedIds.map((id) => contextMap[id]).filter(Boolean)
  );

  if (labels.length > 0) {
    const line = `Отмечено: ${labels.join(", ")}`;
    next.symptoms.note = next.symptoms.note ? `${next.symptoms.note}\n${line}` : line;
  }

  return next;
}

function SymptomChip({ item, selected, onToggle }: { item: SymptomOption; selected: boolean; onToggle: () => void }) {
  const tone = toneClass[item.tone];
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex min-h-[54px] items-center gap-3 rounded-full py-2 pl-2 pr-5 text-left text-lg font-bold transition active:scale-[0.98] ${
        selected ? tone.selected : tone.chip
      }`}
      aria-pressed={selected}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl ${selected ? "bg-white/20" : tone.icon}`}>
        {selected ? <Check className="h-5 w-5" /> : item.icon}
      </span>
      <span>{item.label}</span>
    </button>
  );
}

function SymptomsModalComponent({ open, onClose, initialCategoryTitle }: SymptomsModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const logs = useMiraStore((state) => state.logs.dailyLogs);
  const cycleDay = useMiraStore((state) => state.cycle.currentDay);
  const setDailyLog = useMiraStore((state) => state.setDailyLog);

  const visibleCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const orderedCategories = initialCategoryTitle
      ? [
          ...symptomCategories.filter((category) => category.title === initialCategoryTitle),
          ...symptomCategories.filter((category) => category.title !== initialCategoryTitle),
        ]
      : symptomCategories;
    if (!normalizedQuery) return orderedCategories;
    return orderedCategories
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => item.label.toLowerCase().includes(normalizedQuery)),
      }))
      .filter((category) => category.items.length > 0);
  }, [initialCategoryTitle, query]);

  if (!open) return null;

  function toggle(id: string) {
    setSaved(false);
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function save() {
    const date = todayIso();
    const existingLog = logs.find((log) => log.date === date);
    const updatedLog = buildUpdatedLog(existingLog ?? createEmptyLog(date, cycleDay), selectedIds);
    setDailyLog(updatedLog);
    setSaved(true);
    window.setTimeout(() => {
      setSelectedIds([]);
      setQuery("");
      setSaved(false);
      onClose();
    }, 900);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/35 p-0 backdrop-blur-[2px]">
      <div className="relative flex h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[34px] bg-[#F3F3F3] shadow-[0_-24px_70px_rgba(0,0,0,0.24)]">
        <div className="absolute left-1/2 top-3 h-1.5 w-16 -translate-x-1/2 rounded-full bg-[#BDBDBD]" />
        <header className="shrink-0 px-6 pb-4 pt-10">
          <div className="flex items-center justify-between">
            <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#1A1A1A]" onClick={onClose}>
              <ChevronLeft className="h-7 w-7" />
            </button>
            <div className="text-center">
              <h2 className="text-3xl font-black text-[#1A1A1A]">Сегодня</h2>
              <p className="mt-0.5 text-sm font-bold text-[#8E8E93]">{cycleDay}-й день цикла</p>
            </div>
            <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#A8A8A8]" onClick={onClose}>
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-6 flex h-14 items-center gap-3 rounded-full bg-[#E7E7E7] px-5 text-[#8E8E93]">
            <Search className="h-6 w-6 shrink-0" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Искать или задать вопрос"
              className="h-full min-w-0 flex-1 bg-transparent text-lg font-semibold text-[#1A1A1A] outline-none placeholder:text-[#A8A8A8]"
            />
          </div>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 pb-32">
          {visibleCategories.map((category) => (
            <section key={category.title} className="rounded-[30px] bg-white px-5 py-6 shadow-[0_12px_34px_rgba(39,34,52,0.04)]">
              <h3 className="text-2xl font-black text-[#1A1A1A]">{category.title}</h3>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-[#8E8E93]">{categoryWhy[category.title]}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {category.items.map((item) => (
                  <SymptomChip key={item.id} item={item} selected={selectedIds.includes(item.id)} onToggle={() => toggle(item.id)} />
                ))}
              </div>
            </section>
          ))}

          {visibleCategories.length === 0 && (
            <section className="rounded-[30px] bg-white px-5 py-8 text-center">
              <p className="text-lg font-black text-[#1A1A1A]">Ничего не нашла</p>
              <p className="mt-2 text-sm font-semibold text-[#8E8E93]">Попробуй другое слово или выбери из списка ниже.</p>
            </section>
          )}
        </div>

        <footer className="absolute inset-x-0 bottom-0 border-t border-black/5 bg-white/92 px-5 py-4 backdrop-blur-xl">
          {saved ? (
            <div className="rounded-full bg-[#EDFAF1] px-5 py-4 text-center text-sm font-black text-[#1D8A49]">
              Записала. Эти данные попадут в дневник и аналитику.
            </div>
          ) : (
            <div className="grid grid-cols-[1fr_auto] items-center gap-3">
              <div>
                <p className="text-sm font-black text-[#1A1A1A]">{selectedIds.length ? `Выбрано: ${selectedIds.length}` : "Выбери симптомы"}</p>
                <p className="mt-0.5 text-xs font-bold text-[#8E8E93]">Mira сохранит отметки и использует их в аналитике.</p>
              </div>
              <Button
                type="button"
                disabled={selectedIds.length === 0}
                className="h-13 rounded-full bg-[#7C5FA8] px-6 font-black text-white hover:bg-[#694E91] disabled:bg-[#E8E8E8] disabled:text-[#9D9D9D]"
                onClick={save}
              >
                Сохранить
                <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}

export const SymptomsModal = memo(SymptomsModalComponent);
SymptomsModal.displayName = "SymptomsModal";

export default SymptomsModal;
