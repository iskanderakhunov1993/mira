"use client";

import { useState } from "react";
import { Calendar, Check, ChevronLeft, ChevronRight, HeartPulse, Sparkles, UserRound } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MiraLogo } from "@/components/ui/MiraLogo";
import { saveProfile } from "@/lib/store";
import type { MiraLocalData, TrackingCategory, UserProfile } from "@/lib/types";

type Props = {
  data: MiraLocalData;
  persist: (data: MiraLocalData) => void;
  onComplete: () => void;
};

type CycleChoice = "unknown" | "21-24" | "25-28" | "29-32" | "33-36" | "36plus";
type GoalId = "cycle" | "delay" | "pain_pms" | "doctor" | "care";

const totalSteps = 5;

const cycleOptions: Array<{ id: CycleChoice; label: string; value: number }> = [
  { id: "unknown", label: "Не знаю", value: 28 },
  { id: "21-24", label: "21-24", value: 24 },
  { id: "25-28", label: "25-28", value: 28 },
  { id: "29-32", label: "29-32", value: 31 },
  { id: "33-36", label: "33-36", value: 35 },
  { id: "36plus", label: "Больше 36", value: 38 },
];

const goals: Array<{ id: GoalId; label: string; preferences: TrackingCategory[] }> = [
  { id: "cycle", label: "Понимать цикл", preferences: ["cycle", "mood", "energy"] },
  { id: "delay", label: "Следить за задержками", preferences: ["cycle", "pain", "intimacy"] },
  { id: "pain_pms", label: "Следить за болью и ПМС", preferences: ["cycle", "pain", "mood", "energy", "sleep"] },
  { id: "doctor", label: "Подготовиться к врачу", preferences: ["cycle", "pain", "mood", "energy", "sleep", "intimacy"] },
  { id: "care", label: "Питание и тренировки", preferences: ["cycle", "nutrition", "workout", "energy", "sleep"] },
];

const helpItems = [
  "что происходит с циклом;",
  "что лучше отметить;",
  "что может повторяться;",
  "что можно обсудить с врачом.",
];

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -48 : 48, opacity: 0 }),
};

function dateDaysAgo(days: number) {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

export function OnboardingScreen({ data, persist, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [name, setName] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [cycleChoice, setCycleChoice] = useState<CycleChoice>("25-28");
  const [selectedGoals, setSelectedGoals] = useState<GoalId[]>(["cycle"]);

  const canGoNext = step === 0 ? name.trim().length > 0 : step === 1 ? Boolean(periodStart) : true;

  function next() {
    if (!canGoNext) return;
    setDirection(1);
    setStep(current => Math.min(current + 1, totalSteps - 1));
  }

  function back() {
    setDirection(-1);
    setStep(current => Math.max(current - 1, 0));
  }

  function toggleGoal(id: GoalId) {
    setSelectedGoals(current => {
      if (current.includes(id)) return current.filter(item => item !== id);
      return [...current, id];
    });
  }

  function finish() {
    const selectedCycle = cycleOptions.find(option => option.id === cycleChoice) ?? cycleOptions[2];
    const preferences = new Set<TrackingCategory>(["cycle", "pain", "mood", "energy", "sleep"]);
    selectedGoals.forEach(goalId => {
      goals.find(goal => goal.id === goalId)?.preferences.forEach(item => preferences.add(item));
    });

    const anchorStart = periodStart || dateDaysAgo(14);
    const profile: UserProfile = {
      name: name.trim() || "Mira",
      showCalories: false,
      cycleConfig: {
        periodStart: anchorStart,
        cycleLength: selectedCycle.value,
        periodLength: 5,
        periodStarts: [anchorStart],
      },
      trackingPreferences: Array.from(preferences),
      additionalMode: "none",
      pinEnabled: false,
      hiddenNotifications: false,
      privateMarks: true,
    };

    persist({ ...saveProfile(data, profile), onboardingCompleted: true });
    onComplete();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-mira-bg px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-5 flex items-center justify-center gap-2">
          {Array.from({ length: totalSteps }, (_, index) => (
            <span
              key={index}
              className={`h-2 rounded-full transition-all ${index === step ? "w-7 bg-mira-primary" : "w-2 bg-mira-lavender"}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {step === 0 && (
              <OnboardingCard icon={<UserRound className="h-5 w-5" />} title="Как тебя зовут?" subtitle="Так Mira будет обращаться к тебе в подсказках.">
                <input
                  value={name}
                  onChange={event => setName(event.target.value)}
                  autoFocus
                  placeholder="Имя"
                  className="w-full rounded-2xl border border-mira-lavender/30 bg-white px-4 py-3 text-base font-semibold text-mira-text outline-none transition placeholder:text-mira-muted focus:border-mira-primary/50 focus:ring-4 focus:ring-mira-primary/10"
                />
              </OnboardingCard>
            )}

            {step === 1 && (
              <OnboardingCard icon={<Calendar className="h-5 w-5" />} title="Когда начались последние месячные?" subtitle="Это нужно, чтобы Mira показала день цикла и прогноз.">
                <input
                  type="date"
                  value={periodStart}
                  onChange={event => setPeriodStart(event.target.value)}
                  className="w-full rounded-2xl border border-mira-lavender/30 bg-white px-4 py-3 text-base font-semibold text-mira-text outline-none transition focus:border-mira-primary/50 focus:ring-4 focus:ring-mira-primary/10"
                />
              </OnboardingCard>
            )}

            {step === 2 && (
              <OnboardingCard icon={<Sparkles className="h-5 w-5" />} title="Сколько обычно длится цикл?" subtitle="Если не знаешь точно, выбери «Не знаю». Mira уточнит по отметкам.">
                <div className="grid grid-cols-2 gap-2">
                  {cycleOptions.map(option => (
                    <ChoiceButton key={option.id} active={cycleChoice === option.id} onClick={() => setCycleChoice(option.id)}>
                      {option.label}
                    </ChoiceButton>
                  ))}
                </div>
              </OnboardingCard>
            )}

            {step === 3 && (
              <OnboardingCard icon={<HeartPulse className="h-5 w-5" />} title="Что для тебя важно?" subtitle="Можно выбрать несколько вариантов.">
                <div className="space-y-2">
                  {goals.map(goal => (
                    <ChoiceButton key={goal.id} active={selectedGoals.includes(goal.id)} onClick={() => toggleGoal(goal.id)}>
                      {goal.label}
                    </ChoiceButton>
                  ))}
                </div>
              </OnboardingCard>
            )}

            {step === 4 && (
              <OnboardingCard icon={<Check className="h-5 w-5" />} title="Как Mira будет помогать" subtitle="Каждый день Mira покажет:">
                <div className="mb-5 flex justify-center">
                  <MiraLogo size={78} />
                </div>
                <div className="space-y-2">
                  {helpItems.map((item, index) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl bg-mira-bg px-3 py-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mira-lavender-light text-xs font-black text-mira-primary">
                        {index + 1}
                      </span>
                      <p className="text-sm font-semibold leading-relaxed text-mira-text">{item}</p>
                    </div>
                  ))}
                </div>
              </OnboardingCard>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-5 flex gap-2">
          {step > 0 && (
            <Button variant="ghost" className="flex-1" onClick={back}>
              <ChevronLeft className="h-4 w-4" /> Назад
            </Button>
          )}
          {step < totalSteps - 1 ? (
            <Button className="flex-1" onClick={next} disabled={!canGoNext}>
              Далее <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button className="flex-1" onClick={finish}>
              Начать <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function OnboardingCard({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <Card className="border-mira-primary/10 bg-white p-6 shadow-[0_18px_48px_rgba(45,38,64,0.08)]">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-mira-lavender-light text-mira-primary">
          {icon}
        </div>
        <h1 className="text-2xl font-black text-mira-text">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-mira-muted">{subtitle}</p>
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
      className={`min-h-12 w-full rounded-2xl border px-4 py-3 text-left text-sm font-black transition active:scale-[0.98] ${
        active ? "border-mira-primary bg-mira-lavender-light text-mira-primary shadow-glow" : "border-mira-lavender/25 bg-white text-mira-text"
      }`}
    >
      {children}
    </button>
  );
}
