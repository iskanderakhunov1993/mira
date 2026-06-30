"use client";

import React, { memo, useMemo, useState } from "react";
import { Check, Droplets, Save } from "lucide-react";
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

function ProgressBar({ value, max = 100, color = "#E872A0" }: { value: number; max?: number; color?: string }) {
  const width = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className="h-3 overflow-hidden rounded-full bg-[#FFE4EC]">
      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${width}%`, backgroundColor: color }} />
    </div>
  );
}

function SectionCard({ title, children, delay = 0 }: { title?: string; children: React.ReactNode; delay?: number }) {
  return (
    <Card
      className="rounded-2xl border-0 bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(0,0,0,0.07)]"
      style={{ animation: `miraCareIn 420ms ease ${delay}ms both` }}
    >
      {title && <h2 className="mb-5 text-lg font-black text-[#1A1A1A]">{title}</h2>}
      {children}
    </Card>
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
    <main className="min-h-screen bg-[#FAF8F5] px-5 py-6 text-[#1A1A1A]">
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
              Достаточно заполнить 2 из 8 пунктов. Отметь только то, что легко вспомнить.
            </p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 text-right text-sm font-black text-[#1A1A1A] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            📅 {data.date}<br />
            <span className="text-[#8E8E93]">День {data.cycleDay}</span>
          </div>
        </header>

        {completedCount === 0 && (
          <div className="mt-6 rounded-2xl bg-white p-5 text-sm font-bold text-[#1A1A1A] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            Сегодня ещё ничего не отмечено. Начни с воды!
          </div>
        )}

        <div className="mt-6 space-y-6">
          {/* Цели */}
          <SectionCard title="🎯 Твои цели на сегодня" delay={30}>
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-[#1A1A1A]">Калории: {data.calories.target.toLocaleString("ru-RU")} ккал</p>
                  <p className="text-xs font-bold text-[#8E8E93]">
                    {data.calories.current.toLocaleString("ru-RU")} / {data.calories.target.toLocaleString("ru-RU")} ккал
                  </p>
                </div>
                <ProgressBar value={data.calories.current} max={data.calories.target} />
              </div>

              <div>
                <p className="mb-3 text-sm font-black text-[#1A1A1A]">🍽️ Баланс нутриентов</p>
                {[
                  ["Белки", data.nutrients.protein],
                  ["Жиры", data.nutrients.fats],
                  ["Углеводы", data.nutrients.carbs],
                ].map(([label, value]) => (
                  <div key={label as string} className="mb-3">
                    <div className="mb-1 flex justify-between text-sm font-bold">
                      <span>{label}</span>
                      <span className="text-[#8E8E93]">{value}%</span>
                    </div>
                    <ProgressBar value={value as number} />
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* Витамины */}
          <SectionCard title="💊 Витамины и добавки" delay={80}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.vitamins.map((vitamin, index) => {
                const status = vitaminStatus[vitamin.id];
                const marker = index === 0 ? "🔴" : index === 1 ? "🟡" : "🟣";
                return (
                  <div key={vitamin.id} className="rounded-2xl bg-[#FAF8F5] p-4">
                    <p className="text-sm font-black text-[#1A1A1A]">{marker} {vitamin.name} ({vitamin.dose})</p>
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
                    {status === "buy" && <p className="mt-3 text-xs font-bold text-[#8E8E93]">Добавь в список покупок на сегодня.</p>}
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-sm font-semibold text-[#8E8E93]">
              📖 Статья: “Цинк и ПМС: как он помогает при акне” → <button className="font-black text-[#E872A0]" type="button">Читать</button>
            </p>
          </SectionCard>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Вода */}
            <SectionCard title="💧 Вода" delay={130}>
              <p className="text-2xl font-black text-[#1A1A1A]">{water.toFixed(1)} л <span className="text-base text-[#8E8E93]">из {data.water.target.toFixed(1)} л</span></p>
              <div className="mt-4">
                <ProgressBar value={water} max={3} />
                <p className="mt-2 text-xs font-bold text-[#8E8E93]">{water.toFixed(1)} / {data.water.target.toFixed(1)} л</p>
              </div>
              <Button
                type="button"
                className="mt-5 w-full rounded-2xl bg-[#E872A0] text-white hover:bg-[#D95F8E]"
                onClick={() => setWater((current) => Math.min(3, Math.round((current + 0.2) * 10) / 10))}
              >
                <Droplets className="h-4 w-4" />
                Добавить стакан
              </Button>
            </SectionCard>

            {/* Активность */}
            <SectionCard title="🚶 Активность" delay={180}>
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

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Кожа и волосы */}
            <SectionCard title="🧴 Кожа и волосы" delay={230}>
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
            <SectionCard title="❤️ Желание (опционально)" delay={280}>
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
              <Button
                type="button"
                className="h-12 rounded-2xl bg-[#E872A0] text-white hover:bg-[#D95F8E]"
                onClick={() => showToast("Вес сохранён!")}
              >
                <Save className="h-4 w-4" />
                Сохранить
              </Button>
            </div>
            {!weight && <p className="mt-3 text-sm font-semibold text-[#8E8E93]">Введите вес, чтобы увидеть динамику.</p>}
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
