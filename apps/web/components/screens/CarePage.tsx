"use client";

import React, { memo, useMemo, useState } from "react";
import {
  Activity,
  Apple,
  Check,
  ChevronRight,
  Droplets,
  Footprints,
  Minus,
  Plus,
  Scale,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMiraStore, type DailyLog } from "@/store";

type WalkingValue = "почти нет" | "немного" | "нормально" | "много";
type WorkoutValue = "нет" | "лёгкая" | "средняя" | "тяжёлая";
type FoodContext = "обычно" | "мало еды" | "сладкое" | "тяжёлая еда";
type SkinContext = "акне" | "сухость" | "жирность" | "волосы" | "отеки";

type CareData = {
  date: string;
  cycleDay: number;
  calories: {
    current: number;
    target: number;
  };
  nutrients: {
    protein: number;
    fats: number;
    carbs: number;
  };
  water: {
    current: number;
    target: number;
  };
  activity: {
    walking: WalkingValue;
    workout: WorkoutValue;
  };
  weight?: number;
};

type CarePageProps = {
  data?: CareData;
  onSaveAll?: (data: CareData) => void;
};

const mockCareData: CareData = {
  date: "30 июня",
  cycleDay: 15,
  calories: { current: 0, target: 2150 },
  nutrients: { protein: 0, fats: 0, carbs: 0 },
  water: { current: 1.5, target: 2.0 },
  activity: { walking: "немного", workout: "лёгкая" },
  weight: 65.9,
};

const walkingValues: WalkingValue[] = ["почти нет", "немного", "нормально", "много"];
const workoutValues: WorkoutValue[] = ["нет", "лёгкая", "средняя", "тяжёлая"];
const foodValues: FoodContext[] = ["обычно", "мало еды", "сладкое", "тяжёлая еда"];
const skinValues: SkinContext[] = ["акне", "сухость", "жирность", "волосы", "отеки"];
const darkCardClass = "border-[#2E2826] bg-[#1D1816] shadow-[0_18px_48px_rgba(0,0,0,0.28)]";
const darkInsetClass = "border-[#342D2A] bg-[#2A2523]";
const limeButtonClass = "bg-[#84E600] text-[#11100F] shadow-[0_12px_30px_rgba(132,230,0,0.20)] hover:bg-[#73CC00]";

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

function mapWalking(value: WalkingValue): DailyLog["selfCare"]["walking"] {
  const map: Record<WalkingValue, DailyLog["selfCare"]["walking"]> = {
    "почти нет": "none",
    немного: "little",
    нормально: "normal",
    много: "much",
  };
  return map[value];
}

function mapWorkout(value: WorkoutValue): DailyLog["selfCare"]["workout"] {
  const map: Record<WorkoutValue, DailyLog["selfCare"]["workout"]> = {
    нет: "none",
    лёгкая: "light",
    средняя: "medium",
    тяжёлая: "heavy",
  };
  return map[value];
}

function ToggleChip<T extends string>({
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
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 py-2 text-sm font-black transition active:scale-[0.98] ${
        active
          ? "border-[#84E600]/35 bg-[#252318] text-[#84E600]"
          : "border-[#342D2A] bg-[#251F1D] text-[#B7AAA4] hover:bg-[#2A2523]"
      }`}
    >
      {children}
    </button>
  );
}

function SegmentedChoice<T extends string>({
  value,
  values,
  onChange,
}: {
  value: T;
  values: T[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-4">
      {values.map((item) => (
        <ToggleChip key={item} active={value === item} onClick={() => onChange(item)}>
          {item}
        </ToggleChip>
      ))}
    </div>
  );
}

function ProgressBar({ value, max = 100, tone = "lime" }: { value: number; max?: number; tone?: "lime" | "pink" | "muted" }) {
  const width = Math.min(100, Math.max(0, (value / max) * 100));
  const color = {
    lime: "bg-[#84E600]",
    pink: "bg-[#F9359E]",
    muted: "bg-[#6A5D57]",
  }[tone];

  return (
    <div className="h-2 overflow-hidden rounded-full bg-[#342D2A]">
      <div className={`h-full rounded-full ${color} transition-all duration-300`} style={{ width: `${width}%` }} />
    </div>
  );
}

function MiniStatCard({
  label,
  value,
  detail,
  tone = "lime",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "lime" | "pink" | "muted";
}) {
  const dot = {
    lime: "bg-[#84E600]",
    pink: "bg-[#F9359E]",
    muted: "bg-[#6A5D57]",
  }[tone];

  return (
    <div className={`rounded-[18px] border p-4 ${darkInsetClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8D817B]">{label}</p>
          <p className="mt-2 text-2xl font-black leading-none text-[#F5F0ED]">{value}</p>
        </div>
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${dot}`} />
      </div>
      <p className="mt-3 text-xs font-semibold leading-relaxed text-[#B7AAA4]">{detail}</p>
    </div>
  );
}

function SettingRow({
  icon: Icon,
  title,
  value,
  children,
}: {
  icon: typeof Droplets;
  title: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-[18px] border p-4 ${darkInsetClass}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#302927] text-[#F9359E]">
            <Icon className="h-4 w-4" />
          </span>
          <p className="truncate text-sm font-black text-[#F5F0ED]">{title}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[#1D1816] px-3 py-1 text-xs font-black text-[#84E600]">{value}</span>
      </div>
      {children}
    </div>
  );
}

function CareFactorCard({
  icon: Icon,
  title,
  body,
  children,
}: {
  icon: typeof Droplets;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={`rounded-[20px] p-5 ${darkCardClass}`}>
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#302927] text-[#F9359E]">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-black leading-tight text-[#F5F0ED]">{title}</h2>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-[#B7AAA4]">{body}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

function ContextPreview({
  water,
  walking,
  workout,
  food,
  skin,
}: {
  water: number;
  walking: WalkingValue;
  workout: WorkoutValue;
  food: FoodContext;
  skin: SkinContext[];
}) {
  const items = [
    { label: "Вода", value: `${water.toFixed(1)} л`, detail: "гидратация", tone: "lime" as const },
    { label: "Движение", value: walking, detail: "ходьба", tone: "muted" as const },
    { label: "Тренировка", value: workout, detail: "нагрузка", tone: "muted" as const },
    { label: "Еда", value: food, detail: "аппетит", tone: "pink" as const },
    { label: "Кожа/тело", value: skin.length ? `${skin.length}` : "0", detail: skin.length ? "отметки" : "без отметок", tone: "pink" as const },
  ];

  return (
    <Card className={`rounded-[22px] p-5 ${darkCardClass}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8D817B]">Сегодняшний контекст</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-[#F5F0ED]">Панель заботы</h2>
        </div>
        <span className="rounded-full bg-[#84E600] px-3 py-1.5 text-xs font-black text-[#11100F]">live</span>
      </div>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-[#B7AAA4]">
        Компактные факты для Анализа: Mira сравнит их с болью, ПМС, энергией, кожей и настроением.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-5">
        {items.map((item) => (
          <MiniStatCard key={item.label} label={item.label} value={item.value} detail={item.detail} tone={item.tone} />
        ))}
      </div>
    </Card>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-2xl bg-[#111113] px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
      {message}
    </div>
  );
}

function CarePageComponent({ data = mockCareData, onSaveAll }: CarePageProps) {
  const logs = useMiraStore((state) => state.logs.dailyLogs);
  const cycleDay = useMiraStore((state) => state.cycle.currentDay);
  const setDailyLog = useMiraStore((state) => state.setDailyLog);
  const setWaterStore = useMiraStore((state) => state.setWater);
  const setActivity = useMiraStore((state) => state.setActivity);
  const setWeightStore = useMiraStore((state) => state.setWeight);
  const [water, setWater] = useState(data.water.current);
  const [walking, setWalking] = useState<WalkingValue>(data.activity.walking);
  const [workout, setWorkout] = useState<WorkoutValue>(data.activity.workout);
  const [food, setFood] = useState<FoodContext>("обычно");
  const [skin, setSkin] = useState<SkinContext[]>([]);
  const [weight, setWeight] = useState(data.weight?.toString() ?? "");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [toast, setToast] = useState("");
  const waterProgress = Math.min(100, Math.round((water / data.water.target) * 100));
  const analysisPreviewRows: Array<[string, number, "lime" | "pink" | "muted"]> = [
    ["Вода и головная боль", water > 0 ? 64 : 12, "lime"],
    ["Сон, энергия, движение", walking !== "почти нет" ? 52 : 18, "pink"],
    ["Кожа и фаза цикла", skin.length ? 45 : 10, "muted"],
  ];

  const completedCount = useMemo(() => {
    let count = 0;
    if (water > 0) count += 1;
    if (walking !== "почти нет") count += 1;
    if (workout !== "нет") count += 1;
    if (food !== "обычно") count += 1;
    if (skin.length) count += 1;
    if (weight) count += 1;
    return count;
  }, [food, skin.length, walking, water, weight, workout]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  function toggleSkin(item: SkinContext) {
    setSkin((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]);
  }

  function saveAll() {
    const date = todayIso();
    const existingLog = logs.find((log) => log.date === date);
    const baseLog = existingLog ?? createEmptyLog(date, cycleDay);
    const numericWeight = Number.parseFloat(weight);
    const context = Array.from(new Set([
      ...baseLog.symptoms.context.filter((item) => !item.startsWith("care:")),
      `care:food:${food}`,
      walking !== "почти нет" ? `care:walking:${walking}` : null,
      workout !== "нет" ? `care:workout:${workout}` : null,
      ...skin.map((item) => `care:${item}`),
    ].filter(Boolean) as string[]));

    const updatedLog: DailyLog = {
      ...baseLog,
      symptoms: {
        ...baseLog.symptoms,
        context,
        skin: {
          ...baseLog.symptoms.skin,
          acne: skin.includes("акне"),
          acneCount: skin.includes("акне") ? Math.max(1, baseLog.symptoms.skin.acneCount ?? 1) : null,
          dryness: skin.includes("сухость"),
          oiliness: skin.includes("жирность"),
          hairLoss: skin.includes("волосы"),
        },
      },
      selfCare: {
        ...baseLog.selfCare,
        water,
        calories: data.calories.current || null,
        protein: data.nutrients.protein || null,
        fats: data.nutrients.fats || null,
        carbs: data.nutrients.carbs || null,
        walking: mapWalking(walking),
        workout: mapWorkout(workout),
        weight: Number.isFinite(numericWeight) ? numericWeight : null,
      },
    };

    setDailyLog(updatedLog);
    setWaterStore(water);
    setActivity("walking", mapWalking(walking));
    setActivity("workout", mapWorkout(workout));
    if (Number.isFinite(numericWeight)) setWeightStore(numericWeight);
    onSaveAll?.({
      ...data,
      water: { ...data.water, current: water },
      activity: { walking, workout },
      weight: Number.parseFloat(weight) || undefined,
    });
    showToast("Сохранено. Анализ сможет сравнить этот контекст с симптомами и самочувствием.");
  }

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-5 text-[#F5F0ED]">
      <style jsx global>{`
        @keyframes miraCareIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="mx-auto max-w-lg">
        <header className="mb-6 border-b border-[#2E2826] pb-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-[#404A35] bg-[#1D1816] px-2 py-1 text-xs font-black text-[#B3FF6A]">M</span>
              <span className="mira-stitch-title text-2xl font-black text-[#B3FF6A]">Mira</span>
            </div>
            <span className="rounded-full border border-[#404A35] bg-[#1D1816] px-3 py-1.5 text-xs font-black text-[#BFCAAF]">
              День {data.cycleDay}
            </span>
          </div>
        </header>

        <div className="mb-7">
          <p className="text-[13px] font-black uppercase tracking-[0.2em] text-[#B3FF6A]">{data.date}</p>
          <h1 className="mira-stitch-title mt-2 text-[30px] font-black leading-tight text-[#F5F0ED]">Лог: Контекст</h1>
          <p className="mt-2 text-[15px] font-medium leading-relaxed text-[#BFCAAF]">
            Вода, движение, еда, вес и кожа. Эти данные помогают Анализу сравнивать самочувствие без диагнозов.
          </p>
        </div>

        {detailsOpen && (
          <Card className={`mb-4 rounded-[22px] p-5 ${darkCardClass}`}>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ["Факт", "вода, ходьба, еда, кожа, вес"],
                ["Сравнение", "рядом с болью, ПМС, энергией, настроением"],
                ["Объяснение", "Mira покажет только повторения с выборкой"],
              ].map(([title, body]) => (
                <div key={title} className={`rounded-[18px] border p-4 ${darkInsetClass}`}>
                  <p className="text-sm font-black text-[#F5F0ED]">{title}</p>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-[#B7AAA4]">{body}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="space-y-4">
          <Card className={`rounded-[20px] p-5 ${darkCardClass}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[13px] font-black uppercase tracking-[0.18em] text-[#BFCAAF]">Hydration</p>
                <h2 className="mt-3 text-4xl font-black leading-none text-[#B3FF6A]">{water.toFixed(1)} л</h2>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2A2523] text-[#B3FF6A]">
                <Droplets className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-5 rounded-[18px] bg-[#2A2523] p-4">
              <input
                type="range"
                min={0}
                max={3}
                step={0.2}
                value={water}
                onChange={(event) => setWater(Number(event.target.value))}
                className="w-full accent-[#B3FF6A]"
                aria-label="Количество воды"
              />
              <div className="mt-3 flex justify-between text-xs font-black text-[#BFCAAF]">
                <span>0 л</span>
                <span>{data.water.target.toFixed(1)} л</span>
                <span>3 л</span>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                aria-label="Убавить воду"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#342D2A] bg-[#1D1816] text-[#84E600]"
                onClick={() => setWater((current) => Math.max(0, Math.round((current - 0.2) * 10) / 10))}
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className={`min-w-0 flex-1 rounded-[18px] border px-4 py-3 text-center ${darkInsetClass}`}>
                <p className="text-xs font-black text-[#8D817B]">Цель</p>
                <p className="mt-1 text-sm font-black text-[#F5F0ED]">{waterProgress}% · {Math.round(water / 0.2)} стаканов</p>
              </div>
              <button
                type="button"
                aria-label="Добавить стакан воды"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#84E600] text-[#11100F] shadow-[0_10px_24px_rgba(132,230,0,0.18)]"
                onClick={() => setWater((current) => Math.min(3, Math.round((current + 0.2) * 10) / 10))}
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </Card>

          <Card className={`rounded-[20px] p-5 ${darkCardClass}`}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-[13px] font-black uppercase tracking-[0.18em] text-[#BFCAAF]">Movement</p>
                <h2 className="mt-2 text-xl font-black text-[#F5F0ED]">Движение и нагрузка</h2>
              </div>
              <span className="rounded-full bg-[#B3FF6A] px-3 py-1.5 text-xs font-black text-[#11100F]">{completedCount}/6</span>
            </div>
            <div className="space-y-3">
              <SettingRow icon={Footprints} title="Ходьба" value={walking}>
                <SegmentedChoice value={walking} values={walkingValues} onChange={setWalking} />
              </SettingRow>
              <SettingRow icon={Activity} title="Тренировка" value={workout}>
                <SegmentedChoice value={workout} values={workoutValues} onChange={setWorkout} />
              </SettingRow>
              <SettingRow icon={Apple} title="Еда и аппетит" value={food}>
                <SegmentedChoice value={food} values={foodValues} onChange={setFood} />
              </SettingRow>
            </div>
          </Card>

          <CareFactorCard
            icon={Sparkles}
            title="Кожа, волосы и тело"
            body="Акне, сухость, жирность, волосы и отёки могут повторяться рядом с фазой цикла."
          >
            <div className="flex flex-wrap gap-2">
              {skinValues.map((item) => (
                <ToggleChip key={item} active={skin.includes(item)} onClick={() => toggleSkin(item)}>
                  {skin.includes(item) && <Check className="mr-1 h-3.5 w-3.5" />}
                  {item}
                </ToggleChip>
              ))}
            </div>
          </CareFactorCard>
        </div>

        <div className="mt-4 space-y-4">
          <Card className={`rounded-[20px] p-5 ${darkCardClass}`}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8D817B]">Weight</p>
                <h2 className="mt-2 text-xl font-black text-[#F5F0ED]">Вес</h2>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#302927] text-[#F9359E]">
                <Scale className="h-5 w-5" />
              </span>
            </div>
            <div className={`flex items-end gap-2 rounded-[18px] border p-4 ${darkInsetClass}`}>
              <input
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                inputMode="decimal"
                placeholder="не указан"
                className="min-w-0 flex-1 bg-transparent text-3xl font-black tracking-tight text-[#F5F0ED] outline-none placeholder:text-[#6A5D57]"
              />
              <span className="pb-1 text-base font-black text-[#8D817B]">кг</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <MiniStatCard label="Статус" value={weight ? "есть" : "нет"} detail="необязательно" tone={weight ? "lime" : "muted"} />
              <MiniStatCard label="Контекст" value="отеки" detail="для сравнения" tone="pink" />
            </div>
          </Card>

          <button
            type="button"
            onClick={() => setDetailsOpen((open) => !open)}
            className="flex min-h-12 w-full items-center justify-between rounded-[18px] border border-[#2E2826] bg-[#1D1816] px-4 py-3 text-left text-sm font-black text-[#F5F0ED] active:scale-[0.99]"
          >
            Что попадёт в Анализ
            <ChevronRight className={`h-4 w-4 transition ${detailsOpen ? "rotate-90" : ""}`} />
          </button>
        </div>

        <Button type="button" className={`mt-5 h-16 w-full rounded-[18px] text-lg ${limeButtonClass}`} onClick={saveAll}>
          <Check className="h-5 w-5" />
          Save Daily Log
        </Button>
      </div>

      {toast && <Toast message={toast} />}
    </main>
  );
}

export const CarePage = memo(CarePageComponent);
CarePage.displayName = "CarePage";

export default CarePage;
