"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Battery,
  CalendarDays,
  Check,
  FileText,
  Heart,
  HeartPulse,
  Lock,
  Moon,
  Shield,
  Smile,
  Sparkles,
  UserRound,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { saveProfile } from "@/lib/store";
import type { MiraLocalData, TrackingCategory, UserProfile } from "@/lib/types";

type Props = {
  data: MiraLocalData;
  persist: (data: MiraLocalData) => void;
  onComplete: () => void;
};

type CycleChoice = "unknown" | "21-24" | "25-28" | "29-32" | "33-35" | "irregular";
type PeriodChoice = "2-3" | "4-5" | "6-7" | "8plus" | "unknown";
type GoalId = "cycle" | "pain" | "doctor" | "pms" | "diary";
type SymptomId = "period" | "pain" | "mood" | "energy" | "sleep" | "pms" | "sex" | "notes";

const totalSteps = 8;

const cycleOptions: Array<{ id: CycleChoice; label: string; value: number }> = [
  { id: "unknown", label: "Не знаю", value: 28 },
  { id: "21-24", label: "21-24", value: 24 },
  { id: "25-28", label: "25-28", value: 28 },
  { id: "29-32", label: "29-32", value: 31 },
  { id: "33-35", label: "33-35", value: 34 },
  { id: "irregular", label: "Нерегулярный", value: 30 },
];

const periodOptions: Array<{ id: PeriodChoice; label: string; value: number }> = [
  { id: "2-3", label: "2-3 дня", value: 3 },
  { id: "4-5", label: "4-5 дней", value: 5 },
  { id: "6-7", label: "6-7 дней", value: 7 },
  { id: "8plus", label: "8+ дней", value: 8 },
  { id: "unknown", label: "Не знаю", value: 5 },
];

const goals: Array<{ id: GoalId; label: string; body: string; icon: typeof CalendarDays; preferences: TrackingCategory[] }> = [
  { id: "cycle", label: "Понять цикл", body: "день, фаза, задержки", icon: CalendarDays, preferences: ["cycle", "mood", "energy"] },
  { id: "pain", label: "Боль и симптомы", body: "что повторяется", icon: HeartPulse, preferences: ["cycle", "pain", "mood", "energy", "sleep"] },
  { id: "doctor", label: "Отчёт врачу", body: "факты без памяти", icon: FileText, preferences: ["cycle", "pain", "mood", "energy", "sleep", "intimacy"] },
  { id: "pms", label: "ПМС и настроение", body: "эмоции, сон, энергия", icon: Smile, preferences: ["cycle", "mood", "energy", "sleep"] },
  { id: "diary", label: "Приватный дневник", body: "заметки и история", icon: Lock, preferences: ["cycle", "mood", "energy", "sleep"] },
];

const symptoms: Array<{ id: SymptomId; label: string; icon: typeof CalendarDays; tone: "lime" | "pink" }> = [
  { id: "period", label: "Месячные", icon: CalendarDays, tone: "pink" },
  { id: "pain", label: "Боль", icon: HeartPulse, tone: "pink" },
  { id: "mood", label: "Настроение", icon: Smile, tone: "lime" },
  { id: "energy", label: "Энергия", icon: Battery, tone: "lime" },
  { id: "sleep", label: "Сон", icon: Moon, tone: "lime" },
  { id: "pms", label: "ПМС", icon: Sparkles, tone: "pink" },
  { id: "sex", label: "Секс/контрацепция", icon: Heart, tone: "lime" },
  { id: "notes", label: "Личные заметки", icon: FileText, tone: "lime" },
];

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 28 : -28, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -28 : 28, opacity: 0 }),
};

function dateDaysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

export function OnboardingScreen({ data, persist, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [name, setName] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [cycleChoice, setCycleChoice] = useState<CycleChoice>("25-28");
  const [periodChoice, setPeriodChoice] = useState<PeriodChoice>("4-5");
  const [selectedGoals, setSelectedGoals] = useState<GoalId[]>(["cycle"]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomId[]>(["period", "pain", "mood", "energy", "sleep"]);
  const [hiddenNotifications, setHiddenNotifications] = useState(true);
  const [privateMarks, setPrivateMarks] = useState(true);

  const canGoNext = step === 0 ? name.trim().length > 0 : step === 2 ? Boolean(periodStart) : true;
  const percent = Math.round(((step + 1) / totalSteps) * 100);

  const selectedPreferences = useMemo(() => {
    const preferences = new Set<TrackingCategory>(["cycle", "pain", "mood", "energy", "sleep"]);
    selectedGoals.forEach((goalId) => {
      goals.find((goal) => goal.id === goalId)?.preferences.forEach((item) => preferences.add(item));
    });
    if (selectedSymptoms.includes("sex")) preferences.add("intimacy");
    return Array.from(preferences);
  }, [selectedGoals, selectedSymptoms]);

  function next() {
    if (!canGoNext) return;
    setDirection(1);
    setStep((current) => Math.min(current + 1, totalSteps - 1));
  }

  function back() {
    setDirection(-1);
    setStep((current) => Math.max(current - 1, 0));
  }

  function toggleGoal(id: GoalId) {
    setSelectedGoals((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleSymptom(id: SymptomId) {
    setSelectedSymptoms((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function finish() {
    const selectedCycle = cycleOptions.find((option) => option.id === cycleChoice) ?? cycleOptions[2];
    const selectedPeriod = periodOptions.find((option) => option.id === periodChoice) ?? periodOptions[1];
    const anchorStart = periodStart || dateDaysAgo(14);
    const profile: UserProfile = {
      name: name.trim() || "Mira",
      showCalories: false,
      cycleConfig: {
        periodStart: anchorStart,
        cycleLength: selectedCycle.value,
        periodLength: selectedPeriod.value,
        periodStarts: [anchorStart],
      },
      trackingPreferences: selectedPreferences,
      additionalMode: "none",
      pinEnabled: false,
      hiddenNotifications,
      privateMarks,
    };

    persist({ ...saveProfile(data, profile), onboardingCompleted: true });
    onComplete();
  }

  return (
    <main className="min-h-screen bg-[#050505] text-[#F5F0ED]">
      <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col px-5 pb-6 pt-5">
        <header className="mb-10 flex items-center justify-between border-b border-[#2E2826] pb-5">
          <div className="flex items-center gap-2">
            <span className="text-4xl font-black leading-none text-[#B3FF6A] mira-stitch-title">Mira</span>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#404A35] bg-[#1D1816] text-[#B3FF6A]">
            <Shield className="h-5 w-5" />
          </span>
        </header>

        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[13px] font-black uppercase tracking-[0.22em] text-[#BFCAAF]">Шаг {step + 1} из {totalSteps}</span>
            <span className="text-lg font-black text-[#B3FF6A]">{percent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#3A3331]">
            <div className="h-full rounded-full bg-[#B3FF6A] transition-all duration-300" style={{ width: `${percent}%` }} />
          </div>
        </div>

        <div className="min-h-0 flex-1">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.section
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="h-full"
            >
              {step === 0 && (
                <Step title="Как тебя называть?" body="Так Mira будет обращаться к тебе в подсказках. Можно указать любое имя.">
                  <div className="mira-stitch-inset mt-8 rounded-[20px] p-4">
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[#8D817B]">Имя</label>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      autoFocus
                      placeholder="Например, Амина"
                      className="w-full bg-transparent text-2xl font-black text-[#F5F0ED] outline-none placeholder:text-[#6A5D57]"
                    />
                  </div>
                </Step>
              )}

              {step === 1 && (
                <Step title="Сколько обычно длится цикл?" body="Если не знаешь точно, выбери ближайший вариант. Mira уточнит прогноз по будущим отметкам.">
                  <ChoiceGrid>
                    {cycleOptions.map((option) => (
                      <ChoiceTile key={option.id} active={cycleChoice === option.id} onClick={() => setCycleChoice(option.id)}>
                        {option.label}
                      </ChoiceTile>
                    ))}
                  </ChoiceGrid>
                </Step>
              )}

              {step === 2 && (
                <Step title="Когда начались последние месячные?" body="Это главный якорь: по нему Mira покажет день цикла, фазу и задержку.">
                  <div className="mira-stitch-inset mt-8 rounded-[20px] p-4">
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[#8D817B]">Дата начала</label>
                    <input
                      type="date"
                      value={periodStart}
                      onChange={(event) => setPeriodStart(event.target.value)}
                      className="w-full bg-transparent text-xl font-black text-[#F5F0ED] outline-none [color-scheme:dark]"
                    />
                  </div>
                </Step>
              )}

              {step === 3 && (
                <Step title="Сколько обычно длятся месячные?" body="Нужно для прогноза и отчёта врачу. Если цикл плавает, это нормально.">
                  <ChoiceGrid>
                    {periodOptions.map((option) => (
                      <ChoiceTile key={option.id} active={periodChoice === option.id} onClick={() => setPeriodChoice(option.id)}>
                        {option.label}
                      </ChoiceTile>
                    ))}
                  </ChoiceGrid>
                </Step>
              )}

              {step === 4 && (
                <Step title="Что ты хочешь отслеживать в Mira?" body="Выбери основные категории для Today и быстрых отметок.">
                  <div className="mt-8 grid grid-cols-2 gap-3">
                    {goals.map((goal) => (
                      <LargeTile key={goal.id} active={selectedGoals.includes(goal.id)} icon={goal.icon} title={goal.label} body={goal.body} onClick={() => toggleGoal(goal.id)} />
                    ))}
                  </div>
                </Step>
              )}

              {step === 5 && (
                <Step title="Какие данные добавить в быстрый лог?" body="Эти пункты будут доступны в Track. Секс и заметки останутся приватными по умолчанию.">
                  <div className="mt-8 grid grid-cols-2 gap-3">
                    {symptoms.map((symptom) => (
                      <LargeTile
                        key={symptom.id}
                        active={selectedSymptoms.includes(symptom.id)}
                        icon={symptom.icon}
                        title={symptom.label}
                        tone={symptom.tone}
                        onClick={() => toggleSymptom(symptom.id)}
                      />
                    ))}
                  </div>
                </Step>
              )}

              {step === 6 && (
                <Step title="Приватность по умолчанию" body="Mira хранит данные локально. Личные заметки и секс не попадут в отчёт врачу без твоего выбора.">
                  <div className="mt-8 space-y-3">
                    <PrivacyToggle title="Скрытые уведомления" body="Без слов про месячные, секс и здоровье на экране блокировки." checked={hiddenNotifications} onClick={() => setHiddenNotifications((value) => !value)} />
                    <PrivacyToggle title="Приватные отметки" body="Интимность и заметки скрыты из отчёта врачу по умолчанию." checked={privateMarks} onClick={() => setPrivateMarks((value) => !value)} />
                    <div className="mira-stitch-card rounded-[22px] p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="mt-1 h-5 w-5 text-[#B3FF6A]" />
                        <p className="text-sm font-semibold leading-relaxed text-[#BFCAAF]">
                          Данные о здоровье не покидают устройство без твоего разрешения.
                        </p>
                      </div>
                    </div>
                  </div>
                </Step>
              )}

              {step === 7 && (
                <Step title="Готово. Mira настроена" body="Сегодня ты увидишь день цикла, быстрый лог и путь к отчёту врачу.">
                  <div className="mt-8 space-y-3">
                    {[
                      ["Today", "короткая сводка дня"],
                      ["Track", "медицинские факты и заметки"],
                      ["Report", "данные врачу с приватностью"],
                    ].map(([title, body]) => (
                      <div key={title} className="mira-stitch-card flex items-center justify-between rounded-[20px] p-4">
                        <div>
                          <p className="text-base font-black text-[#F5F0ED]">{title}</p>
                          <p className="mt-1 text-sm font-semibold text-[#B7AAA4]">{body}</p>
                        </div>
                        <Check className="h-5 w-5 text-[#B3FF6A]" />
                      </div>
                    ))}
                  </div>
                </Step>
              )}
            </motion.section>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={back}
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#2E2826] bg-[#1D1816] text-[#F5F0ED] active:scale-95"
              aria-label="Назад"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          {step < totalSteps - 1 ? (
            <Button className="h-16 flex-1 rounded-full text-lg" onClick={next} disabled={!canGoNext}>
              Далее <ArrowRight className="h-5 w-5" />
            </Button>
          ) : (
            <Button className="h-16 flex-1 rounded-full text-lg" onClick={finish}>
              Начать <ArrowRight className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}

function Step({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="mira-stitch-title text-[38px] font-black leading-[1.08] tracking-tight text-[#F5F0ED]">{title}</h1>
      <p className="mt-5 text-xl font-medium leading-relaxed text-[#BFCAAF]">{body}</p>
      {children}
    </div>
  );
}

function ChoiceGrid({ children }: { children: React.ReactNode }) {
  return <div className="mt-8 grid grid-cols-2 gap-3">{children}</div>;
}

function ChoiceTile({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-20 rounded-[22px] border p-4 text-left text-lg font-black transition active:scale-[0.98] ${
        active ? "border-[#B3FF6A] bg-[#B3FF6A] text-[#11100F]" : "border-[#2E2826] bg-[#1D1816] text-[#F5F0ED]"
      }`}
    >
      {children}
    </button>
  );
}

function LargeTile({
  active,
  icon: Icon,
  title,
  body,
  tone = "lime",
  onClick,
}: {
  active: boolean;
  icon: typeof CalendarDays;
  title: string;
  body?: string;
  tone?: "lime" | "pink";
  onClick: () => void;
}) {
  const accent = tone === "pink" ? "#FFB0CE" : "#B3FF6A";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[132px] rounded-[22px] border p-4 text-left transition active:scale-[0.98] ${
        active ? "border-[#B3FF6A] bg-[#223018]" : "border-[#2E2826] bg-[#1D1816]"
      }`}
    >
      <Icon className="mb-6 h-8 w-8" style={{ color: accent }} />
      <p className="text-lg font-black leading-tight text-[#F5F0ED]">{title}</p>
      {body && <p className="mt-2 text-xs font-semibold leading-snug text-[#B7AAA4]">{body}</p>}
    </button>
  );
}

function PrivacyToggle({ title, body, checked, onClick }: { title: string; body: string; checked: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mira-stitch-card flex w-full items-center gap-4 rounded-[22px] p-4 text-left active:scale-[0.99]">
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${checked ? "border-[#B3FF6A] bg-[#B3FF6A] text-[#11100F]" : "border-[#404A35] text-transparent"}`}>
        <Check className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-black text-[#F5F0ED]">{title}</span>
        <span className="mt-1 block text-sm font-semibold leading-snug text-[#B7AAA4]">{body}</span>
      </span>
    </button>
  );
}
