"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { saveCheckIn, dateKey, getCheckIn } from "@/lib/store";
import { recordPeriodStart } from "@/lib/cycleEngine";
import { getStreak, getGarden } from "@/lib/gamification";
import type {
  MiraLocalData, DailyCheckIn,
  PeriodIntensity, EnergyValue, SleepQuality, MoodValue, PainLevel,
} from "@/lib/types";

/*
 * Инлайн быстрая отметка прямо на главной — лог за ~30 сек без открытия модалки.
 * Пишет в тот же DailyCheckIn, что и CheckInModal. Полный лог (где болит, ПМС,
 * секс, заметка и т.д.) остаётся в модалке по кнопке «Отметить состояние».
 */

type Props = {
  data: MiraLocalData;
  persist: (data: MiraLocalData) => void;
  onMore?: () => void; // открыть полный лог (модалку)
};

// Группа чипов «один из»
function ChipRow<T extends string>({ label, options, value, onPick }: {
  label: string;
  options: { v: T | null; l: string }[];
  value: T | null;
  onPick: (v: T | null) => void;
}) {
  return (
    <div className="border-t border-mira-lavender/15 py-3 first:border-t-0 first:pt-0">
      <p className="mb-2 text-xs font-semibold text-mira-text">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = value === o.v;
          return (
            <button
              key={o.l}
              onClick={() => onPick(active ? null : o.v)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                active
                  ? "border-mira-primary bg-mira-lavender-light text-mira-primary"
                  : "border-mira-lavender/40 bg-white text-mira-muted hover:border-mira-primary/30"
              }`}
            >
              {o.l}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function QuickLogInline({ data, persist, onMore }: Props) {
  const today = dateKey();
  const existing = getCheckIn(data, today);

  const [bleeding, setBleeding] = useState<PeriodIntensity | null>(null);
  const [painLevel, setPainLevel] = useState<PainLevel | null>(null);
  const [energy, setEnergy] = useState<EnergyValue | null>(null);
  const [sleep, setSleep] = useState<SleepQuality | null>(null);
  const [mood, setMood] = useState<MoodValue | null>(null);
  const [saved, setSaved] = useState(false);

  // Подтянуть уже отмеченное за сегодня.
  useEffect(() => {
    setBleeding(existing?.period?.intensity ?? null);
    setPainLevel(existing?.pain?.level ?? null);
    setEnergy(existing?.energy?.value ?? null);
    setSleep(existing?.sleep?.quality ?? null);
    setMood(existing?.mood?.value ?? null);
  }, [existing]);

  const dirty =
    bleeding !== (existing?.period?.intensity ?? null) ||
    painLevel !== (existing?.pain?.level ?? null) ||
    energy !== (existing?.energy?.value ?? null) ||
    sleep !== (existing?.sleep?.quality ?? null) ||
    mood !== (existing?.mood?.value ?? null);

  const anything = bleeding || painLevel || energy || sleep || mood;

  function save() {
    const checkIn: DailyCheckIn = {
      date: today,
      savedAt: new Date().toISOString(),
      ...(existing ?? {}),
    };
    if (bleeding) checkIn.period = { intensity: bleeding, type: existing?.period?.type };
    if (painLevel) checkIn.pain = { kinds: existing?.pain?.kinds?.length ? existing.pain.kinds : ["cramps"], level: painLevel };
    if (energy) checkIn.energy = { value: energy };
    if (sleep) checkIn.sleep = { quality: sleep, hours: existing?.sleep?.hours };
    if (mood) checkIn.mood = { value: mood };

    let newData = saveCheckIn(data, checkIn);

    // Если отмечено кровотечение и это новый старт (вчера не было) — фиксируем цикл.
    if (bleeding && newData.profile) {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const hadYesterday = !!newData.checkIns[dateKey(y)]?.period;
      if (!hadYesterday) newData = { ...newData, profile: recordPeriodStart(newData.profile, today) };
    }

    persist(newData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  const streak = getStreak(data);
  const garden = getGarden(data);

  return (
    <Card className="p-4">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-bold text-mira-text">Что с тобой сегодня?</p>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-mira-muted">~30 сек</span>
      </div>
      <p className="mb-3 text-xs text-mira-muted">Отметь главное — остальное в полном логе</p>

      <ChipRow<PeriodIntensity>
        label="Кровотечение"
        value={bleeding}
        onPick={setBleeding}
        options={[
          { v: "light", l: "мало" },
          { v: "moderate", l: "средне" },
          { v: "heavy", l: "много" },
        ]}
      />
      <ChipRow<PainLevel>
        label="Боль"
        value={painLevel}
        onPick={setPainLevel}
        options={[
          { v: "light", l: "лёгкая" },
          { v: "medium", l: "средняя" },
          { v: "strong", l: "сильная" },
        ]}
      />
      <ChipRow<EnergyValue>
        label="Энергия"
        value={energy}
        onPick={setEnergy}
        options={[
          { v: "exhausted", l: "истощение" },
          { v: "low", l: "низкая" },
          { v: "normal", l: "норм" },
          { v: "high", l: "высокая" },
        ]}
      />
      <ChipRow<SleepQuality>
        label="Сон"
        value={sleep}
        onPick={setSleep}
        options={[
          { v: "bad", l: "плохой" },
          { v: "normal", l: "обычный" },
          { v: "good", l: "хороший" },
        ]}
      />
      <ChipRow<MoodValue>
        label="Настроение"
        value={mood}
        onPick={setMood}
        options={[
          { v: "normal", l: "спокойно" },
          { v: "joy", l: "радость" },
          { v: "sadness", l: "грусть" },
          { v: "anxiety", l: "тревога" },
          { v: "swings", l: "перепады" },
        ]}
      />

      <div className="mt-4 flex items-center gap-2">
        <Button className="flex-1" onClick={save} disabled={!anything || (!dirty && !!existing)}>
          {saved ? <><Check className="h-4 w-4" /> Сохранено</> : existing ? "Обновить отметку" : "Сохранить отметку"}
        </Button>
        <button
          onClick={onMore}
          className="rounded-2xl border border-mira-lavender/40 px-3 py-2.5 text-xs font-semibold text-mira-muted transition hover:border-mira-primary/30 active:scale-95"
        >
          Подробнее
        </button>
      </div>

      {saved && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#EAF6EE] to-[#F2EDFA] px-3 py-2"
        >
          <span className="text-lg">{garden.emoji}</span>
          <p className="text-xs font-semibold text-mira-text">
            🔥 Серия {streak.current} {streak.current === 1 ? "день" : streak.current < 5 ? "дня" : "дней"} · {garden.title}
          </p>
        </motion.div>
      )}
    </Card>
  );
}
