"use client";

import { useState } from "react";
import { Plus, Infinity, Salad } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ScreenProps } from "./types";
import type { MealType, MealSize, MealComponent, MealEntry } from "@/lib/types";
import { saveCheckIn, dateKey, getCheckIn, getCycleDay, getCyclePhase } from "@/lib/store";
import { calculateKBJU } from "@/lib/nutrition";

function Chip({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
      active ? "border-mira-primary bg-mira-lavender-light text-mira-primary" : "border-mira-lavender/40 bg-white text-mira-muted hover:border-mira-primary/30"
    }`}>{label}</button>
  );
}

function Progress({ value, color = "bg-mira-primary" }: { value: number; color?: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-mira-lavender-light">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

const mealTypeLabels: Record<MealType, string> = { breakfast: "Завтрак", lunch: "Обед", dinner: "Ужин", snack: "Перекус" };
const mealSizeLabels: Record<MealSize, string> = { small: "Маленький", medium: "Средний", large: "Большой" };
const mealCompLabels: Record<MealComponent, string> = { protein: "Белок", vegetables: "Овощи", fruits: "Фрукты", grains: "Крупы", dairy: "Молочное", sweets: "Сладкое", fastfood: "Фастфуд" };

function estimateKcal(size: MealSize, components: MealComponent[]): { min: number; max: number } {
  const base: Record<MealSize, [number, number]> = { small: [200, 350], medium: [400, 600], large: [600, 900] };
  const [min, max] = base[size];
  const hasFastfood = components.includes("fastfood");
  const hasSweets = components.includes("sweets");
  const bump = (hasFastfood ? 150 : 0) + (hasSweets ? 100 : 0);
  return { min: min + bump, max: max + bump };
}

export function NutritionScreen({ data, persist }: ScreenProps) {
  const [adding, setAdding] = useState(false);
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const [mealSize, setMealSize] = useState<MealSize>("medium");
  const [components, setComponents] = useState<MealComponent[]>([]);

  const profile = data.profile;
  const showCalories = profile?.showCalories ?? true;
  const checkIn = getCheckIn(data);
  const meals = checkIn?.meals ?? [];

  const cycleDay = getCycleDay(profile);
  const phase = getCyclePhase(cycleDay, profile?.cycleConfig.periodLength ?? 5, profile?.cycleConfig.cycleLength ?? 28);
  const kbju = calculateKBJU(profile, phase);

  const totalKcal = meals.reduce((sum, m) => sum + ((m.estimatedKcal?.min ?? 0) + (m.estimatedKcal?.max ?? 0)) / 2, 0);
  const targetKcal = (kbju.kcalMin + kbju.kcalMax) / 2;
  const pct = Math.round((totalKcal / targetKcal) * 100);

  function toggleComponent(c: MealComponent) {
    setComponents(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  }

  function addMeal() {
    const entry: MealEntry = {
      type: mealType,
      size: mealSize,
      components,
      estimatedKcal: estimateKcal(mealSize, components),
    };
    const date = dateKey();
    const existing = getCheckIn(data);
    const updated = {
      ...(existing ?? { date, savedAt: new Date().toISOString() }),
      date,
      savedAt: new Date().toISOString(),
      meals: [...(existing?.meals ?? []), entry],
    };
    persist(saveCheckIn(data, updated));
    setAdding(false);
    setComponents([]);
    setMealType("breakfast");
    setMealSize("medium");
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-mira-text">Питание</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Overview */}
        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Ориентир на день</p>
            {showCalories && <p className="mt-1 text-2xl font-bold text-mira-text">{kbju.kcalMin}–{kbju.kcalMax} ккал</p>}
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Белки", value: `${kbju.protein} г`, color: "bg-mira-primary" },
                { label: "Жиры", value: `${kbju.fat} г`, color: "bg-mira-cycle" },
                { label: "Углеводы", value: `${kbju.carbs} г`, color: "bg-[#C4B07E]" },
              ].map(n => (
                <div key={n.label}>
                  <div className={`mx-auto h-1.5 w-8 rounded-full ${n.color} mb-1 opacity-60`} />
                  <p className="text-xs text-mira-muted">{n.label}</p>
                  <p className="text-sm font-bold text-mira-text">{n.value}</p>
                </div>
              ))}
            </div>
          </Card>

          {showCalories && totalKcal > 0 && (
            <Card className="border-mira-success/15 bg-[#E0F5E8]/30 p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Отмечено примерно</p>
              <p className="mt-1 text-xl font-bold text-mira-text">{Math.round(totalKcal)} ккал</p>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-mira-muted">Прогресс</span>
                  <span className="font-semibold text-mira-success">{pct}%</span>
                </div>
                <Progress value={pct} color="bg-mira-success" />
              </div>
            </Card>
          )}

          {meals.length > 0 && (
            <Card className="p-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-mira-muted">Приёмы пищи</p>
              <div className="space-y-2">
                {meals.map((m, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-mira-bg p-3">
                    <span className="text-sm font-semibold text-mira-text">{mealTypeLabels[m.type]}</span>
                    {showCalories && m.estimatedKcal && (
                      <span className="text-xs text-mira-muted">{m.estimatedKcal.min}–{m.estimatedKcal.max} ккал</span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Button variant="secondary" className="w-full" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Добавить приём пищи
          </Button>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* AI recommendation */}
          <Card className="border-mira-primary/15 bg-gradient-to-br from-mira-lavender-light/50 to-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-mira-primary/10">
                <Infinity className="h-4 w-4 text-mira-primary" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-semibold text-mira-primary">Рекомендация на сегодня</span>
            </div>
            <p className="text-sm text-mira-text leading-relaxed">
              Сегодня можно добавить белок и фрукты: йогурт, яйца, рыбу, курицу, бобовые или ягоды. Это поможет поддержать энергию.
            </p>
            <p className="mt-3 text-[10px] text-mira-muted italic">Mira подобрала · ориентир</p>
          </Card>
        </div>
      </div>

      {/* Add meal modal */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 lg:items-center" onClick={() => setAdding(false)}>
          <Card className="w-full max-w-md rounded-t-3xl p-6 lg:rounded-3xl" onClick={e => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-mira-lavender lg:hidden" />
            <h3 className="mb-4 text-lg font-bold text-mira-text">Добавить приём пищи</h3>

            <p className="mb-2 text-sm font-semibold text-mira-text">Тип</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {(Object.keys(mealTypeLabels) as MealType[]).map(v => (
                <Chip key={v} label={mealTypeLabels[v]} active={mealType === v} onClick={() => setMealType(v)} />
              ))}
            </div>

            <p className="mb-2 text-sm font-semibold text-mira-text">Размер</p>
            <div className="mb-4 flex gap-2">
              {(Object.keys(mealSizeLabels) as MealSize[]).map(v => (
                <Chip key={v} label={mealSizeLabels[v]} active={mealSize === v} onClick={() => setMealSize(v)} />
              ))}
            </div>

            <p className="mb-2 text-sm font-semibold text-mira-text">Состав</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {(Object.keys(mealCompLabels) as MealComponent[]).map(v => (
                <Chip key={v} label={mealCompLabels[v]} active={components.includes(v)} onClick={() => toggleComponent(v)} />
              ))}
            </div>

            {components.length > 0 && showCalories && (
              <div className="mb-4 rounded-2xl border border-mira-success/15 bg-[#E0F5E8]/30 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-mira-success">Примерная оценка</p>
                <p className="mt-1 text-lg font-bold text-mira-text">
                  {estimateKcal(mealSize, components).min}–{estimateKcal(mealSize, components).max} ккал
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setAdding(false)}>Отмена</Button>
              <Button className="flex-1" onClick={addMeal}>Добавить</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
