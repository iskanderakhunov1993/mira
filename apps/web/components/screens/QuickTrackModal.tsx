"use client";

import { useMemo, useState } from "react";
import { Moon, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMiraStore } from "@/store";
import type { DailyLog } from "@/store/types";

type MoodValue = "good" | "neutral" | "low" | "anxious" | "irritable";
type EnergyValue = "high" | "normal" | "low" | "exhausted";
type SleepValue = "good" | "normal" | "poor";

type QuickTrackModalProps = {
  open: boolean;
  onClose: () => void;
};

const moodOptions: Array<{ value: MoodValue; label: string }> = [
  { value: "good", label: "Спокойно" },
  { value: "neutral", label: "Нормально" },
  { value: "low", label: "Грустно" },
  { value: "anxious", label: "Тревожно" },
  { value: "irritable", label: "Раздражение" },
];

const energyOptions: Array<{ value: EnergyValue; label: string }> = [
  { value: "high", label: "Много сил" },
  { value: "normal", label: "Обычно" },
  { value: "low", label: "Мало сил" },
  { value: "exhausted", label: "Нет сил" },
];

const sleepOptions: Array<{ value: SleepValue; label: string }> = [
  { value: "good", label: "Хороший" },
  { value: "normal", label: "Обычный" },
  { value: "poor", label: "Плохой" },
];

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function ChoiceButton<T extends string>({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`rounded-2xl border px-3 py-2 text-sm font-black transition ${
        active
          ? "border-[#35AEEF] bg-[#E8F7FF] text-[#229DDA] shadow-[inset_2px_2px_8px_rgba(53,174,239,0.10)]"
          : "border-white/80 bg-white/82 text-[#5E6A7D] hover:bg-white"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function buildDailyLog(params: {
  date: string;
  cycleDay: number;
  period: boolean;
  painLevel: number;
  mood: MoodValue | null;
  energy: EnergyValue | null;
  sleep: SleepValue | null;
  note: string;
}): DailyLog {
  return {
    date: params.date,
    cycleDay: params.cycleDay,
    symptoms: {
      bleeding: {
        amount: params.period ? 2 : 0,
        pads: params.period ? 3 : 0,
        color: null,
        clots: "none",
      },
      pain: {
        level: params.painLevel as DailyLog["symptoms"]["pain"]["level"],
        type: params.painLevel > 0 ? "aching" : null,
        location: params.painLevel > 0 ? ["low_abdomen"] : [],
        radiation: [],
        affectedLife: params.painLevel >= 4 ? "moderately" : "none",
        tookPainkiller: false,
        painkillerHelped: null,
      },
      mood: params.mood,
      energy: params.energy,
      sleep: {
        quality: params.sleep,
        hours: null,
        wokeUp: null,
        wokeUpReason: null,
      },
      skin: {
        acne: false,
        acneCount: null,
        dryness: false,
        oiliness: false,
        hairLoss: false,
      },
      libido: null,
      context: [],
      note: params.note,
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
      vitamins: {
        magnesium: false,
        omega3: false,
        zinc: false,
      },
    },
  };
}

export function QuickTrackModal({ open, onClose }: QuickTrackModalProps) {
  const cycleDay = useMiraStore((state) => state.cycle.currentDay);
  const setDailyLog = useMiraStore((state) => state.setDailyLog);
  const [period, setPeriod] = useState(false);
  const [painLevel, setPainLevel] = useState(0);
  const [mood, setMood] = useState<MoodValue | null>(null);
  const [energy, setEnergy] = useState<EnergyValue | null>(null);
  const [sleep, setSleep] = useState<SleepValue | null>(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const selectedCount = useMemo(() => {
    return [period, painLevel > 0, mood, energy, sleep, note.trim()].filter(Boolean).length;
  }, [energy, mood, note, painLevel, period, sleep]);

  if (!open) return null;

  function save() {
    const log = buildDailyLog({
      date: getTodayKey(),
      cycleDay,
      period,
      painLevel,
      mood,
      energy,
      sleep,
      note,
    });
    setDailyLog(log);
    setSaved(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#111]/45 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-lg rounded-[34px] border border-white/70 bg-[#F7FAFF] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.24)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#35AEEF]">Быстрая отметка</p>
            <h2 className="mt-1 text-2xl font-black text-[#1A1A1A]">Что отслеживаем сегодня?</h2>
            <p className="mt-1 text-sm font-semibold text-[#8E8E93]">
              Достаточно 2–3 пункта. Mira сохранит это для аналитики и отчёта врачу.
            </p>
          </div>
          <button type="button" className="rounded-2xl bg-white/80 p-2 text-[#5E6A7D]" onClick={onClose} aria-label="Закрыть">
            <X className="h-5 w-5" />
          </button>
        </div>

        {saved ? (
          <div className="rounded-[28px] bg-white/82 p-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F7FF] text-[#229DDA]">
              <Plus className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-xl font-black text-[#1A1A1A]">Записала</h3>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-[#8E8E93]">
              Это попадёт в аналитику и отчёт врачу. Когда отметок станет больше, Mira покажет первые повторения.
            </p>
            <Button type="button" className="mt-5 w-full" onClick={onClose}>
              Готово
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <section>
              <p className="mb-3 text-sm font-black text-[#1A1A1A]">Месячные</p>
              <ChoiceButton active={period} onClick={() => setPeriod((current) => !current)}>
                {period ? "Идут месячные" : "Отметить месячные"}
              </ChoiceButton>
            </section>

            <section>
              <p className="mb-3 text-sm font-black text-[#1A1A1A]">Боль</p>
              <div className="grid grid-cols-6 gap-2">
                {[0, 1, 2, 3, 4, 5].map((level) => (
                  <ChoiceButton key={level} active={painLevel === level} onClick={() => setPainLevel(level)}>
                    {level}
                  </ChoiceButton>
                ))}
              </div>
            </section>

            <section>
              <p className="mb-3 text-sm font-black text-[#1A1A1A]">Настроение</p>
              <div className="flex flex-wrap gap-2">
                {moodOptions.map((option) => (
                  <ChoiceButton key={option.value} active={mood === option.value} onClick={() => setMood(option.value)}>
                    {option.label}
                  </ChoiceButton>
                ))}
              </div>
            </section>

            <section>
              <p className="mb-3 text-sm font-black text-[#1A1A1A]">Энергия</p>
              <div className="flex flex-wrap gap-2">
                {energyOptions.map((option) => (
                  <ChoiceButton key={option.value} active={energy === option.value} onClick={() => setEnergy(option.value)}>
                    {option.label}
                  </ChoiceButton>
                ))}
              </div>
            </section>

            <section>
              <p className="mb-3 flex items-center gap-2 text-sm font-black text-[#1A1A1A]">
                <Moon className="h-4 w-4 text-[#35AEEF]" />
                Сон
              </p>
              <div className="flex flex-wrap gap-2">
                {sleepOptions.map((option) => (
                  <ChoiceButton key={option.value} active={sleep === option.value} onClick={() => setSleep(option.value)}>
                    {option.label}
                  </ChoiceButton>
                ))}
              </div>
            </section>

            <section>
              <p className="mb-3 text-sm font-black text-[#1A1A1A]">Заметка</p>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                placeholder="Например: мало спала, стресс, тянет на сладкое..."
                className="w-full resize-none rounded-[24px] border border-white/80 bg-white/82 px-4 py-3 text-sm font-semibold text-[#1A1A1A] outline-none focus:border-[#35AEEF]"
              />
            </section>

            <div className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-bold text-[#8E8E93]">
              Выбрано: {selectedCount}. После сохранения запись появится в аналитике и отчёте врачу.
            </div>

            <Button type="button" className="h-14 w-full text-base" onClick={save}>
              Сохранить отметку
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuickTrackModal;
