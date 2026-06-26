"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Salad, GlassWater, Dumbbell, Minus, Plus,
  Leaf, Zap, Moon, Flame, ChevronRight, Check,
  X, Home, TreePine, RotateCcw, Timer,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getCycleDay, getCyclePhase, getPhaseLabel,
  getCheckIn, getWaterEntry, addWaterGlass, removeWaterGlass,
  addWorkout, dateKey,
} from "@/lib/store";
import { generateWorkout, getWorkoutStats } from "@/lib/workouts";
import type { ScreenProps } from "./types";
import type { CyclePhase, WorkoutLocation, WorkoutEquipment, GeneratedWorkout, MealComponent } from "@/lib/types";

// ── Meal categories ──

const mealCategories: { id: MealComponent; label: string; emoji: string; color: string }[] = [
  { id: "protein", label: "Белок", emoji: "🥩", color: "bg-[#F5E0E0]" },
  { id: "vegetables", label: "Овощи", emoji: "🥬", color: "bg-[#E0F5E8]" },
  { id: "fruits", label: "Фрукты", emoji: "🍎", color: "bg-[#F5ECE0]" },
  { id: "grains", label: "Углеводы", emoji: "🍚", color: "bg-[#F5F0E0]" },
  { id: "dairy", label: "Молочное", emoji: "🥛", color: "bg-[#E0E8F5]" },
  { id: "sweets", label: "Сладкое", emoji: "🍫", color: "bg-[#EDE0F5]" },
  { id: "fastfood", label: "Фастфуд", emoji: "🍔", color: "bg-[#F5E8E0]" },
];

const mealTypes = [
  { id: "breakfast", label: "Завтрак", emoji: "☀️" },
  { id: "lunch", label: "Обед", emoji: "🌤️" },
  { id: "dinner", label: "Ужин", emoji: "🌙" },
  { id: "snack", label: "Перекус", emoji: "🍪" },
];

// ── Nutrition by phase ──

const nutritionByPhase: Record<CyclePhase, { tip: string; good: string[]; avoid: string[] }> = {
  menstruation: {
    tip: "Восполняй железо и магний. Тёплая еда помогает при спазмах.",
    good: ["Гречка", "Шпинат", "Красное мясо", "Тёмный шоколад", "Бананы"],
    avoid: ["Много кофе", "Алкоголь", "Очень солёное"],
  },
  follicular: {
    tip: "Энергия растёт — белок и сложные углеводы поддержат активность.",
    good: ["Яйца", "Рыба", "Овсянка", "Бурый рис", "Йогурт"],
    avoid: [],
  },
  ovulation: {
    tip: "Пик энергии. Антиоксиданты и лёгкая еда — идеально.",
    good: ["Ягоды", "Орехи", "Зелёный чай", "Салаты", "Рыба"],
    avoid: [],
  },
  luteal: {
    tip: "Тяга к сладкому — это прогестерон. Замени на полезные альтернативы.",
    good: ["Финики", "Орехи с мёдом", "Бананы", "Авокадо", "Тёмный шоколад"],
    avoid: ["Много сахара", "Много соли", "Кофе вечером"],
  },
};

export function CareScreen({ data, persist }: ScreenProps) {
  const profile = data.profile;
  const cycleDay = getCycleDay(profile);
  const cycleLength = profile?.cycleConfig.cycleLength ?? 28;
  const periodLength = profile?.cycleConfig.periodLength ?? 5;
  const phase = getCyclePhase(cycleDay, periodLength, cycleLength);
  const checkIn = getCheckIn(data);
  const waterEntry = getWaterEntry(data);
  const hasPain = checkIn?.pain?.level === "strong" || checkIn?.pain?.level === "medium";

  const [activeTab, setActiveTab] = useState(0);

  // Meal state
  const [mealType, setMealType] = useState<string | null>(null);
  const [selectedComponents, setSelectedComponents] = useState<MealComponent[]>([]);
  const [mealSaved, setMealSaved] = useState(false);

  // Workout state
  const [workoutStep, setWorkoutStep] = useState<"choose" | "location" | "equipment" | "workout" | "done">("choose");
  const [workoutLocation, setWorkoutLocation] = useState<WorkoutLocation | null>(null);
  const [workoutEquipment, setWorkoutEquipment] = useState<WorkoutEquipment | null>(null);
  const [generatedWorkout, setGeneratedWorkout] = useState<GeneratedWorkout | null>(null);

  const workoutStats = getWorkoutStats(data);
  const nutrition = nutritionByPhase[phase];

  const tabs = ["Питание", "Вода", "Тренировка"];
  const tabIcons = [Salad, GlassWater, Dumbbell];
  const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

  // ── Meal handlers ──
  function toggleComponent(c: MealComponent) {
    setSelectedComponents(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  }

  function saveMeal() {
    if (!mealType || selectedComponents.length === 0) return;
    const key = dateKey();
    const existing = data.checkIns[key];
    const meals = [...(existing?.meals ?? [])];
    meals.push({
      type: mealType as "breakfast" | "lunch" | "dinner" | "snack",
      size: "medium",
      components: selectedComponents,
    });
    persist({
      ...data,
      checkIns: {
        ...data.checkIns,
        [key]: { ...existing, date: key, savedAt: new Date().toISOString(), meals },
      },
    });
    setMealSaved(true);
    setTimeout(() => { setMealSaved(false); setMealType(null); setSelectedComponents([]); }, 1500);
  }

  // ── Workout handlers ──
  function startWorkout() {
    setWorkoutStep("location");
  }

  function selectLocation(loc: WorkoutLocation) {
    setWorkoutLocation(loc);
    setWorkoutStep("equipment");
  }

  function selectEquipment(eq: WorkoutEquipment) {
    if (!workoutLocation) return;
    setWorkoutEquipment(eq);
    const workout = generateWorkout(data, workoutLocation, eq);
    setGeneratedWorkout(workout);
    setWorkoutStep("workout");
  }

  function finishWorkout(status: "completed" | "skipped" | "lighter") {
    if (!generatedWorkout) return;
    persist(addWorkout(data, {
      status,
      activityType: generatedWorkout.intensity === "light" ? "yoga" : generatedWorkout.intensity === "moderate" ? "moderate_strength" : "light_strength",
      durationMinutes: parseInt(generatedWorkout.duration) || 30,
      title: generatedWorkout.title,
      exercises: generatedWorkout.exercises,
      location: workoutLocation ?? undefined,
    }));
    setWorkoutStep("done");
  }

  function resetWorkout() {
    setWorkoutStep("choose");
    setWorkoutLocation(null);
    setWorkoutEquipment(null);
    setGeneratedWorkout(null);
  }

  // ── Today's meals ──
  const todayMeals = data.checkIns[dateKey()]?.meals ?? [];

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }}>
      <motion.div variants={fadeUp} className="mb-6">
        <h1 className="text-2xl font-bold text-mira-text">Забота</h1>
        <p className="mt-1 text-sm text-mira-muted">
          День {cycleDay}, {getPhaseLabel(phase).toLowerCase()} фаза
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} className="mb-6 flex gap-1 rounded-2xl bg-white p-1 shadow-card">
        {tabs.map((t, i) => {
          const Icon = tabIcons[i];
          return (
            <button key={t} onClick={() => setActiveTab(i)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition ${
              activeTab === i ? "bg-mira-lavender-light text-mira-primary shadow-card" : "text-mira-muted"
            }`}>
              <Icon className="h-3.5 w-3.5" />
              {t}
            </button>
          );
        })}
      </motion.div>

      {/* ══════ TAB: Питание ══════ */}
      {activeTab === 0 && (
        <div className="space-y-4">
          {/* Phase nutrition tip */}
          <Card className="border-mira-success/15 bg-[#E0F5E8]/20 p-4">
            <p className="text-sm text-mira-text">{nutrition.tip}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {nutrition.good.map(f => (
                <span key={f} className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-mira-success">{f}</span>
              ))}
            </div>
            {nutrition.avoid.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {nutrition.avoid.map(f => (
                  <span key={f} className="rounded-full bg-[#F5E0E0]/50 px-2 py-0.5 text-[11px] font-medium text-[#C47E7E]">✕ {f}</span>
                ))}
              </div>
            )}
          </Card>

          {/* Quick meal logger */}
          <Card className="p-5">
            <p className="text-sm font-bold text-mira-text mb-3">Что ела?</p>

            {mealSaved ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mira-success/15">
                  <Check className="h-6 w-6 text-mira-success" />
                </div>
                <p className="mt-2 text-sm font-semibold text-mira-success">Сохранено!</p>
              </motion.div>
            ) : !mealType ? (
              <div className="grid grid-cols-4 gap-2">
                {mealTypes.map(m => (
                  <button key={m.id} onClick={() => setMealType(m.id)}
                    className="flex flex-col items-center gap-1 rounded-2xl border border-mira-lavender/20 bg-mira-bg p-3 transition hover:border-mira-primary/30 active:scale-[0.97]">
                    <span className="text-xl">{m.emoji}</span>
                    <span className="text-[10px] font-semibold text-mira-text">{m.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-mira-muted">Что было в {mealTypes.find(m => m.id === mealType)?.label.toLowerCase()}?</p>
                  <button onClick={() => { setMealType(null); setSelectedComponents([]); }} className="text-xs text-mira-muted hover:text-mira-primary">✕ Отмена</button>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {mealCategories.map(cat => (
                    <button key={cat.id} onClick={() => toggleComponent(cat.id)}
                      className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-2.5 transition active:scale-[0.97] ${
                        selectedComponents.includes(cat.id)
                          ? "border-mira-primary bg-mira-lavender-light"
                          : "border-transparent " + cat.color
                      }`}>
                      <span className="text-lg">{cat.emoji}</span>
                      <span className="text-[10px] font-semibold text-mira-text">{cat.label}</span>
                    </button>
                  ))}
                </div>
                {selectedComponents.length > 0 && (
                  <Button className="w-full" onClick={saveMeal}>
                    Сохранить <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Today's meals summary */}
          {todayMeals.length > 0 && (
            <Card className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted mb-2">Сегодня</p>
              <div className="space-y-2">
                {todayMeals.map((meal, i) => {
                  const mt = mealTypes.find(m => m.id === meal.type);
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-sm">{mt?.emoji}</span>
                      <span className="text-xs font-semibold text-mira-text">{mt?.label}</span>
                      <div className="flex gap-1 ml-auto">
                        {meal.components.map(c => {
                          const cat = mealCategories.find(mc => mc.id === c);
                          return <span key={c} className="text-sm">{cat?.emoji}</span>;
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ══════ TAB: Вода ══════ */}
      {activeTab === 1 && (
        <div className="space-y-5">
          <Card className="p-6">
            <div className="flex flex-col items-center">
              {/* Bottle visualization */}
              <div className="relative h-48 w-24 mb-5">
                {/* Bottle shape */}
                <div className="absolute inset-0 rounded-[16px] rounded-t-[8px] border-2 border-[#7BAF8D]/30 bg-[#E0F5E8]/20 overflow-hidden">
                  {/* Bottle neck */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-4 bg-[#7BAF8D]/20 rounded-t-lg border-x-2 border-t-2 border-[#7BAF8D]/30" />
                  {/* Water fill */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#7BAF8D] to-[#A0D4B0]"
                    style={{ borderRadius: "0 0 14px 14px" }}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.min((waterEntry.glasses / waterEntry.goal) * 100, 100)}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                  {/* Cap */}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-3 bg-[#7BAF8D] rounded-t-lg" />
                </div>
                {/* Volume label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                  <span className="text-2xl font-bold text-white drop-shadow-md">{waterEntry.glasses * 250}</span>
                  <span className="text-[10px] font-semibold text-white/80 drop-shadow-sm">мл</span>
                </div>
              </div>

              {/* Goal */}
              <p className="text-sm text-mira-muted mb-4">
                Цель: <span className="font-bold text-mira-text">{waterEntry.goal * 250} мл</span> ({waterEntry.goal} стаканов)
              </p>

              {/* Volume buttons */}
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted mb-2">Я выпила</p>
              <div className="grid grid-cols-4 gap-2 w-full mb-3">
                {[
                  { label: "🥤 Стакан", ml: 250, add: 1 },
                  { label: "🫗 Кружка", ml: 350, add: 1.4 },
                  { label: "🧴 0.5л", ml: 500, add: 2 },
                  { label: "🍶 1л", ml: 1000, add: 4 },
                ].map(opt => (
                  <button key={opt.label} onClick={() => {
                    let d = data;
                    for (let i = 0; i < Math.round(opt.add); i++) d = addWaterGlass(d);
                    persist(d);
                  }}
                    className="flex flex-col items-center gap-1 rounded-2xl border-2 border-mira-lavender/20 bg-white p-3 transition-all hover:border-mira-success/30 hover:bg-[#E0F5E8]/20 active:scale-95">
                    <span className="text-lg">{opt.label.split(" ")[0]}</span>
                    <span className="text-[10px] font-semibold text-mira-text">{opt.label.split(" ")[1]}</span>
                    <span className="text-[9px] text-mira-muted">{opt.ml} мл</span>
                  </button>
                ))}
              </div>

              {/* Undo */}
              <button onClick={() => persist(removeWaterGlass(data))}
                className="text-xs text-mira-muted hover:text-mira-primary transition">
                ← Убрать стакан
              </button>

              {waterEntry.glasses >= waterEntry.goal && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 flex items-center gap-2">
                  <span className="text-2xl">🎉</span>
                  <p className="text-sm font-semibold text-mira-success">Норма выполнена!</p>
                </motion.div>
              )}
            </div>
          </Card>

          <Card className="border-mira-success/10 bg-[#E0F5E8]/20 p-4">
            <p className="text-xs text-mira-success font-semibold mb-1">💧 Почему вода важна сейчас</p>
            <p className="text-xs text-mira-muted">
              {phase === "menstruation" && "Организм теряет больше жидкости. Тёплая вода помогает при спазмах."}
              {phase === "follicular" && "Энергия растёт — вода поддерживает метаболизм и концентрацию."}
              {phase === "ovulation" && "При высокой активности вода особенно важна."}
              {phase === "luteal" && "Вода помогает при вздутии. Чем больше пьёшь, тем меньше задержка жидкости."}
            </p>
          </Card>
        </div>
      )}

      {/* ══════ TAB: Тренировка ══════ */}
      {activeTab === 2 && (
        <div className="space-y-4">
          {/* Stats bar */}
          {workoutStats.total > 0 && workoutStep === "choose" && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-mira-muted">Выполнено</p>
                  <p className="text-lg font-bold text-mira-text">{workoutStats.completionRate}%</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-mira-muted">Тренировок</p>
                  <p className="text-lg font-bold text-mira-text">{workoutStats.completed}/{workoutStats.total}</p>
                </div>
                <div className="text-right">
                  {workoutStats.nextRecommendedIn === 0 ? (
                    <Badge className="bg-mira-success/15 text-mira-success border-mira-success/30">Пора тренироваться!</Badge>
                  ) : (
                    <p className="text-xs text-mira-muted">Следующая через {workoutStats.nextRecommendedIn} дн.</p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Step: Choose */}
          {workoutStep === "choose" && (
            <>
              <Card className="border-mira-primary/10 bg-mira-lavender-light/20 p-4">
                <p className="text-xs text-mira-primary font-semibold">
                  {hasPain
                    ? "Боль отмечена — предложим только лёгкую активность"
                    : phase === "menstruation"
                      ? "Менструальная фаза — мягкие тренировки"
                      : phase === "follicular"
                        ? "Фолликулярная фаза — отличное время для силовых"
                        : phase === "ovulation"
                          ? "Овуляция — максимум силы и выносливости"
                          : "Лютеиновая фаза — умеренная нагрузка"}
                </p>
              </Card>
              <Button className="w-full" size="lg" onClick={startWorkout}>
                <Dumbbell className="h-5 w-5" /> Сгенерировать тренировку
              </Button>
            </>
          )}

          {/* Step: Location */}
          {workoutStep === "location" && (
            <Card className="p-5">
              <p className="text-sm font-bold text-mira-text mb-4">Где ты сегодня?</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "home" as WorkoutLocation, label: "Дома", emoji: "🏠", icon: Home },
                  { id: "gym" as WorkoutLocation, label: "В зале", emoji: "🏋️", icon: Dumbbell },
                  { id: "outdoor" as WorkoutLocation, label: "На улице", emoji: "🌳", icon: TreePine },
                ].map(opt => (
                  <button key={opt.id} onClick={() => selectLocation(opt.id)}
                    className="flex flex-col items-center gap-2 rounded-2xl border-2 border-mira-lavender/20 bg-white p-5 transition hover:border-mira-primary/30 active:scale-[0.97]">
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="text-xs font-semibold text-mira-text">{opt.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={resetWorkout} className="mt-3 w-full text-center text-xs text-mira-muted hover:text-mira-primary">← Назад</button>
            </Card>
          )}

          {/* Step: Equipment */}
          {workoutStep === "equipment" && (
            <Card className="p-5">
              <p className="text-sm font-bold text-mira-text mb-4">Есть оборудование?</p>
              <div className="space-y-2">
                {[
                  { id: "none" as WorkoutEquipment, label: "Нет, только тело", desc: "Тренировка без инвентаря" },
                  { id: "minimal" as WorkoutEquipment, label: "Минимум", desc: "Гантели, резинки, коврик" },
                  { id: "full" as WorkoutEquipment, label: "Полное", desc: "Тренажёры, штанга, блоки" },
                ].map(opt => (
                  <button key={opt.id} onClick={() => selectEquipment(opt.id)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-mira-lavender/20 bg-white p-4 text-left transition hover:border-mira-primary/30 active:scale-[0.98]">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-mira-text">{opt.label}</p>
                      <p className="text-xs text-mira-muted">{opt.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-mira-lavender" />
                  </button>
                ))}
              </div>
              <button onClick={() => setWorkoutStep("location")} className="mt-3 w-full text-center text-xs text-mira-muted hover:text-mira-primary">← Назад</button>
            </Card>
          )}

          {/* Step: Workout */}
          {workoutStep === "workout" && generatedWorkout && (
            <div className="space-y-4">
              <Card className="overflow-hidden p-0">
                <div className={`px-5 py-4 ${
                  generatedWorkout.intensity === "light" ? "bg-[#E0F5E8]/40" :
                  generatedWorkout.intensity === "moderate" ? "bg-mira-lavender-light/40" :
                  "bg-[#F5E0EA]/40"
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-mira-text">{generatedWorkout.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Timer className="h-3 w-3 text-mira-muted" />
                        <span className="text-xs text-mira-muted">{generatedWorkout.duration}</span>
                        <Badge className="text-[10px]">{
                          generatedWorkout.intensity === "light" ? "Лёгкая" :
                          generatedWorkout.intensity === "moderate" ? "Средняя" : "Интенсивная"
                        }</Badge>
                      </div>
                    </div>
                    <button onClick={resetWorkout} className="rounded-xl p-2 text-mira-muted hover:bg-white/50">
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="p-5">
                  {generatedWorkout.phaseNote && (
                    <p className="text-xs text-mira-primary font-semibold mb-4">{generatedWorkout.phaseNote}</p>
                  )}

                  <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted mb-2">Разминка</p>
                  <p className="text-sm text-mira-text mb-4">{generatedWorkout.warmup}</p>

                  <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted mb-2">Основная часть</p>
                  <div className="space-y-2.5 mb-4">
                    {generatedWorkout.exercises.map((ex, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl bg-mira-bg p-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mira-lavender-light text-xs font-bold text-mira-primary">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-mira-text">{ex.name}</p>
                          <p className="text-xs text-mira-muted">
                            {ex.sets && ex.reps && `${ex.sets} × ${ex.reps}`}
                            {ex.duration && !ex.sets && ex.duration}
                            {ex.rest && ` · отдых ${ex.rest}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted mb-2">Заминка</p>
                  <p className="text-sm text-mira-text mb-4">{generatedWorkout.cooldown}</p>
                </div>
              </Card>

              <div className="grid grid-cols-3 gap-2">
                <Button className="flex-1" onClick={() => finishWorkout("completed")}>
                  <Check className="h-4 w-4" /> Сделала
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => finishWorkout("lighter")}>
                  Легче
                </Button>
                <Button variant="ghost" className="flex-1" onClick={() => finishWorkout("skipped")}>
                  <X className="h-4 w-4" /> Пропуск
                </Button>
              </div>
            </div>
          )}

          {/* Step: Done */}
          {workoutStep === "done" && (
            <Card className="p-6">
              <div className="flex flex-col items-center text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-mira-success/15 mb-4">
                  <Check className="h-8 w-8 text-mira-success" />
                </motion.div>
                <p className="text-lg font-bold text-mira-text">Записано!</p>
                <p className="text-sm text-mira-muted mt-1">
                  Выполнено {getWorkoutStats({ ...data }).completionRate}% тренировок
                </p>
                {getWorkoutStats(data).nextRecommendedIn > 0 && (
                  <p className="text-xs text-mira-primary font-semibold mt-2">
                    Следующая тренировка рекомендуется через {getWorkoutStats(data).nextRecommendedIn} дн.
                  </p>
                )}
                <Button variant="secondary" className="mt-4" onClick={resetWorkout}>
                  <RotateCcw className="h-4 w-4" /> Ещё тренировка
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </motion.div>
  );
}
