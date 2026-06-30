"use client";

import { useState } from "react";
import { BriefcaseMedical, Check, Dumbbell, Footprints, GlassWater, Salad, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { addWorkout, dateKey, getCheckIn, getWalkingEntry, getWaterEntry, saveCheckIn, saveWalkingEntry, saveWeightEntry } from "@/lib/store";
import { normalizePeriodKit } from "@/lib/periodKit";
import type { MealComponent, MealSize, MiraLocalData, PeriodKitItemId, WorkoutLog } from "@/lib/types";
import type { ScreenProps } from "./types";

type NutritionChoice = "low" | "normal" | "overeating" | "sweet" | "salt";
type WalkChoice = "none" | "little" | "normal" | "many";
type WorkoutChoice = "none" | "light" | "medium" | "hard";

const today = () => dateKey();

const waterOptions = [
  { label: "0.5 л", glasses: 2 },
  { label: "1 л", glasses: 4 },
  { label: "1.5 л", glasses: 6 },
  { label: "2 л", glasses: 8 },
];

const nutritionOptions: Array<{ id: NutritionChoice; label: string; size: MealSize; components: MealComponent[] }> = [
  { id: "low", label: "мало", size: "small", components: ["fruits"] },
  { id: "normal", label: "обычно", size: "medium", components: ["protein", "vegetables", "grains"] },
  { id: "overeating", label: "переела", size: "large", components: ["grains", "fastfood"] },
  { id: "sweet", label: "тянет на сладкое", size: "medium", components: ["sweets"] },
  { id: "salt", label: "много соли", size: "medium", components: ["fastfood"] },
];

const walkingOptions: Array<{ id: WalkChoice; label: string; steps: number }> = [
  { id: "none", label: "почти не ходила", steps: 500 },
  { id: "little", label: "немного", steps: 2500 },
  { id: "normal", label: "нормально", steps: 6000 },
  { id: "many", label: "много", steps: 10000 },
];

const workoutOptions: Array<{ id: WorkoutChoice; label: string; status: WorkoutLog["status"]; activityType: WorkoutLog["activityType"]; durationMinutes?: number }> = [
  { id: "none", label: "нет", status: "skipped", activityType: "rest" },
  { id: "light", label: "лёгкая", status: "completed", activityType: "stretching", durationMinutes: 20 },
  { id: "medium", label: "средняя", status: "completed", activityType: "moderate_strength", durationMinutes: 35 },
  { id: "hard", label: "тяжёлая", status: "completed", activityType: "hiit", durationMinutes: 45 },
];

const kitQuestions: Array<{ id: PeriodKitItemId; label: string }> = [
  { id: "pads", label: "Прокладки/тампоны есть?" },
  { id: "pain_relief", label: "Обезболивающее есть?" },
  { id: "pregnancy_test", label: "Тест на беременность есть?" },
];

function getTodayMealChoice(data: MiraLocalData): NutritionChoice | null {
  const meal = data.checkIns[today()]?.meals?.[0];
  if (!meal) return null;
  if (meal.components.includes("sweets")) return "sweet";
  if (meal.components.includes("fastfood") && meal.size === "medium") return "salt";
  if (meal.size === "small") return "low";
  if (meal.size === "large") return "overeating";
  return "normal";
}

function getTodayWorkoutChoice(data: MiraLocalData): WorkoutChoice | null {
  const workout = data.workouts.find((item) => item.date === today());
  if (!workout) return null;
  if (workout.status === "skipped") return "none";
  if (workout.activityType === "stretching" || workout.activityType === "yoga" || workout.activityType === "walk") return "light";
  if (workout.activityType === "hiit" || workout.activityType === "run") return "hard";
  return "medium";
}

export function CareScreen({ data, persist }: ScreenProps) {
  const waterEntry = getWaterEntry(data);
  const walkingEntry = getWalkingEntry(data);
  const todayWeight = data.weightLog?.[today()]?.weight;
  const [weightInput, setWeightInput] = useState(todayWeight ? String(todayWeight) : "");
  const mealChoice = getTodayMealChoice(data);
  const workoutChoice = getTodayWorkoutChoice(data);
  const periodKit = normalizePeriodKit(data.periodKit);
  const readyKit = kitQuestions.filter((question) => periodKit.items.find((item) => item.id === question.id)?.checked).length;

  const completedCount = [
    waterEntry.glasses > 0,
    Boolean(mealChoice),
    walkingEntry.steps > 0,
    Boolean(workoutChoice),
    Boolean(todayWeight),
    readyKit > 0,
  ].filter(Boolean).length;

  function saveWater(glasses: number) {
    persist({
      ...data,
      waterLog: {
        ...data.waterLog,
        [today()]: { ...waterEntry, date: today(), glasses, goal: 8 },
      },
    });
  }

  function saveNutrition(choice: NutritionChoice) {
    const option = nutritionOptions.find((item) => item.id === choice);
    if (!option) return;
    const existing = getCheckIn(data, today());
    persist(saveCheckIn(data, {
      ...(existing ?? {}),
      date: today(),
      savedAt: new Date().toISOString(),
      meals: [{
        type: "lunch",
        size: option.size,
        components: option.components,
      }],
      symptomLog: {
        ...(existing?.symptomLog ?? {}),
        sweetCraving: choice === "sweet" ? true : existing?.symptomLog?.sweetCraving,
      },
    }));
  }

  function saveWalking(choice: WalkChoice) {
    const option = walkingOptions.find((item) => item.id === choice);
    if (!option) return;
    persist(saveWalkingEntry(data, { ...walkingEntry, date: today(), steps: option.steps, goal: 7000, source: "manual" }));
  }

  function saveWorkout(choice: WorkoutChoice) {
    const option = workoutOptions.find((item) => item.id === choice);
    if (!option) return;
    persist(addWorkout(data, {
      status: option.status,
      activityType: option.activityType,
      durationMinutes: option.durationMinutes,
      title: `Тренировка: ${option.label}`,
    }));
  }

  function saveWeight() {
    const value = Number.parseFloat(weightInput.replace(",", "."));
    if (!Number.isFinite(value)) return;
    persist(saveWeightEntry(data, { date: today(), weight: value }));
  }

  function toggleKitItem(id: PeriodKitItemId) {
    const nextKit = normalizePeriodKit(data.periodKit);
    persist({
      ...data,
      periodKit: {
        updatedAt: new Date().toISOString(),
        items: nextKit.items.map((item) => item.id === id ? { ...item, checked: !item.checked } : item),
      },
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-mira-text">Забота</h1>
        <p className="mt-2 text-sm leading-relaxed text-mira-muted">
          Забота помогает Mira понять, что влияет на твоё самочувствие: вода, питание, движение, вес, тренировки и аптечка.
        </p>
      </div>

      <Card className="border-mira-primary/10 bg-white p-5 shadow-[0_12px_32px_rgba(45,38,64,0.05)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Сегодня</p>
            <p className="mt-1 text-lg font-black text-mira-text">Достаточно заполнить 2 из 6 пунктов</p>
            <p className="mt-1 text-sm leading-relaxed text-mira-muted">Не нужно заполнять всё. Отметь только то, что легко вспомнить.</p>
          </div>
          <Badge>{completedCount}/6</Badge>
        </div>
      </Card>

      <CareModule icon={<GlassWater className="h-5 w-5" />} title="Вода" subtitle="Сколько выпила сегодня?">
        <div className="grid grid-cols-4 gap-2">
          {waterOptions.map((option) => (
            <ChoiceButton key={option.label} active={waterEntry.glasses === option.glasses} onClick={() => saveWater(option.glasses)}>
              {option.label}
            </ChoiceButton>
          ))}
        </div>
      </CareModule>

      <CareModule icon={<Salad className="h-5 w-5" />} title="Питание" subtitle="Сегодня ела нормально?">
        <div className="grid gap-2 sm:grid-cols-5">
          {nutritionOptions.map((option) => (
            <ChoiceButton key={option.id} active={mealChoice === option.id} onClick={() => saveNutrition(option.id)}>
              {option.label}
            </ChoiceButton>
          ))}
        </div>
      </CareModule>

      <CareModule icon={<Footprints className="h-5 w-5" />} title="Ходьба" subtitle="Шаги или активность">
        <div className="grid gap-2 sm:grid-cols-4">
          {walkingOptions.map((option) => (
            <ChoiceButton key={option.id} active={walkingEntry.steps === option.steps} onClick={() => saveWalking(option.id)}>
              {option.label}
            </ChoiceButton>
          ))}
        </div>
      </CareModule>

      <CareModule icon={<Dumbbell className="h-5 w-5" />} title="Тренировка" subtitle="Была тренировка?">
        <div className="grid grid-cols-4 gap-2">
          {workoutOptions.map((option) => (
            <ChoiceButton key={option.id} active={workoutChoice === option.id} onClick={() => saveWorkout(option.id)}>
              {option.label}
            </ChoiceButton>
          ))}
        </div>
      </CareModule>

      <CareModule icon={<Scale className="h-5 w-5" />} title="Вес" subtitle="Вес сегодня">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            value={weightInput}
            onChange={(event) => setWeightInput(event.target.value.replace(/[^\d,.]/g, ""))}
            inputMode="decimal"
            placeholder="например 62.5"
            className="min-w-0 rounded-2xl border border-mira-lavender/30 bg-white px-4 py-3 text-sm font-semibold text-mira-text outline-none transition placeholder:text-mira-muted focus:border-mira-primary/50 focus:ring-4 focus:ring-mira-primary/10"
          />
          <Button onClick={saveWeight}>Сохранить</Button>
        </div>
      </CareModule>

      <CareModule icon={<BriefcaseMedical className="h-5 w-5" />} title="Аптечка" subtitle="Что есть под рукой?">
        <div className="grid gap-2 sm:grid-cols-3">
          {kitQuestions.map((question) => {
            const checked = periodKit.items.find((item) => item.id === question.id)?.checked ?? false;
            return (
              <button
                key={question.id}
                type="button"
                onClick={() => toggleKitItem(question.id)}
                className={`flex min-h-16 items-center gap-2 rounded-2xl border px-3 py-2 text-left text-sm font-bold transition active:scale-[0.98] ${
                  checked ? "border-mira-success/25 bg-[#E0F5E8]/55 text-mira-text" : "border-mira-lavender/25 bg-white text-mira-muted"
                }`}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${checked ? "bg-mira-success text-white" : "bg-mira-bg text-mira-muted"}`}>
                  {checked && <Check className="h-4 w-4" />}
                </span>
                {question.label}
              </button>
            );
          })}
        </div>
      </CareModule>
    </div>
  );
}

function CareModule({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <Card className="border-mira-lavender/20 bg-white p-5 shadow-[0_10px_28px_rgba(45,38,64,0.04)]">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-mira-lavender-light text-mira-primary">
          {icon}
        </span>
        <div>
          <p className="text-sm font-black text-mira-text">{title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-mira-muted">{subtitle}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

function ChoiceButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-2xl border px-3 py-2 text-sm font-black transition hover:-translate-y-0.5 active:scale-[0.98] ${
        active ? "border-mira-primary bg-mira-lavender-light text-mira-primary shadow-glow" : "border-mira-lavender/25 bg-white text-mira-text"
      }`}
    >
      {children}
    </button>
  );
}
