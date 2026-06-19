"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  ChartNoAxesCombined,
  ClipboardCheck,
  Dumbbell,
  HeartPulse,
  Moon,
  Salad,
  Sparkles,
  UserRound
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  buildDailyPlan,
  buildWorkout,
  getResourceToday,
  type CheckInState,
  type GymState,
  type OnboardingState,
  type WorkoutExercise
} from "@/lib/recommendations";
import { cn } from "@/lib/utils";

const goals = ["Похудеть", "Подтянуть тело", "Больше энергии", "Снизить стресс", "Чувствовать баланс"];
const checkInSymptoms = [
  "спазмы",
  "головная боль",
  "акне",
  "вздутие",
  "тяга",
  "раздражительность",
  "тревожность",
  "усталость",
  "выделения",
  "низкое либидо",
  "высокое либидо"
];
const painAreas = ["Голова", "Шея", "Плечи", "Поясница", "Живот", "Таз", "Колени", "Другое"];
const nav = [
  { id: "today", label: "Сегодня", icon: Sparkles },
  { id: "calendar", label: "Календарь", icon: CalendarDays },
  { id: "workouts", label: "Тренировки", icon: Dumbbell },
  { id: "nutrition", label: "Питание", icon: Salad },
  { id: "analytics", label: "Аналитика", icon: ChartNoAxesCombined }
] as const;

const defaultProfile: OnboardingState = {
  goal: "Подтянуть тело",
  periodStart: new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10),
  cycleLength: 28,
  cycleRegularity: "Регулярный",
  trainingPlace: "Зал",
  level: "Новичок",
  workoutsPerWeek: 3,
  sleepQuality: "Нормально",
  stressLevel: 5,
  activityLevel: "Средняя"
};

const defaultCheckIn: CheckInState = {
  energy: 6,
  sleep: "Нормально",
  stress: 4,
  mood: 7,
  painLevel: 0,
  painAreas: [],
  workload: "Обычная",
  symptoms: ["усталость"],
  note: ""
};

const defaultGym: GymState = {
  energy: "Нормально",
  time: "25 мин",
  goal: "Ноги и ягодицы"
};

export default function MiraMvp() {
  const [started, setStarted] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [step, setStep] = useState(0);
  const [active, setActive] = useState<(typeof nav)[number]["id"]>("today");
  const [profile, setProfile] = useState(defaultProfile);
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [gym, setGym] = useState(defaultGym);
  const [profileOpen, setProfileOpen] = useState(false);

  const plan = useMemo(() => buildDailyPlan(profile, checkIn), [profile, checkIn]);

  if (!started) {
    return <Landing onStart={() => setStarted(true)} />;
  }

  if (!onboarded) {
    return (
      <Onboarding
        profile={profile}
        setProfile={setProfile}
        step={step}
        setStep={setStep}
        onDone={() => setOnboarded(true)}
      />
    );
  }

  return (
    <main className="min-h-screen px-4 py-5 text-mira-text">
      <div className="mx-auto max-w-md">
        <AppHeader onOpenProfile={() => setProfileOpen(true)} />

        {profileOpen ? (
          <ProfileScreen
            profile={profile}
            onClose={() => setProfileOpen(false)}
            onRestart={() => {
              setProfile(defaultProfile);
              setCheckIn(defaultCheckIn);
              setGym(defaultGym);
              setStep(0);
              setOnboarded(false);
              setProfileOpen(false);
            }}
          />
        ) : (
          <motion.section
            key={active}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="pb-28"
          >
            {active === "today" && (
              <TodayScreen
                plan={plan}
                profile={profile}
                checkIn={checkIn}
                setCheckIn={setCheckIn}
                onWorkouts={() => setActive("workouts")}
                onNutrition={() => setActive("nutrition")}
              />
            )}
            {active === "calendar" && <CalendarScreen profile={profile} plan={plan} />}
            {active === "workouts" && (
              <WorkoutScreen
                profile={profile}
                checkIn={checkIn}
                gym={gym}
                setGym={setGym}
              />
            )}
            {active === "nutrition" && <NutritionScreen checkIn={checkIn} plan={plan} />}
            {active === "analytics" && <AnalyticsScreen plan={plan} checkIn={checkIn} />}
          </motion.section>
        )}

        <BottomNav active={active} setActive={setActive} />
      </div>
    </main>
  );
}

function Landing({ onStart }: { onStart: () => void }) {
  return (
    <main className="soft-grid min-h-screen overflow-hidden px-5 py-6 text-mira-text">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:grid lg:grid-cols-[1fr_420px] lg:items-center">
        <section className="pt-6 lg:pt-16">
          <Badge className="mb-6 border-mira-primary/15 bg-white/80 text-mira-primary">
            ИИ-коуч для тела на каждый день
          </Badge>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.08em] sm:text-7xl"
          >
            Что лучше для моего тела сегодня?
          </motion.h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-mira-muted">
            Mira превращает цикл, энергию, сон, стресс, настроение и историю тренировок
            в спокойный персональный план дня. Меньше трекинга. Больше ясности.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={onStart}>
              Начать настройку за 3 минуты <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="secondary" onClick={onStart}>
              Посмотреть демо-план
            </Button>
          </div>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {["Без диагнозов", "Без одержимости калориями", "Решения на день"].map((item) => (
              <Card key={item} className="p-4 text-sm font-bold">
                <span className="font-bold">{item}</span>
              </Card>
            ))}
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 24, rotate: 2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.5 }}
          className="phone-shell relative mx-auto w-full max-w-sm rounded-[3rem] border border-white/70 bg-white/70 p-3 backdrop-blur"
        >
          <div className="rounded-[2.4rem] bg-mira-background p-5">
            <div className="mb-6 flex items-center justify-between">
              <LogoMark />
              <Badge>Сегодня</Badge>
            </div>
            <Card className="bg-mira-primary p-6 text-white">
              <p className="text-sm text-white/75">Твоё тело сегодня</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">В балансе</h2>
              <p className="mt-3 text-sm leading-6 text-white/80">
                Умеренное движение, белок раньше и более спокойный вечер.
              </p>
            </Card>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric label="Энергия" value="6/10" />
              <Metric label="Стресс" value="4/10" />
              <Metric label="Сон" value="Нормально" />
              <Metric label="Цикл" value="День 14" />
            </div>
            <Button className="mt-5 w-full" size="lg" onClick={onStart}>
              Я в зале
            </Button>
          </div>
        </motion.section>
      </div>
    </main>
  );
}

function Onboarding({
  profile,
  setProfile,
  step,
  setStep,
  onDone
}: {
  profile: OnboardingState;
  setProfile: (profile: OnboardingState) => void;
  step: number;
  setStep: (step: number) => void;
  onDone: () => void;
}) {
  const progress = ((step + 1) / 4) * 100;

  return (
    <main className="min-h-screen px-5 py-6 text-mira-text">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <LogoMark />
          <Badge>{step + 1} из 4</Badge>
        </div>
        <div className="mb-8 h-2 rounded-full bg-white">
          <div
            className="h-full rounded-full bg-mira-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <Card className="min-h-[560px] p-6">
          {step === 0 && (
            <StepShell
              eyebrow="Цель"
              title="Какая у тебя главная цель?"
              subtitle="Mira использует это как направление, а не как жёсткий план."
            >
              <ChoiceGrid
                options={goals}
                value={profile.goal}
                onChange={(goal) => setProfile({ ...profile, goal })}
              />
            </StepShell>
          )}

          {step === 1 && (
            <StepShell
              eyebrow="Цикл"
              title="Где ты сейчас в своём ритме?"
              subtitle="Мы спрашиваем только базовое. Это помогает не давать всем одинаковые тренировки."
            >
              <Field label="Первый день последней менструации">
                <input
                  className="w-full rounded-2xl border border-black/5 bg-mira-background px-4 py-3"
                  type="date"
                  value={profile.periodStart}
                  onChange={(event) => setProfile({ ...profile, periodStart: event.target.value })}
                />
              </Field>
              <Field label="Средняя длина цикла">
                <input
                  className="w-full rounded-2xl border border-black/5 bg-mira-background px-4 py-3"
                  type="number"
                  min={21}
                  max={45}
                  value={profile.cycleLength}
                  onChange={(event) =>
                    setProfile({ ...profile, cycleLength: Number(event.target.value) })
                  }
                />
              </Field>
              <ChoiceGrid
                options={["Регулярный", "Нерегулярный"]}
                value={profile.cycleRegularity}
                onChange={(cycleRegularity) =>
                  setProfile({
                    ...profile,
                    cycleRegularity: cycleRegularity as OnboardingState["cycleRegularity"]
                  })
                }
              />
            </StepShell>
          )}

          {step === 2 && (
            <StepShell
              eyebrow="Тренировки"
              title="Как тебе комфортнее тренироваться?"
              subtitle="Прототип собирает план на сегодня, а не жёсткую программу на месяц."
            >
              <Field label="Где тренируешься">
                <ChoiceGrid
                  options={["Зал", "Дом"]}
                  value={profile.trainingPlace}
                  onChange={(trainingPlace) =>
                    setProfile({
                      ...profile,
                      trainingPlace: trainingPlace as OnboardingState["trainingPlace"]
                    })
                  }
                />
              </Field>
              <Field label="Уровень подготовки">
                <ChoiceGrid
                  options={["Новичок", "Средний", "Продвинутый"]}
                  value={profile.level}
                  onChange={(level) =>
                    setProfile({ ...profile, level: level as OnboardingState["level"] })
                  }
                />
              </Field>
              <Field label={`Тренировок в неделю: ${profile.workoutsPerWeek}`}>
                <input
                  className="slider w-full"
                  type="range"
                  min={1}
                  max={6}
                  value={profile.workoutsPerWeek}
                  onChange={(event) =>
                    setProfile({ ...profile, workoutsPerWeek: Number(event.target.value) })
                  }
                />
              </Field>
            </StepShell>
          )}

          {step === 3 && (
            <StepShell
              eyebrow="Образ жизни"
              title="Как обычно чувствует себя твоё тело?"
              subtitle="Это помогает Mira сделать первую рекомендацию более персональной."
            >
              <Field label="Качество сна">
                <ChoiceGrid
                  options={["Плохо", "Нормально", "Хорошо"]}
                  value={profile.sleepQuality}
                  onChange={(sleepQuality) =>
                    setProfile({
                      ...profile,
                      sleepQuality: sleepQuality as OnboardingState["sleepQuality"]
                    })
                  }
                />
              </Field>
              <Field label={`Уровень стресса: ${profile.stressLevel}/10`}>
                <input
                  className="slider w-full"
                  type="range"
                  min={1}
                  max={10}
                  value={profile.stressLevel}
                  onChange={(event) =>
                    setProfile({ ...profile, stressLevel: Number(event.target.value) })
                  }
                />
              </Field>
              <Field label="Активность в течение дня">
                <ChoiceGrid
                  options={["Низкая", "Средняя", "Высокая"]}
                  value={profile.activityLevel}
                  onChange={(activityLevel) =>
                    setProfile({
                      ...profile,
                      activityLevel: activityLevel as OnboardingState["activityLevel"]
                    })
                  }
                />
              </Field>
            </StepShell>
          )}
        </Card>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>
            Назад
          </Button>
          <Button onClick={() => (step === 3 ? onDone() : setStep(step + 1))}>
            {step === 3 ? "Показать мой план" : "Продолжить"}
          </Button>
        </div>
      </div>
    </main>
  );
}

function TodayScreen({
  plan,
  profile,
  checkIn,
  setCheckIn,
  onWorkouts,
  onNutrition
}: {
  plan: ReturnType<typeof buildDailyPlan>;
  profile: OnboardingState;
  checkIn: CheckInState;
  setCheckIn: (checkIn: CheckInState) => void;
  onWorkouts: () => void;
  onNutrition: () => void;
}) {
  const [checkInOpen, setCheckInOpen] = useState(false);
  const resource = getResourceToday(checkIn);
  const nextPeriodDate = new Date();
  nextPeriodDate.setDate(nextPeriodDate.getDate() + profile.cycleLength - plan.cycleDay + 1);
  const nextPeriod = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(nextPeriodDate);
  const today = new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date());
  const confidence = profile.cycleRegularity === "Регулярный" ? "Умеренная" : "Низкая";
  const workRecommendation =
    checkIn.workload === "Высокая"
      ? "Выбери одну главную задачу и добавь короткие паузы между блоками работы."
      : "Сохрани спокойный темп и оставь небольшой запас энергии на вечер.";
  const insight = checkIn.sleep === "Плохо"
      ? "Сон сегодня может влиять на ощущение ресурса. Мягкий темп - это тоже поддержка."
    : checkIn.symptoms.length
      ? "Отмеченные симптомы важнее предположений по календарю, поэтому план остаётся гибким."
      : checkIn.note
        ? `Твоя заметка на сегодня: ${checkIn.note}`
      : "Стабильный ритм и умеренная нагрузка могут поддержать ощущение ресурса сегодня.";

  return (
    <div className="space-y-4">
      <section className="px-1 pt-1">
        <p className="capitalize text-sm font-semibold text-mira-muted">{today}</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.06em]">Доброе утро, Алина</h1>
        <p className="mt-2 text-sm leading-6 text-mira-muted">Посмотрим на твой сегодняшний контекст без лишнего давления.</p>
      </section>

      <Card className="bg-[#fff6f4]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-mira-muted">Цикл</p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">День {plan.cycleDay}</h2>
            <p className="mt-1 text-sm text-mira-primary">{plan.phase} фаза</p>
          </div>
          <CalendarDays className="h-6 w-6 text-mira-primary" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-black/5 pt-4 text-sm">
          <div>
            <p className="text-mira-muted">Следующая менструация</p>
            <p className="mt-1 font-bold text-mira-text">Ориентировочно {nextPeriod}</p>
          </div>
          <div>
            <p className="text-mira-muted">Уверенность прогноза</p>
            <p className="mt-1 font-bold text-mira-text">{confidence}</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-mira-muted">Ресурс сегодня</p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">{resource.level}</h2>
          </div>
          <Badge className="bg-mira-success text-mira-text">{Math.max(0, resource.score)} из 15</Badge>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {resource.factors.map((factor) => (
            <span key={factor} className="rounded-full bg-mira-background px-3 py-2 text-xs font-semibold text-mira-muted">
              {factor}
            </span>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="bg-mira-ink p-5 text-white">
          <p className="text-sm font-semibold text-white/60">Главная рекомендация</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Поддерживающий план на сегодня</h2>
          <p className="mt-2 text-sm leading-6 text-white/70">{plan.movement.reason}</p>
        </div>
        <div className="divide-y divide-black/5">
          <TodayRecommendation icon={<BriefcaseBusiness />} label="Работа" text={workRecommendation} />
          <TodayRecommendation icon={<Dumbbell />} label="Тренировка" text={`${plan.movement.title} - ${plan.movement.detail}.`} />
          <TodayRecommendation icon={<HeartPulse />} label="Питание" text={`${plan.nutrition.title}. ${plan.nutrition.detail}.`} />
          <TodayRecommendation icon={<Moon />} label="Восстановление" text={`${plan.recovery.title}. ${plan.recovery.detail}.`} />
        </div>
      </Card>

      <section>
        <p className="mb-3 px-1 text-sm font-semibold text-mira-muted">Быстрые действия</p>
        <div className="grid grid-cols-2 gap-3">
          <Button className="h-auto min-h-24 flex-col whitespace-normal px-3 py-4 text-center" variant="secondary" onClick={() => setCheckInOpen(true)}>
            <ClipboardCheck className="h-5 w-5 text-mira-primary" />
            Чек-ин
          </Button>
          <Button className="h-auto min-h-24 flex-col whitespace-normal px-3 py-4 text-center" variant="secondary" onClick={onWorkouts}>
            <Dumbbell className="h-5 w-5 text-mira-primary" />
            Собрать тренировку
          </Button>
          <Button className="h-auto min-h-24 flex-col whitespace-normal px-3 py-4 text-center" variant="secondary" onClick={onNutrition}>
            <Camera className="h-5 w-5 text-mira-primary" />
            Сфотографировать еду
          </Button>
          <Button className="h-auto min-h-24 flex-col whitespace-normal px-3 py-4 text-center" variant="secondary" onClick={() => setCheckInOpen(true)}>
            <BriefcaseBusiness className="h-5 w-5 text-mira-primary" />
            Добавить контекст работы
          </Button>
        </div>
      </section>

      {checkInOpen && (
        <DailyCheckIn
          initial={checkIn}
          onClose={() => setCheckInOpen(false)}
          onSave={(value) => {
            setCheckIn(value);
            setCheckInOpen(false);
          }}
        />
      )}

      <Card className="bg-[#f2f7f1]">
        <p className="text-sm font-semibold text-mira-muted">Небольшое наблюдение</p>
        <p className="mt-2 text-sm leading-6 text-mira-text">{insight}</p>
      </Card>
    </div>
  );
}

function TodayRecommendation({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div className="flex gap-3 px-5 py-4">
      <div className="mt-0.5 text-mira-primary [&_svg]:h-4 [&_svg]:w-4">{icon}</div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-mira-muted">{label}</p>
        <p className="mt-1 text-sm leading-6 text-mira-text">{text}</p>
      </div>
    </div>
  );
}

function DailyCheckIn({
  initial,
  onClose,
  onSave
}: {
  initial: CheckInState;
  onClose: () => void;
  onSave: (checkIn: CheckInState) => void;
}) {
  const [draft, setDraft] = useState(initial);

  const toggleListValue = (key: "symptoms" | "painAreas", value: string) => {
    setDraft((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value]
    }));
  };

  return (
    <Card className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-mira-muted">Быстрый чек-ин</p>
          <h2 className="text-xl font-black tracking-[-0.04em]">Как ты сегодня?</h2>
          <p className="mt-1 text-sm leading-5 text-mira-muted">Обычно хватает 30-60 секунд. Отмечай только то, что сейчас важно.</p>
        </div>
        <Button aria-label="Закрыть чек-ин" className="h-10 w-10 shrink-0 p-0" variant="ghost" onClick={onClose}>
          <span aria-hidden="true">×</span>
        </Button>
      </div>

      <div className="space-y-5">
        <Field label={`Энергия: ${draft.energy}/10`}>
          <input
            className="slider w-full"
            type="range"
            min={1}
            max={10}
            value={draft.energy}
            onChange={(event) => setDraft({ ...draft, energy: Number(event.target.value) })}
          />
        </Field>
        <Field label={`Настроение: ${draft.mood}/10`}>
          <input
            className="slider w-full"
            type="range"
            min={1}
            max={10}
            value={draft.mood}
            onChange={(event) => setDraft({ ...draft, mood: Number(event.target.value) })}
          />
        </Field>
        <Field label="Сон">
          <ChoiceGrid
            options={["Плохо", "Нормально", "Хорошо"]}
            value={draft.sleep}
            onChange={(sleep) => setDraft({ ...draft, sleep: sleep as CheckInState["sleep"] })}
          />
        </Field>
        <Field label={`Боль: ${draft.painLevel}/10`}>
          <input
            className="slider w-full"
            type="range"
            min={0}
            max={10}
            value={draft.painLevel}
            onChange={(event) => setDraft({ ...draft, painLevel: Number(event.target.value) })}
          />
        </Field>
        {draft.painLevel > 0 && (
          <Field label="Где ощущается боль или дискомфорт?">
            <div className="flex flex-wrap gap-2">
              {painAreas.map((area) => (
                <button
                  key={area}
                  className={cn(
                    "rounded-full border px-3 py-2 text-sm font-semibold transition",
                    draft.painAreas.includes(area)
                      ? "border-mira-primary bg-mira-primary text-white"
                      : "border-black/5 bg-mira-background text-mira-muted"
                  )}
                  onClick={() => toggleListValue("painAreas", area)}
                  type="button"
                >
                  {area}
                </button>
              ))}
            </div>
          </Field>
        )}
        <Field label="Рабочая нагрузка">
          <ChoiceGrid
            options={["Лёгкая", "Обычная", "Высокая"]}
            value={draft.workload}
            onChange={(workload) => setDraft({ ...draft, workload: workload as CheckInState["workload"] })}
          />
        </Field>
        <Field label={`Стресс: ${draft.stress}/10`}>
          <input
            className="slider w-full"
            type="range"
            min={1}
            max={10}
            value={draft.stress}
            onChange={(event) => setDraft({ ...draft, stress: Number(event.target.value) })}
          />
        </Field>
        <Field label="Симптомы, если хочется отметить">
          <div className="flex flex-wrap gap-2">
            {checkInSymptoms.map((symptom) => (
              <button
                key={symptom}
                className={cn(
                  "rounded-full border px-3 py-2 text-sm font-semibold transition",
                  draft.symptoms.includes(symptom)
                    ? "border-mira-primary bg-mira-primary text-white"
                    : "border-black/5 bg-mira-background text-mira-muted"
                )}
                onClick={() => toggleListValue("symptoms", symptom)}
                type="button"
              >
                {symptom}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Заметка (необязательно)">
          <textarea
            className="min-h-20 w-full resize-y rounded-2xl border border-black/5 bg-mira-background px-4 py-3 text-sm text-mira-text outline-none transition focus:border-mira-primary"
            maxLength={280}
            placeholder="Например: много встреч, хочу оставить вечер спокойнее"
            value={draft.note}
            onChange={(event) => setDraft({ ...draft, note: event.target.value })}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-1">
        <Button variant="secondary" onClick={onClose}>Отмена</Button>
        <Button onClick={() => onSave(draft)}>Сохранить</Button>
      </div>
    </Card>
  );
}

function WorkoutScreen({
  profile,
  checkIn,
  gym,
  setGym
}: {
  profile: OnboardingState;
  checkIn: CheckInState;
  gym: GymState;
  setGym: (gym: GymState) => void;
}) {
  const recommendation = useMemo(() => buildWorkout(profile, checkIn, gym), [profile, checkIn, gym]);
  const resource = getResourceToday(checkIn);
  const [generated, setGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [safetyMessage, setSafetyMessage] = useState("");
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const highPain = checkIn.painLevel >= 5;

  const updateGym = (next: Partial<GymState>) => {
    setGym({ ...gym, ...next });
    setGenerated(false);
    setIsGenerating(false);
    setStopped(false);
    setSafetyMessage("");
  };

  const generateWorkout = () => {
    setIsGenerating(true);
    window.setTimeout(() => {
      setExercises(recommendation.exercises);
      setGenerated(true);
      setStopped(false);
      setSafetyMessage(highPain ? "Выбран режим восстановления без силовой нагрузки." : "План собран под твой сегодняшний контекст.");
      setIsGenerating(false);
    }, 320);
  };

  const replaceExercise = (index: number, softer = false) => {
    setExercises((current) =>
      current.map((exercise, exerciseIndex) =>
        exerciseIndex === index
          ? {
              name: softer ? "Мягкая альтернатива: спокойная ходьба" : "Альтернатива: отведение бедра с лентой",
              prescription: softer ? "5-8 минут" : "2 × 12 / сторона",
              rest: "По самочувствию",
              cue: "Двигайся в комфортном темпе и остановись, если ощущения усиливаются."
            }
          : exercise
      )
    );
  };

  return (
    <div className="space-y-4">
      <Card className="bg-mira-ink text-white">
        <p className="text-sm font-semibold text-white/60">Тренировка на сегодня</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.06em]">{highPain ? "Сегодня - восстановление" : "Подберём спокойную нагрузку"}</h1>
        <p className="mt-3 text-sm leading-6 text-white/65">
          {highPain
            ? "Ты отметила высокий уровень боли, поэтому силовую нагрузку сегодня исключаем."
            : "Mira использует твой сегодняшний контекст, а не заставляет следовать жёсткой программе."}
        </p>
      </Card>

      <Card className="space-y-4">
        <p className="text-sm font-semibold text-mira-muted">Почему именно такой план</p>
        <div className="flex flex-wrap gap-2">
          {[
            `Цикл: ${buildDailyPlan(profile, checkIn).phase}`,
            `Ресурс: ${resource.level}`,
            checkIn.painLevel ? `Боль: ${checkIn.painLevel}/10` : "Боль не отмечена",
            checkIn.symptoms.length ? `Симптомы: ${checkIn.symptoms.join(", ")}` : "Симптомы не отмечены",
            `Работа: ${checkIn.workload.toLowerCase()}`
          ].map((factor) => (
            <span key={factor} className="rounded-full bg-mira-background px-3 py-2 text-xs font-semibold text-mira-muted">
              {factor}
            </span>
          ))}
        </div>
        <p className="text-sm leading-6 text-mira-muted">Доступное время: {gym.time}. План можно изменить в любой момент.</p>
      </Card>

      <Card className="space-y-5">
        <Field label="Сколько времени есть сегодня?">
          <ChoiceGrid
            options={["12 мин", "25 мин", "40 мин"]}
            value={gym.time}
            onChange={(time) => updateGym({ time: time as GymState["time"] })}
          />
        </Field>
        <Field label="Как сейчас ощущается энергия?">
          <ChoiceGrid
            options={["Много энергии", "Нормально", "Устала"]}
            value={gym.energy}
            onChange={(energy) => updateGym({ energy: energy as GymState["energy"] })}
          />
        </Field>
        <Field label="Что сейчас хочется от движения?">
          <ChoiceGrid
            options={["Ноги и ягодицы", "Всё тело", "Мягкое кардио", "Просто подвигаться"]}
            value={gym.goal}
            onChange={(goal) => updateGym({ goal: goal as GymState["goal"] })}
          />
        </Field>
        <Button className="w-full" disabled={isGenerating} size="lg" onClick={generateWorkout}>
          {isGenerating ? "Собираем план..." : "Собрать тренировку"} <ArrowRight className="h-4 w-4" />
        </Button>
      </Card>

      {isGenerating && (
        <div aria-live="polite" className="rounded-2xl bg-mira-background px-4 py-3 text-sm text-mira-muted" role="status">
          Учитываем время, ресурс и отмеченные ощущения.
        </div>
      )}

      {generated && (
        <Card className="overflow-hidden p-0">
          <div className="bg-mira-primary p-5 text-white">
            <Badge className="bg-white/18 text-white">Демо-рекомендация</Badge>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.05em]">{recommendation.title}</h2>
            <p className="mt-2 text-sm text-white/80">{recommendation.time} · {recommendation.intensity}</p>
          </div>
          <div className="space-y-4 p-5">
            <p className="rounded-2xl bg-mira-background p-4 text-sm leading-6 text-mira-muted">{recommendation.explanation}</p>
            {safetyMessage && <p className="text-sm font-semibold text-mira-primary">{safetyMessage}</p>}
            {!stopped && (
              <>
                <WorkoutBlock title="Разминка" items={[recommendation.warmup]} />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.16em] text-mira-muted">Основная часть</h3>
                  <div className="mt-2 space-y-2">
                    {exercises.map((exercise, index) => (
                      <WorkoutExerciseCard
                        key={`${exercise.name}-${index}`}
                        exercise={exercise}
                        index={index}
                        onReplace={() => replaceExercise(index)}
                      />
                    ))}
                  </div>
                </div>
                <WorkoutBlock title="Завершение" items={[recommendation.cooldown]} />
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button className="h-auto min-h-16 whitespace-normal px-3 py-3 text-center" variant="outline" onClick={() => {
                    replaceExercise(0, true);
                    setSafetyMessage("Первое упражнение заменено на более мягкий вариант.");
                  }}>
                    Это больно
                  </Button>
                  <Button className="h-auto min-h-16 whitespace-normal px-3 py-3 text-center" variant="outline" onClick={() => {
                    setExercises((current) => current.slice(0, Math.max(1, current.length - 1)));
                    setSafetyMessage("Уменьшили объём. Оставь только комфортные движения.");
                  }}>
                    Сделать легче
                  </Button>
                  <Button className="h-auto min-h-16 whitespace-normal px-3 py-3 text-center" variant="outline" onClick={() => {
                    replaceExercise(Math.max(0, exercises.length - 1));
                    setSafetyMessage("Последнее упражнение заменено альтернативой.");
                  }}>
                    Заменить упражнение
                  </Button>
                  <Button className="h-auto min-h-16 whitespace-normal px-3 py-3 text-center" variant="outline" onClick={() => {
                    setStopped(true);
                    setSafetyMessage("Тренировка остановлена. Сегодня можно выбрать отдых или комфортную прогулку.");
                  }}>
                    Остановить тренировку
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      <Card className="border-dashed bg-white/60">
        <p className="text-sm font-semibold text-mira-muted">История тренировок</p>
        <p className="mt-2 text-sm leading-6 text-mira-muted">Здесь появятся завершённые тренировки и заметки о том, как они ощущались.</p>
      </Card>
    </div>
  );
}

function WorkoutExerciseCard({
  exercise,
  index,
  onReplace
}: {
  exercise: WorkoutExercise;
  index: number;
  onReplace: () => void;
}) {
  return (
    <div className="rounded-2xl bg-mira-background p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-xs font-black text-mira-primary">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-mira-text">{exercise.name}</h4>
          <p className="mt-1 text-sm text-mira-primary">{exercise.prescription} · отдых {exercise.rest}</p>
          <p className="mt-2 text-xs leading-5 text-mira-muted">{exercise.cue}</p>
          <button className="mt-3 text-xs font-bold text-mira-primary" onClick={onReplace} type="button">Заменить</button>
        </div>
      </div>
    </div>
  );
}

type CalendarLayer =
  | "period"
  | "predicted-period"
  | "fertile"
  | "ovulation"
  | "symptoms"
  | "mood"
  | "energy"
  | "workload"
  | "workouts"
  | "nutrition"
  | "notes";

type CalendarDay = {
  day: number;
  cycleDay: number;
  phase: string;
  isPeriod: boolean;
  isPredictedPeriod: boolean;
  isFertile: boolean;
  isOvulation: boolean;
  symptoms: string[];
  mood: string;
  energy: number;
  sleep: string;
  workload: string;
  workout: string;
  nutrition: string;
  note?: string;
  recommendation: string;
};

const calendarLayers: Array<{ id: CalendarLayer; label: string; dot: string }> = [
  { id: "period", label: "Менструация", dot: "bg-mira-cycle" },
  { id: "predicted-period", label: "Прогноз менструации", dot: "border border-dashed border-mira-cycle" },
  { id: "fertile", label: "Фертильное окно", dot: "bg-[#d9d4ee]" },
  { id: "ovulation", label: "Овуляция", dot: "bg-mira-primary" },
  { id: "symptoms", label: "Симптомы", dot: "bg-[#bc8992]" },
  { id: "mood", label: "Настроение", dot: "bg-[#f0d8ac]" },
  { id: "energy", label: "Энергия", dot: "bg-[#a7c7b0]" },
  { id: "workload", label: "Работа", dot: "bg-[#98a7bb]" },
  { id: "workouts", label: "Тренировки", dot: "bg-mira-ink" },
  { id: "nutrition", label: "Питание", dot: "bg-[#c4b06f]" },
  { id: "notes", label: "Заметки", dot: "bg-[#d9d4ee]" }
];

function CalendarScreen({
  profile,
  plan
}: {
  profile: OnboardingState;
  plan: ReturnType<typeof buildDailyPlan>;
}) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const currentDay = today.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const [selectedDay, setSelectedDay] = useState(currentDay);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeLayers, setActiveLayers] = useState<CalendarLayer[]>([
    "period",
    "predicted-period",
    "fertile",
    "ovulation",
    "symptoms",
    "workouts"
  ]);
  const calendarDays = useMemo(
    () => Array.from({ length: daysInMonth }, (_, index) => createDemoCalendarDay(index + 1, currentDay, plan, profile)),
    [currentDay, daysInMonth, plan, profile]
  );
  const selected = calendarDays[selectedDay - 1];
  const selectedDate = new Date(year, month, selectedDay);
  const weekStart = Math.max(1, selectedDay - ((selectedDate.getDay() + 6) % 7));
  const weekDays = calendarDays.slice(weekStart - 1, Math.min(weekStart + 6, daysInMonth));
  const monthName = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(today);

  const toggleLayer = (layer: CalendarLayer) => {
    setActiveLayers((current) =>
      current.includes(layer) ? current.filter((item) => item !== layer) : [...current, layer]
    );
  };

  return (
    <div className="space-y-4 pb-12">
      <section className="px-1">
        <p className="text-sm font-semibold text-mira-muted">Календарь тела</p>
        <h1 className="mt-1 capitalize text-3xl font-black tracking-[-0.05em]">{monthName}</h1>
        <p className="mt-2 text-sm leading-6 text-mira-muted">Слои помогают заметить контекст. Они не являются медицинским прогнозом.</p>
      </section>

      <section className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {calendarLayers.map((layer) => {
          const active = activeLayers.includes(layer.id);
          return (
            <button
              key={layer.id}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition",
                active ? "border-mira-primary bg-white text-mira-text shadow-soft" : "border-transparent bg-white/50 text-mira-muted"
              )}
              onClick={() => toggleLayer(layer.id)}
              type="button"
            >
              <span className={cn("h-2.5 w-2.5 rounded-full", layer.dot)} />
              {layer.label}
            </button>
          );
        })}
      </section>

      {activeLayers.length === 0 && (
        <div aria-live="polite" className="rounded-2xl bg-mira-background px-4 py-3 text-sm leading-6 text-mira-muted" role="status">
          Все слои скрыты. Включи один или несколько, чтобы увидеть отметки в календаре.
        </div>
      )}

      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-bold text-mira-text">Неделя вокруг выбранного дня</p>
          <Badge className="bg-mira-background text-mira-muted">День {selected.cycleDay}</Badge>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => (
            <button
              key={day.day}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center rounded-2xl text-xs font-bold transition",
                day.day === selectedDay ? "bg-mira-ink text-white" : "bg-mira-background text-mira-text"
              )}
              onClick={() => {
                setSelectedDay(day.day);
                setSheetOpen(true);
              }}
              type="button"
            >
              <span className="text-[10px] opacity-60">{weekdayShort(year, month, day.day)}</span>
              <span className="mt-1 text-sm">{day.day}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="grid grid-cols-7 gap-y-3 text-center">
          {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
            <span key={day} className="text-[11px] font-bold text-mira-muted">{day}</span>
          ))}
          {Array.from({ length: monthOffset }).map((_, index) => <span key={`empty-${index}`} />)}
          {calendarDays.map((day) => (
            <CalendarDayButton
              key={day.day}
              activeLayers={activeLayers}
              day={day}
              isSelected={day.day === selectedDay}
              isToday={day.day === currentDay}
              onClick={() => {
                setSelectedDay(day.day);
                setSheetOpen(true);
              }}
            />
          ))}
        </div>
      </Card>

      <p className="px-1 text-xs leading-5 text-mira-muted">
        Данные в этом календаре демонстрационные. Реальные записи и прогнозы появятся после подключения сохранения данных.
      </p>

      {sheetOpen && (
        <CalendarDaySheet
          date={new Date(year, month, selected.day)}
          day={selected}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  );
}

function CalendarDayButton({
  activeLayers,
  day,
  isSelected,
  isToday,
  onClick
}: {
  activeLayers: CalendarLayer[];
  day: CalendarDay;
  isSelected: boolean;
  isToday: boolean;
  onClick: () => void;
}) {
  const visibleLayers = getVisibleCalendarLayers(day, activeLayers);
  const hasPeriodLayer = visibleLayers.includes("period");
  const hasFertileLayer = visibleLayers.includes("fertile");

  return (
    <button
      aria-label={`Открыть ${day.day} число`}
      className={cn(
        "relative grid aspect-square place-items-center rounded-2xl text-sm font-bold transition",
        isSelected ? "bg-mira-ink text-white shadow-soft" : hasPeriodLayer ? "bg-mira-cycle/35 text-mira-text" : "text-mira-text hover:bg-mira-background",
        hasFertileLayer && !isSelected ? "ring-1 ring-[#d9d4ee]" : "",
        isToday && !isSelected ? "border border-mira-primary" : ""
      )}
      onClick={onClick}
      type="button"
    >
      <span>{day.day}</span>
      {visibleLayers.length > 0 && (
        <span className="absolute inset-x-0 bottom-1 flex justify-center gap-0.5">
          {visibleLayers.slice(0, 3).map((layer) => (
            <span key={layer} className={cn("h-1 w-1 rounded-full", calendarLayers.find((item) => item.id === layer)?.dot)} />
          ))}
        </span>
      )}
    </button>
  );
}

function CalendarDaySheet({ date, day, onClose }: { date: Date; day: CalendarDay; onClose: () => void }) {
  const dateLabel = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long" }).format(date);
  const prediction = day.isPeriod
    ? "Отмечена менструация"
    : day.isPredictedPeriod
      ? "Ориентировочное окно следующей менструации"
      : day.isOvulation
        ? "Ориентировочная овуляция"
        : day.isFertile
          ? "Ориентировочное фертильное окно"
          : "Без особой отметки цикла";

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-4 pb-4">
      <Card className="rounded-t-[2rem] border-b-0 bg-white p-5 shadow-[0_-18px_60px_rgba(28,28,30,0.16)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="capitalize text-sm font-semibold text-mira-muted">{dateLabel}</p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">День цикла {day.cycleDay}</h2>
            <p className="mt-1 text-sm text-mira-primary">{day.phase}</p>
          </div>
          <Button aria-label="Закрыть детали дня" className="h-10 w-10 p-0" variant="ghost" onClick={onClose}>
            <span aria-hidden="true">×</span>
          </Button>
        </div>
        <div className="space-y-3 text-sm">
          <CalendarDetail label="Цикл" value={prediction} />
          <CalendarDetail label="Симптомы" value={day.symptoms.length ? day.symptoms.join(", ") : "Не отмечены"} />
          <CalendarDetail label="Состояние" value={`Энергия ${day.energy}/10 · ${day.mood} · сон: ${day.sleep.toLowerCase()}`} />
          <CalendarDetail label="Работа" value={day.workload} />
          <CalendarDetail label="Тренировка" value={day.workout} />
          <CalendarDetail label="Питание" value={day.nutrition} />
          {day.note && <CalendarDetail label="Заметка" value={day.note} />}
        </div>
        <div className="mt-4 rounded-2xl bg-[#f2f7f1] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-mira-muted">Рекомендация на день</p>
          <p className="mt-2 text-sm leading-6 text-mira-text">{day.recommendation}</p>
        </div>
      </Card>
    </div>
  );
}

function CalendarDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-black/5 pb-3 last:border-0 last:pb-0">
      <span className="shrink-0 font-semibold text-mira-muted">{label}</span>
      <span className="text-right leading-5 text-mira-text">{value}</span>
    </div>
  );
}

function createDemoCalendarDay(
  day: number,
  currentDay: number,
  plan: ReturnType<typeof buildDailyPlan>,
  profile: OnboardingState
): CalendarDay {
  const cycleDay = ((plan.cycleDay - 1 + day - currentDay + profile.cycleLength * 2) % profile.cycleLength) + 1;
  const isPeriod = cycleDay <= 5;
  const isPredictedPeriod = cycleDay >= profile.cycleLength - 2;
  const isFertile = cycleDay >= 11 && cycleDay <= 16;
  const isOvulation = cycleDay === 14;
  const symptoms = day % 6 === 0 ? ["усталость"] : day % 9 === 0 ? ["вздутие"] : [];
  const busy = day % 5 === 0;
  const hasWorkout = day % 3 === 0;
  const hasNutrition = day % 2 === 0;
  const energy = symptoms.length ? 5 : busy ? 6 : 7;

  return {
    day,
    cycleDay,
    phase: cycleDay <= 5 ? "Менструальная фаза" : cycleDay <= 12 ? "Фолликулярная фаза" : cycleDay <= 16 ? "Овуляторная фаза" : "Лютеиновая фаза",
    isPeriod,
    isPredictedPeriod,
    isFertile,
    isOvulation,
    symptoms,
    mood: symptoms.length ? "😐" : busy ? "🙂" : "😍",
    energy,
    sleep: busy ? "Нормально" : "Хорошо",
    workload: busy ? "Насыщенный день" : "Спокойный ритм",
    workout: hasWorkout ? "Запланирована мягкая силовая" : "Тренировка не запланирована",
    nutrition: hasNutrition ? "Есть запись о приёме пищи" : "Записей нет",
    note: day % 8 === 0 ? "Хочется оставить вечер свободнее." : undefined,
    recommendation: symptoms.length
      ? "Выбери комфортный темп и оставь возможность сократить нагрузку по ощущениям."
      : busy
        ? "Сделай короткую паузу между рабочими блоками и выбери посильное движение."
        : "Умеренная активность и спокойный вечер могут поддержать сегодняшний ресурс."
  };
}

function getVisibleCalendarLayers(day: CalendarDay, activeLayers: CalendarLayer[]) {
  const available: CalendarLayer[] = [
    ...(day.isPeriod ? ["period" as const] : []),
    ...(day.isPredictedPeriod ? ["predicted-period" as const] : []),
    ...(day.isFertile ? ["fertile" as const] : []),
    ...(day.isOvulation ? ["ovulation" as const] : []),
    ...(day.symptoms.length ? ["symptoms" as const] : []),
    ...(day.mood ? ["mood" as const] : []),
    ...(day.energy ? ["energy" as const] : []),
    ...(day.workload.includes("Насыщенный") ? ["workload" as const] : []),
    ...(day.workout.includes("Запланирована") ? ["workouts" as const] : []),
    ...(day.nutrition.includes("Есть") ? ["nutrition" as const] : []),
    ...(day.note ? ["notes" as const] : [])
  ];

  return available.filter((layer) => activeLayers.includes(layer));
}

function weekdayShort(year: number, month: number, day: number) {
  return new Intl.DateTimeFormat("ru-RU", { weekday: "short" }).format(new Date(year, month, day)).slice(0, 2);
}

const demoMealAnalysis = {
  foods: ["Запечённый лосось", "Рис басмати", "Овощи"],
  calories: "420-560 ккал",
  protein: "28-36 г",
  carbs: "42-58 г",
  fat: "16-24 г",
  confidence: "72%",
  uncertainty: ["размер порции", "количество масла", "соус или заправка"]
};

function NutritionScreen({
  checkIn,
  plan
}: {
  checkIn: CheckInState;
  plan: ReturnType<typeof buildDailyPlan>;
}) {
  const [photoFlowOpen, setPhotoFlowOpen] = useState(false);
  const [analysisVisible, setAnalysisVisible] = useState(false);
  const recommendation = checkIn.symptoms.includes("тяга")
    ? "Для следующего приёма еды можно добавить привычный источник белка и что-то с клетчаткой. Это мягкая поддержка энергии, а не правило."
    : checkIn.energy <= 4
      ? "Сегодня может быть полезно не откладывать следующий приём пищи надолго и выбрать то, что ощущается сытным и доступным."
      : plan.phase === "Лютеиновая" || plan.phase === "Поздняя лютеиновая"
        ? "Аппетит и предпочтения могут меняться в течение цикла. Ориентируйся на голод и удобный для тебя ритм."
        : "Следующий приём пищи можно собрать вокруг того, что поддержит твой ритм: белок, углеводы, овощи или фрукты по желанию."

  return (
    <div className="space-y-4 pb-8">
      <section className="px-1">
        <p className="text-sm font-semibold text-mira-muted">Питание сегодня</p>
        <h1 className="mt-1 text-3xl font-black tracking-[-0.05em]">Контекст, а не контроль</h1>
        <p className="mt-2 text-sm leading-6 text-mira-muted">Mira помогает заметить, что может поддержать энергию и самочувствие, без оценок еды.</p>
      </section>

      <Card className="bg-[#f2f7f1]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-mira-muted">Сводка за сегодня</p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">{analysisVisible ? "1 приём пищи" : "Пока без записей"}</h2>
          </div>
          <Badge className="bg-white/80 text-mira-text">Демо</Badge>
        </div>
        <p className="mt-3 text-sm leading-6 text-mira-muted">
          {analysisVisible ? "Есть один приблизительный анализ. Ты всегда сможешь уточнить его позже." : "Добавь фото или посмотри демо-анализ, чтобы увидеть, как это работает."}
        </p>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="bg-mira-ink p-5 text-white">
          <p className="text-sm font-semibold text-white/60">Приём пищи</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Покажи, что на тарелке</h2>
          <p className="mt-2 text-sm leading-6 text-white/70">Фото помогает сделать ориентировочную запись. Это не точный подсчёт.</p>
        </div>
        <div className="p-5">
          <Button className="w-full" size="lg" onClick={() => setPhotoFlowOpen(true)}>
            <Camera className="h-4 w-4" /> Сфотографировать еду
          </Button>
        </div>
      </Card>

      {analysisVisible && (
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-mira-muted">Анализ блюда</p>
              <h2 className="mt-1 text-xl font-black tracking-[-0.04em]">Ориентировочная оценка</h2>
            </div>
            <Badge className="bg-mira-background text-mira-text">Уверенность {demoMealAnalysis.confidence}</Badge>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {demoMealAnalysis.foods.map((food) => (
              <span key={food} className="rounded-full bg-mira-background px-3 py-2 text-xs font-semibold text-mira-text">{food}</span>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-mira-background p-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-mira-muted">Калорийность</p>
              <p className="mt-1 text-sm font-bold text-mira-text">{demoMealAnalysis.calories}</p>
            </div>
            <div className="rounded-2xl bg-mira-background p-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-mira-muted">Белки</p>
              <p className="mt-1 text-sm font-bold text-mira-text">{demoMealAnalysis.protein}</p>
            </div>
            <div className="rounded-2xl bg-mira-background p-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-mira-muted">Углеводы</p>
              <p className="mt-1 text-sm font-bold text-mira-text">{demoMealAnalysis.carbs}</p>
            </div>
            <div className="rounded-2xl bg-mira-background p-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-mira-muted">Жиры</p>
              <p className="mt-1 text-sm font-bold text-mira-text">{demoMealAnalysis.fat}</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-[#fff6f4] p-4">
            <p className="text-sm font-semibold text-mira-text">Что может повлиять на оценку</p>
            <p className="mt-1 text-sm leading-6 text-mira-muted">{demoMealAnalysis.uncertainty.join(", ")}. Фото-анализ всегда приблизительный.</p>
          </div>
        </Card>
      )}

      <Card>
        <p className="text-sm font-semibold text-mira-muted">Что может поддержать дальше</p>
        <p className="mt-2 text-sm leading-6 text-mira-text">{recommendation}</p>
      </Card>

      <Card className="border-dashed bg-white/60">
        <p className="text-sm font-semibold text-mira-muted">История питания</p>
        <p className="mt-2 text-sm leading-6 text-mira-muted">Здесь появятся сохранённые приёмы пищи и твои уточнения к оценкам.</p>
      </Card>

      {photoFlowOpen && (
        <MealPhotoFlow
          onClose={() => setPhotoFlowOpen(false)}
          onShowDemo={() => {
            setAnalysisVisible(true);
            setPhotoFlowOpen(false);
          }}
        />
      )}
    </div>
  );
}

function MealPhotoFlow({ onClose, onShowDemo }: { onClose: () => void; onShowDemo: () => void }) {
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");

  const selectPhoto = (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) {
      setFileName("");
      setFileError("Выбери изображение JPEG, PNG или WebP размером до 8 МБ.");
      return;
    }
    setFileError("");
    setFileName(file.name);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-4 pb-4">
      <Card className="rounded-t-[2rem] border-b-0 bg-white p-5 shadow-[0_-18px_60px_rgba(28,28,30,0.16)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-mira-muted">Фото блюда</p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">Добавь фото, когда будешь готова</h2>
          </div>
          <Button aria-label="Закрыть фото блюда" className="h-10 w-10 shrink-0 p-0" variant="ghost" onClick={onClose}>
            <span aria-hidden="true">×</span>
          </Button>
        </div>
        <label className="mt-5 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-mira-primary/40 bg-mira-background px-5 text-center">
          <Camera className="h-6 w-6 text-mira-primary" />
          <span className="mt-3 text-sm font-bold text-mira-text">{fileName || "Сделать или выбрать фото"}</span>
          <span className="mt-1 text-xs leading-5 text-mira-muted">В этом демо фото остаётся на устройстве и не отправляется на анализ.</span>
          <input
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => selectPhoto(event.target.files?.[0])}
          />
        </label>
        {fileError && <p className="mt-3 rounded-2xl bg-[#fff6f4] p-3 text-sm leading-6 text-mira-text" role="alert">{fileError}</p>}
        <p className="mt-4 text-sm leading-6 text-mira-muted">Пока можно посмотреть демо-анализ с диапазонами и видимой неопределённостью.</p>
        <Button className="mt-4 w-full" size="lg" onClick={onShowDemo}>Показать демо-анализ</Button>
      </Card>
    </div>
  );
}

function AnalyticsScreen({
  plan,
  checkIn
}: {
  plan: ReturnType<typeof buildDailyPlan>;
  checkIn: CheckInState;
}) {
  const currentContext = checkIn.stress >= 7
    ? "Сегодня стресс выше обычного, поэтому его стоит учитывать рядом с любыми паттернами."
    : "Текущий день выглядит достаточно ровным: это хороший момент наблюдать за привычными паттернами.";
  const insights = [
    "В недели с более высокой рабочей нагрузкой энергия в демо-данных чаще ниже к вечеру.",
    "Когда появляются тяга и усталость, более регулярный следующий приём пищи может ощущаться поддерживающе.",
    `В фазе «${plan.phase.toLowerCase()}» Mira предлагает оставлять нагрузку гибкой и ориентироваться на самоотчёт.`
  ];

  return (
    <div className="space-y-4 pb-8">
      <section className="px-1">
        <p className="text-sm font-semibold text-mira-muted">Аналитика</p>
        <h1 className="mt-1 text-3xl font-black tracking-[-0.05em]">Паттерны, а не оценки</h1>
        <p className="mt-2 text-sm leading-6 text-mira-muted">Это демо-данные для наблюдения за ритмом. Они не объясняют причины и не заменяют профессиональную помощь.</p>
      </section>

      <Card>
        <p className="text-sm font-semibold text-mira-muted">Цикл</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <AnalyticsMetric label="Средняя длина" value="28 дн." />
          <AnalyticsMetric label="Менструация" value="5 дн." />
          <AnalyticsMetric label="Вариативность" value="±2 дн." />
        </div>
        <p className="mt-4 text-sm leading-6 text-mira-muted">Текущая фаза: {plan.phase}. Оценки цикла остаются ориентировочными.</p>
      </Card>

      <Card>
        <p className="text-sm font-semibold text-mira-muted">Симптомы и состояние</p>
        <p className="mt-1 text-sm leading-6 text-mira-muted">Небольшие шкалы показывают частоту отметок в демо-неделе.</p>
        <div className="mt-4 space-y-4">
          <AnalyticsTrend label="Боль" values={[1, 2, 1, 3, 1, 1, 0]} note="Чаще отмечалась после насыщенных дней." />
          <AnalyticsTrend label="Настроение" values={[6, 7, 6, 5, 7, 8, 7]} note={`Сегодня: ${checkIn.mood}/10.`} positive />
          <AnalyticsTrend label="Энергия" values={[7, 6, 5, 6, 7, 7, 6]} note={`Сегодня: ${checkIn.energy}/10.`} positive />
          <AnalyticsTrend label="Тяга" values={[1, 1, 2, 3, 2, 1, 1]} note="Может совпадать с усталостью, но не доказывает причину." />
          <AnalyticsTrend label="Сон" values={[7, 7, 6, 5, 7, 8, 7]} note={`Сегодня: ${checkIn.sleep.toLowerCase()}.`} positive />
        </div>
      </Card>

      <Card className="bg-[#fff6f4]">
        <p className="text-sm font-semibold text-mira-muted">Работа и ресурс</p>
        <h2 className="mt-2 text-xl font-black tracking-[-0.04em]">Нагрузка на работе может менять план</h2>
        <p className="mt-2 text-sm leading-6 text-mira-muted">В демо-истории в дни с высокой нагрузкой тренировки чаще становились короче, а усталость отмечалась чаще. {currentContext}</p>
      </Card>

      <Card>
        <p className="text-sm font-semibold text-mira-muted">Тренировки</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <AnalyticsMetric label="Завершено" value="6 из 8" />
          <AnalyticsMetric label="Пропущено" value="2 дня" />
          <AnalyticsMetric label="Восстановление" value="3 дня" />
          <AnalyticsMetric label="Замены из-за боли" value="1 раз" />
        </div>
        <p className="mt-4 text-sm leading-6 text-mira-muted">Восстановительные дни - часть плана, а не пропуск результата.</p>
      </Card>

      <Card>
        <p className="text-sm font-semibold text-mira-muted">Питание</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <AnalyticsMetric label="Белок" value="5 из 7 дней" />
          <AnalyticsMetric label="Отметки тяги" value="3 дня" />
        </div>
        <p className="mt-4 text-sm leading-6 text-mira-muted">В демо-данных тяга чаще появляется в дни с меньшим ресурсом. Это повод заметить контекст, а не ограничивать еду.</p>
      </Card>

      <Card className="bg-mira-ink text-white">
        <p className="text-sm font-semibold text-white/60">ИИ-наблюдения · демо</p>
        <h2 className="mt-2 text-xl font-black tracking-[-0.04em]">Три полезных паттерна</h2>
        <ol className="mt-4 space-y-3">
          {insights.map((insight, index) => (
            <li key={insight} className="flex gap-3 text-sm leading-6 text-white/80">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/15 text-xs font-black text-white">{index + 1}</span>
              <span>{insight}</span>
            </li>
          ))}
        </ol>
      </Card>

      <HealthNavigator checkIn={checkIn} />
    </div>
  );
}

function AnalyticsMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-mira-background p-3">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-mira-muted">{label}</p>
      <p className="mt-1 text-sm font-black text-mira-text">{value}</p>
    </div>
  );
}

function AnalyticsTrend({
  label,
  values,
  note,
  positive = false
}: {
  label: string;
  values: number[];
  note: string;
  positive?: boolean;
}) {
  const max = Math.max(...values, 1);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm font-bold text-mira-text">{label}</p>
        <p className="text-right text-xs text-mira-muted">{note}</p>
      </div>
      <div className="mt-2 flex h-10 items-end gap-1.5">
        {values.map((value, index) => (
          <span
            key={`${label}-${index}`}
            className={cn("flex-1 rounded-t-md", positive ? "bg-mira-success" : "bg-mira-cycle")}
            style={{ height: `${Math.max(18, (value / max) * 100)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

type HealthSignalLevel = "observe" | "consider" | "urgent";

type HealthSignal = {
  level: HealthSignalLevel;
  title: string;
  explanation: string;
};

const demoHealthSignals: HealthSignal[] = [
  {
    level: "observe",
    title: "Наблюдай за повторяющейся болью",
    explanation: "Если боль заметно меняется от цикла к циклу, полезно сохранять уровень и дни, когда она появляется."
  },
  {
    level: "consider",
    title: "Повторяющаяся сильная боль - повод обсудить паттерн",
    explanation: "Если сильная боль повторяется в нескольких циклах или мешает обычным делам, consider discussing this with a qualified clinician."
  },
  {
    level: "urgent",
    title: "Необычно сильное кровотечение или резкое ухудшение самочувствия",
    explanation: "Если кровотечение кажется необычно сильным, появляется выраженная слабость, головокружение или самочувствие резко ухудшается, может потребоваться срочная медицинская помощь."
  }
];

function HealthNavigator({ checkIn }: { checkIn: CheckInState }) {
  const [selectedLevel, setSelectedLevel] = useState<HealthSignalLevel>("consider");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const selectedSignal = demoHealthSignals.find((signal) => signal.level === selectedLevel) ?? demoHealthSignals[0];
  const levelLabel: Record<HealthSignalLevel, string> = {
    observe: "Наблюдать",
    consider: "Стоит обсудить",
    urgent: "Срочно"
  };
  const levelClass: Record<HealthSignalLevel, string> = {
    observe: "bg-mira-success text-mira-text",
    consider: "bg-[#fff0d8] text-mira-text",
    urgent: "bg-[#f6dedc] text-mira-text"
  };

  return (
    <section className="space-y-4">
      <Card className="bg-[#f2f7f1]">
        <p className="text-sm font-semibold text-mira-muted">Навигатор здоровья</p>
        <h2 className="mt-2 text-xl font-black tracking-[-0.04em]">Понять, что стоит обсудить</h2>
        <p className="mt-2 text-sm leading-6 text-mira-muted">Это спокойный обзор паттернов из самоотчёта, а не медицинская оценка.</p>

        <div className="mt-4 rounded-2xl bg-white/80 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-mira-muted">Сигнал здоровья · демо</p>
              <h3 className="mt-1 text-base font-black text-mira-text">{selectedSignal.title}</h3>
            </div>
            <Badge className={levelClass[selectedSignal.level]}>{levelLabel[selectedSignal.level]}</Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-mira-muted">{selectedSignal.explanation}</p>
          <p className="mt-3 text-xs font-semibold text-mira-muted">Это не диагноз.</p>
          <Button className="mt-4 w-full" variant="secondary" onClick={() => setDetailsOpen((current) => !current)}>
            {detailsOpen ? "Скрыть детали" : "Открыть детали сигнала"}
          </Button>
        </div>
      </Card>

      {detailsOpen && (
        <Card className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-mira-muted">Примеры сигналов · демо</p>
            <div className="mt-3 space-y-2">
              {demoHealthSignals.map((signal) => (
                <button
                  key={signal.level}
                  className={cn(
                    "w-full rounded-2xl border p-3 text-left transition",
                    selectedLevel === signal.level ? "border-mira-primary bg-mira-background" : "border-black/5 bg-white"
                  )}
                  onClick={() => setSelectedLevel(signal.level)}
                  type="button"
                >
                  <span className="flex items-center justify-between gap-3 text-sm font-bold text-mira-text">
                    {levelLabel[signal.level]}
                    <span className={cn("rounded-full px-2 py-1 text-xs", levelClass[signal.level])}>{signal.title}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-mira-muted">К кому можно обратиться</p>
            <div className="mt-3 space-y-2 text-sm leading-6 text-mira-text">
              <p><strong>Гинеколог:</strong> для обсуждения цикла, боли или характера кровотечения.</p>
              <p><strong>Гинеколог-эндокринолог:</strong> если хочется обсудить цикл вместе с другими гормональными вопросами.</p>
              <p><strong>Терапевт / врач общей практики:</strong> чтобы начать общий разговор о самочувствии и усталости.</p>
              <p><strong>Специалист по психическому здоровью:</strong> если эмоциональные симптомы заметно влияют на жизнь.</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-mira-muted">Что подготовить к визиту</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-mira-text">
              <li>Историю цикла и даты менструаций.</li>
              <li>Историю симптомов и уровень боли.</li>
              <li>Наблюдения за характером кровотечения.</li>
              <li>Список принимаемых лекарств и добавок.</li>
              <li>Вопросы, которые хочется задать специалисту.</li>
            </ul>
            <p className="mt-3 text-sm leading-6 text-mira-muted">A clinician may discuss whether tests are needed. Mira не подсказывает, какие именно обследования или лечение нужны.</p>
          </div>

          <Button className="w-full" onClick={() => setReportOpen((current) => !current)}>
            {reportOpen ? "Скрыть демо-отчёт" : "Собрать сводку для врача"}
          </Button>
        </Card>
      )}

      {reportOpen && (
        <Card>
          <p className="text-sm font-semibold text-mira-muted">Сводка для визита · демо</p>
          <div className="mt-3 space-y-2 text-sm leading-6 text-mira-text">
            <p><strong>Цикл:</strong> средняя длина 28 дней, вариативность ±2 дня.</p>
            <p><strong>Текущая отметка:</strong> боль {checkIn.painLevel}/10, симптомы: {checkIn.symptoms.length ? checkIn.symptoms.join(", ") : "не отмечены"}.</p>
            <p><strong>Самочувствие:</strong> энергия {checkIn.energy}/10, настроение {checkIn.mood}/10, сон {checkIn.sleep.toLowerCase()}.</p>
            <p><strong>Заметка пользователя:</strong> {checkIn.note || "нет"}.</p>
          </div>
          <p className="mt-4 text-xs leading-5 text-mira-muted">Это preview, а не медицинский документ. Ничего не отправляется и не сохраняется вне текущей сессии.</p>
        </Card>
      )}
    </section>
  );
}

function ProfileScreen({
  profile,
  onClose,
  onRestart
}: {
  profile: OnboardingState;
  onClose: () => void;
  onRestart: () => void;
}) {
  const [sensitiveNotificationsHidden, setSensitiveNotificationsHidden] = useState(true);
  const [cycleConsent, setCycleConsent] = useState(true);
  const [photoConsent, setPhotoConsent] = useState(false);
  const [aiConsent, setAiConsent] = useState(true);
  const [healthConsent, setHealthConsent] = useState(false);
  const [language, setLanguage] = useState("Русский");
  const [units, setUnits] = useState("Метры и кг");
  const [actionStatus, setActionStatus] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  return (
    <section className="pb-28">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-mira-muted">Профиль и настройки</p>
        <Button
          aria-label="Закрыть настройки"
          className="h-10 w-10 p-0"
          variant="ghost"
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </Button>
      </div>
      <div className="space-y-4">
        <Card>
          <p className="text-sm font-semibold text-mira-muted">Профиль</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.05em]">Настройки и приватность</h1>
          <p className="mt-2 text-sm leading-6 text-mira-muted">Ты управляешь тем, что Mira использует и показывает. Все действия ниже работают в демо-режиме.</p>
        </Card>

        <Card className="space-y-3 text-sm text-mira-muted">
          <ProfileRow label="Цель" value={profile.goal} />
          <ProfileRow label="Тренировки" value={`${profile.trainingPlace}, ${profile.level}`} />
          <ProfileRow label="Ритм недели" value={`${profile.workoutsPerWeek} тренировки`} />
          <ProfileRow label="Активность" value={profile.activityLevel} />
        </Card>

        <Card className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-mira-muted">Приватность</p>
            <h2 className="mt-1 text-xl font-black tracking-[-0.04em]">Понятные настройки данных</h2>
          </div>
          <SettingsToggle
            checked={sensitiveNotificationsHidden}
            description="Не показывать чувствительный текст уведомлений на заблокированном экране."
            label="Скрывать чувствительные уведомления"
            onChange={setSensitiveNotificationsHidden}
          />
          <SettingsToggle
            checked={cycleConsent}
            description="Использовать даты и отметки цикла для персонального контекста."
            label="Отслеживание цикла"
            onChange={setCycleConsent}
          />
          <SettingsToggle
            checked={photoConsent}
            description="Разрешить локальный выбор фото еды для будущего анализа. Фото не отправляется в демо-режиме."
            label="Фото питания"
            onChange={setPhotoConsent}
          />
          <SettingsToggle
            checked={aiConsent}
            description="Разрешить структурированные рекомендации, когда backend будет подключен."
            label="ИИ-рекомендации"
            onChange={setAiConsent}
          />
          <SettingsToggle
            checked={healthConsent}
            description="Разрешить Навигатору здоровья собирать твои отметки в личный обзор."
            label="Навигатор здоровья"
            onChange={setHealthConsent}
          />
        </Card>

        <Card className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-mira-muted">Язык и единицы</p>
            <p className="mt-1 text-sm leading-6 text-mira-muted">Эти параметры меняют отображение, а не твои данные.</p>
          </div>
          <Field label="Язык">
            <ChoiceGrid options={["Русский", "Английский"]} value={language} onChange={setLanguage} />
          </Field>
          <Field label="Единицы">
            <ChoiceGrid options={["Метры и кг", "Футы и фунты"]} value={units} onChange={setUnits} />
          </Field>
        </Card>

        <Card className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-mira-muted">Твои данные</p>
            <h2 className="mt-1 text-xl font-black tracking-[-0.04em]">Экспорт и удаление всегда на виду</h2>
          </div>
          <p className="text-sm leading-6 text-mira-muted">В готовой версии здесь можно будет выгрузить или навсегда удалить свои записи. Сейчас это безопасные демо-действия.</p>
          <Button className="w-full" variant="secondary" onClick={() => setActionStatus("Демо: подготовили бы экспорт твоих данных. Ничего не скачано и не отправлено.")}>Экспортировать данные</Button>
          {!deleteConfirmOpen ? (
            <Button className="w-full" variant="outline" onClick={() => setDeleteConfirmOpen(true)}>Удалить данные</Button>
          ) : (
            <div className="rounded-2xl bg-[#fff6f4] p-4">
              <p className="text-sm font-semibold text-mira-text">Удалить демо-данные?</p>
              <p className="mt-1 text-sm leading-6 text-mira-muted">В готовой версии это действие будет необратимым. Сейчас данные не удаляются.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button size="sm" variant="secondary" onClick={() => setDeleteConfirmOpen(false)}>Отмена</Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setActionStatus("Демо: запрос на удаление был бы отправлен после явного подтверждения.");
                  setDeleteConfirmOpen(false);
                }}>Подтвердить</Button>
              </div>
            </div>
          )}
          {actionStatus && <p className="rounded-2xl bg-mira-background p-3 text-sm leading-6 text-mira-muted">{actionStatus}</p>}
        </Card>

        <Card className="space-y-3">
          <p className="text-sm font-semibold text-mira-muted">Начать заново</p>
          <p className="text-sm leading-6 text-mira-muted">Можно снова пройти стартовую настройку и изменить базовые параметры. Это не удаляет демо-данные.</p>
          <Button className="w-full" variant="secondary" onClick={onRestart}>Перезапустить настройку</Button>
        </Card>
      </div>
    </section>
  );
}

function SettingsToggle({
  checked,
  description,
  label,
  onChange
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-black/5 pb-4 last:border-0 last:pb-0">
      <div>
        <p className="text-sm font-bold text-mira-text">{label}</p>
        <p className="mt-1 text-sm leading-5 text-mira-muted">{description}</p>
      </div>
      <button
        aria-checked={checked}
        aria-label={label}
        className={cn(
          "mt-1 flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition",
          checked ? "bg-mira-primary" : "bg-black/10"
        )}
        onClick={() => onChange(!checked)}
        role="switch"
        type="button"
      >
        <span className={cn("h-5 w-5 rounded-full bg-white shadow-sm transition", checked ? "translate-x-5" : "translate-x-0")} />
      </button>
    </div>
  );
}

function AppHeader({ onOpenProfile }: { onOpenProfile: () => void }) {
  return (
    <header className="mb-5 flex items-center justify-between">
      <LogoMark />
      <div className="flex items-center gap-2">
        <Badge className="bg-white/80">Прототип</Badge>
        <button
          aria-label="Открыть профиль и настройки"
          className="grid h-11 w-11 place-items-center rounded-full bg-mira-primary text-white shadow-soft"
          onClick={onOpenProfile}
          type="button"
        >
          <UserRound className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

function BottomNav({
  active,
  setActive
}: {
  active: (typeof nav)[number]["id"];
  setActive: (active: (typeof nav)[number]["id"]) => void;
}) {
  return (
    <nav aria-label="Основная навигация" className="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 mx-auto grid max-w-md grid-cols-5 gap-1 rounded-full border border-white/80 bg-white/95 p-2 shadow-soft backdrop-blur">
      {nav.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-1 rounded-full px-1 py-2 text-[10px] font-bold transition",
              active === item.id ? "bg-mira-ink text-white" : "text-mira-muted"
            )}
            aria-current={active === item.id ? "page" : undefined}
            onClick={() => setActive(item.id)}
            type="button"
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function ChoiceGrid({
  options,
  value,
  onChange
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 [&>button:last-child:nth-child(odd)]:col-span-2">
      {options.map((option) => (
        <button
          key={option}
          className={cn(
            "rounded-2xl border px-4 py-3 text-left text-sm font-bold transition",
            value === option
              ? "border-mira-primary bg-mira-primary text-white shadow-glow"
              : "border-black/5 bg-mira-background text-mira-text"
          )}
          onClick={() => onChange(option)}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function StepShell({
  eyebrow,
  title,
  subtitle,
  children
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-mira-primary">{eyebrow}</p>
      <h1 className="mt-3 text-4xl font-black tracking-[-0.06em]">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-mira-muted">{subtitle}</p>
      <div className="mt-8 space-y-5">{children}</div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-mira-text">{label}</span>
      {children}
    </label>
  );
}

function PlanCard({
  icon,
  label,
  title,
  detail,
  reason
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  detail: string;
  reason: string;
}) {
  return (
    <Card>
      <div className="flex gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-mira-background text-mira-primary [&_svg]:h-5 [&_svg]:w-5">
          {icon}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-mira-muted">{label}</p>
          <h3 className="mt-1 text-xl font-black tracking-[-0.04em]">{title}</h3>
          <p className="text-sm font-semibold text-mira-primary">{detail}</p>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-bold text-mira-text">Почему?</summary>
            <p className="mt-2 text-sm leading-6 text-mira-muted">{reason}</p>
          </details>
        </div>
      </div>
    </Card>
  );
}

function WorkoutBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-black uppercase tracking-[0.16em] text-mira-muted">{title}</h3>
      <div className="mt-2 space-y-2">
        {items.map((item, index) => (
          <div key={item} className="flex items-center gap-3 rounded-2xl bg-mira-background p-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-xs font-black">
              {index + 1}
            </span>
            <span className="text-sm font-semibold">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white/82 p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-mira-muted">{label}</p>
      <p className="mt-2 text-xl font-black tracking-[-0.04em]">{value}</p>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-mira-background px-4 py-3">
      <span>{label}</span>
      <strong className="text-mira-text">{value}</strong>
    </div>
  );
}

function LogoMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-mira-ink text-white shadow-soft">
        <Sparkles className="h-5 w-5" />
      </div>
      <div>
        <p className="text-lg font-black tracking-[-0.05em]">Mira</p>
        <p className="text-xs font-semibold text-mira-muted">ИИ-коуч для тела</p>
      </div>
    </div>
  );
}
