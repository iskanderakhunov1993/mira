"use client";

import React, { memo, useMemo, useState } from "react";
import { Check, Droplets, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type VitaminStatus = "has" | "buy";
type WalkingValue = "почти нет" | "немного" | "нормально" | "много";
type WorkoutValue = "нет" | "лёгкая" | "средняя" | "тяжёлая";
type LibidoValue = "нет желания" | "слабое" | "среднее" | "сильное";

type Vitamin = {
  id: string;
  name: string;
  dose: string;
  description: string;
  time: string;
  has: boolean;
};

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
  vitamins: Vitamin[];
  water: {
    current: number;
    target: number;
  };
  activity: {
    walking: WalkingValue;
    workout: WorkoutValue;
  };
  skin: {
    acne: boolean;
    acneCount: number;
    dryness: boolean;
    oiliness: boolean;
    hairLoss: boolean;
    allGood: boolean;
  };
  libido: LibidoValue;
  weight?: number;
};

type CarePageProps = {
  data?: CareData;
  onSaveAll?: (data: CareData) => void;
};

const mockCareData: CareData = {
  date: "30 июня",
  cycleDay: 15,
  calories: {
    current: 1200,
    target: 2150,
  },
  nutrients: {
    protein: 30,
    fats: 30,
    carbs: 40,
  },
  vitamins: [
    {
      id: "magnesium",
      name: "Магний + В6",
      dose: "300 мг + 25 мг",
      description: "Снижает спазмы и раздражительность",
      time: "Вечером, с водой",
      has: true,
    },
    {
      id: "omega3",
      name: "Омега-3",
      dose: "1000 мг",
      description: "Снижает воспаление и боль",
      time: "Утром, с едой",
      has: false,
    },
    {
      id: "zinc",
      name: "Цинк",
      dose: "15 мг",
      description: "Помогает при акне и воспалениях",
      time: "Утром, с едой",
      has: false,
    },
  ],
  water: {
    current: 1.5,
    target: 2.0,
  },
  activity: {
    walking: "немного",
    workout: "лёгкая",
  },
  skin: {
    acne: true,
    acneCount: 2,
    dryness: false,
    oiliness: false,
    hairLoss: false,
    allGood: false,
  },
  libido: "среднее",
  weight: 65.9,
};

function SectionCard({ title, children, delay = 0 }: { title?: string; children: React.ReactNode; delay?: number }) {
  return (
    <Card
      className="mira-card rounded-[30px] border-0 p-5 transition hover:-translate-y-0.5 hover:shadow-[0_26px_70px_rgba(76,66,126,0.14)] sm:p-6"
      style={{ animation: `miraCareIn 420ms ease ${delay}ms both` }}
    >
      {title && <h2 className="mb-5 text-lg font-black text-[#1A1A1A]">{title}</h2>}
      {children}
    </Card>
  );
}

function Eyebrow({ children, tone = "light" }: { children: React.ReactNode; tone?: "light" | "dark" }) {
  return (
    <p
      className={`text-[11px] font-black uppercase tracking-[0.18em] ${
        tone === "light" ? "text-white/75" : "text-[#8E8E93]"
      }`}
    >
      {children}
    </p>
  );
}

/** Кольцевая диаграмма КБЖУ (Carb / Protein / Fat) */
function MacroDonut({ protein, fats, carbs }: { protein: number; fats: number; carbs: number }) {
  const size = 168;
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = protein + fats + carbs || 1;

  const segments = [
    { label: "Углеводы", value: carbs, color: "#E872A0" },
    { label: "Белки", value: protein, color: "#FFB199" },
    { label: "Жиры", value: fats, color: "#FFD9E6" },
  ];

  let offsetAcc = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-8">
      <div className="relative h-[168px] w-[168px] shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#FAF1F5" strokeWidth={stroke} />
          {segments.map((segment) => {
            const fraction = segment.value / total;
            const dash = fraction * circumference;
            const dashArray = `${dash} ${circumference - dash}`;
            const dashOffset = -offsetAcc * circumference;
            offsetAcc += fraction;
            return (
              <circle
                key={segment.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={stroke}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-[#1A1A1A]">{carbs}%</span>
          <span className="text-[11px] font-bold uppercase tracking-wide text-[#8E8E93]">углеводы</span>
        </div>
      </div>
      <div className="flex w-full flex-col gap-3">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center justify-between gap-3 rounded-2xl bg-[#FAF8F5] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
              <span className="text-sm font-bold text-[#1A1A1A]">{segment.label}</span>
            </div>
            <span className="text-sm font-black text-[#1A1A1A]">{segment.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const WATER_STAGES = ["Мало", "Хорошо", "Почти", "Идеально"] as const;

/** Линейный slider-прогресс для воды в духе hydration-tracker референса */
function WaterSlider({ value, max }: { value: number; max: number }) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const stageIndex = Math.min(WATER_STAGES.length - 1, Math.floor(ratio * WATER_STAGES.length));

  return (
    <div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/25">
        <div
          className="h-full rounded-full bg-white transition-all duration-300"
          style={{ width: `${ratio * 100}%` }}
        />
        <div
          className="absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-4 border-[#E872A0] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.25)] transition-all duration-300"
          style={{ left: `calc(${ratio * 100}% - 12px)` }}
        />
      </div>
      <div className="mt-3 flex justify-between text-[11px] font-bold uppercase tracking-wide text-white/70">
        {WATER_STAGES.map((stage, index) => (
          <span key={stage} className={index === stageIndex ? "text-white" : ""}>
            {stage}
          </span>
        ))}
      </div>
    </div>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-[#1A1A1A] px-4 py-3 text-sm font-bold text-white shadow-[0_16px_40px_rgba(0,0,0,0.2)]">
      {message}
    </div>
  );
}

function RadioPills<T extends string>({ value, options, onChange }: { value: T; options: T[]; onChange: (value: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            className={`rounded-2xl border px-3 py-2 text-sm font-bold transition ${
              active
                ? "border-[#E872A0] bg-[#FFF0F5] text-[#E872A0]"
                : "border-[#E8DDE3] bg-white text-[#8E8E93] hover:border-[#E872A0]/40"
            }`}
            onClick={() => onChange(option)}
          >
            {active ? "●" : "○"} {option}
          </button>
        );
      })}
    </div>
  );
}

function CheckboxRow({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-2xl bg-[#FAF8F5] px-4 py-3 text-left text-sm font-bold text-[#1A1A1A]"
      onClick={onChange}
    >
      <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${checked ? "border-[#E872A0] bg-[#E872A0] text-white" : "border-[#D8CBD2] bg-white"}`}>
        {checked && <Check className="h-3.5 w-3.5" />}
      </span>
      {label}
    </button>
  );
}

function CarePageComponent({ data = mockCareData, onSaveAll }: CarePageProps) {
  const [water, setWater] = useState(data.water.current);
  const [vitaminStatus, setVitaminStatus] = useState<Record<string, VitaminStatus>>(() =>
    Object.fromEntries(data.vitamins.map((vitamin) => [vitamin.id, vitamin.has ? "has" : "buy"]))
  );
  const [walking, setWalking] = useState<WalkingValue>(data.activity.walking);
  const [workout, setWorkout] = useState<WorkoutValue>(data.activity.workout);
  const [skin, setSkin] = useState(data.skin);
  const [libido, setLibido] = useState<LibidoValue>(data.libido);
  const [weight, setWeight] = useState(data.weight?.toString() ?? "");
  const [toast, setToast] = useState("");

  const completedCount = useMemo(() => {
    let count = 0;
    if (water > 0) count += 1;
    if (Object.keys(vitaminStatus).length > 0) count += 1;
    if (walking) count += 1;
    if (workout) count += 1;
    if (Object.values(skin).some(Boolean)) count += 1;
    if (libido) count += 1;
    if (weight) count += 1;
    if (data.calories.current > 0) count += 1;
    return count;
  }, [data.calories.current, libido, skin, vitaminStatus, walking, water, weight, workout]);
  const shoppingList = useMemo(
    () => data.vitamins.filter((vitamin) => vitaminStatus[vitamin.id] === "buy").map((vitamin) => vitamin.name),
    [data.vitamins, vitaminStatus]
  );

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  }

  function toggleSkin(key: keyof typeof skin) {
    setSkin((current) => ({ ...current, [key]: !current[key] }));
  }

  function saveAll() {
    onSaveAll?.({
      ...data,
      water: { ...data.water, current: water },
      activity: { walking, workout },
      skin,
      libido,
      weight: Number.parseFloat(weight) || undefined,
      vitamins: data.vitamins.map((vitamin) => ({ ...vitamin, has: vitaminStatus[vitamin.id] === "has" })),
    });
    showToast("Все данные сохранены!");
  }

  return (
    <main className="mira-screen px-5 py-6 text-[#202033]">
      <style jsx global>{`
        @keyframes miraCareIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="mx-auto max-w-5xl">
        {/* Хедер */}
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#1A1A1A]">💧 Забота</h1>
            <p className="mt-2 text-sm font-semibold text-[#8E8E93]">
              Отметь только то, что легко вспомнить. Даже пары быстрых отметок достаточно для первых связей в аналитике.
            </p>
          </div>
          <div className="mira-card rounded-2xl px-4 py-3 text-right text-sm font-black text-[#202033]">
            📅 {data.date}<br />
            <span className="text-[#8E8E93]">День {data.cycleDay}</span>
          </div>
        </header>

        {completedCount === 0 && (
          <div className="mira-card mt-6 rounded-[24px] p-5 text-sm font-bold text-[#202033]">
            Сегодня ещё ничего не отмечено. Начни с воды!
          </div>
        )}

        <div className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Вода */}
            <Card
              className="mira-gradient-health overflow-hidden rounded-[32px] border-0 p-6 text-white shadow-[0_22px_56px_rgba(88,216,220,0.24)] transition hover:-translate-y-0.5"
              style={{ animation: `miraCareIn 420ms ease 30ms both` }}
            >
              <div className="flex items-center justify-between">
                <Eyebrow>Hydration</Eyebrow>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                  <Droplets className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-xl font-black leading-snug">
                Сегодня выпито {water.toFixed(1)} л воды
              </p>
              <p className="mt-1 text-sm font-bold text-white/75">
                Цель — {data.water.target.toFixed(1)} л в день
              </p>

              <div className="mt-6">
                <WaterSlider value={water} max={data.water.target} />
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Убавить воду"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 transition hover:bg-white/30"
                  onClick={() => setWater((current) => Math.max(0, Math.round((current - 0.2) * 10) / 10))}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <Button
                  type="button"
                  className="h-11 flex-1 rounded-2xl bg-white text-[#6C5CE7] hover:bg-white/90"
                  onClick={() => setWater((current) => Math.min(3, Math.round((current + 0.2) * 10) / 10))}
                >
                  <Droplets className="h-4 w-4" />
                  Добавить стакан
                </Button>
                <button
                  type="button"
                  aria-label="Добавить воду"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 transition hover:bg-white/30"
                  onClick={() => setWater((current) => Math.min(3, Math.round((current + 0.2) * 10) / 10))}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </Card>

            {/* Активность */}
            <SectionCard delay={70}>
              <Eyebrow tone="dark">Быстрая отметка</Eyebrow>
              <h2 className="mt-1 mb-3 text-xl font-black text-[#1A1A1A]">Активность 🚶</h2>
              <p className="mb-5 rounded-2xl bg-[#FAF8F5] px-4 py-3 text-sm font-semibold leading-relaxed text-[#8E8E93]">
                Отметь примерно. Mira использует это, чтобы понять связь движения с болью, энергией и сном.
              </p>
              <div className="space-y-5">
                <div>
                  <p className="mb-3 text-sm font-black text-[#1A1A1A]">Ходьба</p>
                  <RadioPills value={walking} options={["почти нет", "немного", "нормально", "много"]} onChange={setWalking} />
                </div>
                <div>
                  <p className="mb-3 text-sm font-black text-[#1A1A1A]">Тренировка</p>
                  <RadioPills value={workout} options={["нет", "лёгкая", "средняя", "тяжёлая"]} onChange={setWorkout} />
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Витамины */}
          <SectionCard title="💊 Аптечка и добавки (необязательно)" delay={120}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.vitamins.map((vitamin, index) => {
                const status = vitaminStatus[vitamin.id];
                const marker = index === 0 ? "🔴" : index === 1 ? "🟡" : "🟣";
                return (
                  <div key={vitamin.id} className="rounded-2xl bg-[#FAF8F5] p-4">
                    <p className="text-sm font-black text-[#1A1A1A]">{marker} {vitamin.name}</p>
                    <p className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-[#E872A0]">
                      Доза: {vitamin.dose}
                    </p>
                    <p className="mt-2 rounded-2xl bg-[#FFF7DE] px-3 py-2 text-xs font-bold leading-relaxed text-[#8A6500]">
                      Дозировку лучше подтвердить с врачом, особенно при беременности, хронических состояниях или лекарствах.
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-[#1A1A1A]">▸ {vitamin.description}</p>
                    <p className="mt-1 text-sm leading-relaxed text-[#8E8E93]">▸ {vitamin.time}</p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className={`rounded-2xl ${status === "has" ? "bg-[#34C759] text-white hover:bg-[#2DA84A]" : "bg-white text-[#8E8E93] hover:bg-white"}`}
                        onClick={() => setVitaminStatus((current) => ({ ...current, [vitamin.id]: "has" }))}
                      >
                        ✅ Есть дома
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className={`rounded-2xl ${status === "buy" ? "bg-[#EFEFF4] text-[#1A1A1A]" : "bg-white text-[#8E8E93]"}`}
                        onClick={() => setVitaminStatus((current) => ({ ...current, [vitamin.id]: "buy" }))}
                      >
                        ❌ Нет, купить
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            {shoppingList.length > 0 && (
              <div className="mt-4 rounded-[22px] bg-[#FFF0F5] px-4 py-3">
                <p className="text-sm font-black text-[#1A1A1A]">Список покупок</p>
                <p className="mt-1 text-sm font-semibold text-[#8E8E93]">{shoppingList.join(", ")}</p>
              </div>
            )}
            <p className="mt-4 text-sm font-semibold text-[#8E8E93]">
              📖 “Цинк и ПМС” → <button className="font-black text-[#E872A0]" type="button">Читать</button>
            </p>
          </SectionCard>

          {/* Питание */}
          <SectionCard delay={170}>
            <Eyebrow tone="dark">Если есть силы заполнить подробнее</Eyebrow>
            <h2 className="mt-1 mb-5 text-xl font-black leading-snug text-[#1A1A1A]">Питание и БЖУ (необязательно)</h2>
            <div className="space-y-6">
              <div className="mira-gradient-health rounded-[28px] p-5 text-white shadow-[0_18px_44px_rgba(122,101,242,0.22)]">
                <Eyebrow>Калории</Eyebrow>
                <div className="mt-1 flex items-end justify-between gap-3">
                  <p className="text-3xl font-black">
                    {data.calories.current.toLocaleString("ru-RU")}
                    <span className="ml-1 text-base font-bold text-white/70">
                      / {data.calories.target.toLocaleString("ru-RU")} ккал
                    </span>
                  </p>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/25">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(0, (data.calories.current / data.calories.target) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-black text-[#1A1A1A]">🍽️ Баланс нутриентов</p>
                <MacroDonut protein={data.nutrients.protein} fats={data.nutrients.fats} carbs={data.nutrients.carbs} />
              </div>
            </div>
          </SectionCard>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Кожа и волосы */}
            <SectionCard title="🧴 Кожа и волосы (необязательно)" delay={230}>
              <div className="space-y-3">
                <CheckboxRow checked={skin.acne} label={`Акне / прыщи (${skin.acneCount} шт.)`} onChange={() => toggleSkin("acne")} />
                <CheckboxRow checked={skin.dryness} label="Сухость / шелушение" onChange={() => toggleSkin("dryness")} />
                <CheckboxRow checked={skin.oiliness} label="Жирность / блеск" onChange={() => toggleSkin("oiliness")} />
                <CheckboxRow checked={skin.hairLoss} label="Выпадение волос" onChange={() => toggleSkin("hairLoss")} />
                <CheckboxRow checked={skin.allGood} label="Всё как обычно" onChange={() => toggleSkin("allGood")} />
              </div>
              <p className="mt-4 rounded-2xl bg-[#FAF8F5] px-4 py-3 text-sm font-semibold text-[#8E8E93]">
                💡 Акне часто связано с лютеиновой фазой. Мы покажем график в Аналитике, когда отметок станет больше.
              </p>
            </SectionCard>

            {/* Желание */}
            <SectionCard title="❤️ Желание (необязательно)" delay={280}>
              <p className="mb-3 text-sm font-black text-[#1A1A1A]">Как сегодня?</p>
              <RadioPills value={libido} options={["нет желания", "слабое", "среднее", "сильное"]} onChange={setLibido} />
              <p className="mt-4 rounded-2xl bg-[#FAF8F5] px-4 py-3 text-sm font-semibold text-[#8E8E93]">
                📖 Желание растёт в середине цикла и падает перед месячными.
              </p>
            </SectionCard>
          </div>

          {/* Вес */}
          <SectionCard title="⚖️ Вес" delay={330}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                inputMode="decimal"
                placeholder="Введите вес"
                className="h-12 flex-1 rounded-2xl border border-[#E8DDE3] bg-white px-4 text-lg font-black text-[#1A1A1A] outline-none focus:border-[#E872A0]"
              />
              <span className="text-sm font-bold text-[#8E8E93]">кг</span>
            </div>
            {!weight && <p className="mt-3 text-sm font-semibold text-[#8E8E93]">Введите вес, чтобы увидеть динамику.</p>}
            <p className="mt-3 rounded-2xl bg-[#FAF8F5] px-4 py-3 text-sm font-semibold text-[#8E8E93]">
              Вес сохранится вместе с остальными отметками по кнопке “Сохранить всё”.
            </p>
          </SectionCard>

          {/* Сохранить всё */}
          <SectionCard delay={380}>
            <Button type="button" className="h-14 w-full rounded-2xl bg-[#E872A0] text-base font-black text-white hover:bg-[#D95F8E]" onClick={saveAll}>
              💾 Сохранить всё
            </Button>
            <p className="mt-4 text-sm font-semibold leading-relaxed text-[#8E8E93]">
              ⚠️ Перед приёмом добавок проконсультируйся с врачом.
            </p>
          </SectionCard>
        </div>
      </div>

      {toast && <Toast message={toast} />}
    </main>
  );
}

export const CarePage = memo(CarePageComponent);
CarePage.displayName = "CarePage";

export default CarePage;
