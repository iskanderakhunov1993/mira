"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  ChartNoAxesCombined,
  Check,
  ClipboardCheck,
  Dumbbell,
  HeartPulse,
  LockKeyhole,
  Moon,
  Salad,
  ShieldCheck,
  Sparkles,
  UserRound
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  buildDailyPlan,
  buildWorkout,
  getCycleDay,
  getCyclePhase,
  getResourceToday,
  type CheckInState,
  type GymState,
  type OnboardingState,
  type WorkoutExercise,
  type WorkoutPlan
} from "@/lib/recommendations";
import {
  createEmptyMiraLocalData,
  localDateKey,
  readLegacyOnboardingProfile,
  readMiraLocalData,
  writeMiraLocalData,
  type DailyReflection,
  type MiraAccount,
  type MealLog,
  type MiraLocalData,
  type WorkoutLog
} from "@/lib/localStore";
import { analyzeMealPhoto } from "@/lib/api/mealPhotoClient";
import { generateWorkoutWithAi } from "@/lib/api/workoutGenerationClient";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { AnalyzeMealOutput } from "../../../shared/ai-contracts";

const goals = [
  "Понимать свой цикл",
  "Бережно тренироваться",
  "Беречь энергию",
  "Замечать свой ритм"
];
const focusAreaOptions = ["Энергия", "Сон", "Настроение", "Боль", "Симптомы", "Стресс"];
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
  goal: "Бережно тренироваться",
  focusAreas: ["Энергия", "Сон", "Стресс"],
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
  symptoms: [],
  note: ""
};

const defaultGym: GymState = {
  energy: "Нормально",
  time: "25 мин",
  goal: "Ноги и ягодицы"
};

const tourSteps = [
  { target: "cycle-card", text: "Здесь Mira показывает день цикла и текущую фазу" },
  { target: "checkin-button", text: "Отметь состояние за 15 секунд — это основа рекомендаций" },
  { target: "recommendation-card", text: "План дня подстраивается под твоё самочувствие" },
  { target: "nav-calendar", text: "В календаре видно весь цикл и записи по дням" },
  { target: "nav-workouts", text: "AI подберёт нагрузку под сегодняшнее состояние" }
] as const;

const TOUR_STORAGE_KEY = "mira:tour-completed";

export default function MiraMvp() {
  const [started, setStarted] = useState(false);
  const [accountReady, setAccountReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [step, setStep] = useState(0);
  const [active, setActive] = useState<(typeof nav)[number]["id"]>("today");
  const [profile, setProfile] = useState(defaultProfile);
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [gym, setGym] = useState(defaultGym);
  const [profileOpen, setProfileOpen] = useState(false);
  const [localData, setLocalData] = useState<MiraLocalData>(createEmptyMiraLocalData);
  const [isRestoringLocalData, setIsRestoringLocalData] = useState(true);
  const [tourStep, setTourStep] = useState(0);
  const [tourReady, setTourReady] = useState(false);

  const plan = useMemo(() => buildDailyPlan(profile, checkIn), [profile, checkIn]);

  useEffect(() => {
    const saved = readMiraLocalData();
    const legacyProfile = saved.profile ? undefined : readLegacyOnboardingProfile();
    const next = legacyProfile ? { ...saved, profile: legacyProfile } : saved;

    if (legacyProfile) {
      writeMiraLocalData(next);
      window.localStorage.removeItem("mira:onboarding");
    }

    setLocalData(next);
    if (next.profile) {
      setProfile(next.profile);
      setCheckIn(next.checkIns[localDateKey()]?.value ?? defaultCheckIn);
      setOnboarded(true);
      setStarted(true);
      setAccountReady(true);
    }
    const tourDone = window.localStorage.getItem(TOUR_STORAGE_KEY) === "true";
    if (next.profile && !tourDone) {
      setTourStep(1);
      setTourReady(true);
    }
    setIsRestoringLocalData(false);
  }, []);

  const persistLocalData = (next: MiraLocalData) => {
    setLocalData(next);
    writeMiraLocalData(next);
  };

  const saveCheckIn = (value: CheckInState) => {
    const date = localDateKey();
    const next: MiraLocalData = {
      ...localData,
      checkIns: {
        ...localData.checkIns,
        [date]: { date, savedAt: new Date().toISOString(), value }
      }
    };

    setCheckIn(value);
    persistLocalData(next);
  };

  const saveReflection = (value: Omit<DailyReflection, "date">) => {
    const date = localDateKey();
    persistLocalData({
      ...localData,
      reflections: {
        ...localData.reflections,
        [date]: { date, ...value }
      }
    });
  };

  const saveWorkout = (value: Omit<WorkoutLog, "id" | "date">) => {
    const next: MiraLocalData = {
      ...localData,
      workouts: [
        { ...value, id: `workout-${Date.now()}`, date: localDateKey() },
        ...localData.workouts
      ]
    };
    persistLocalData(next);
  };

  const saveMeal = (value: Omit<MealLog, "id" | "date">) => {
    const next: MiraLocalData = {
      ...localData,
      meals: [
        { ...value, id: `meal-${Date.now()}`, date: localDateKey() },
        ...localData.meals
      ]
    };
    persistLocalData(next);
  };

  if (isRestoringLocalData) {
    return <MiraLoadingScreen />;
  }

  if (!started) {
    return <Landing onStart={() => setStarted(true)} />;
  }

  if (!accountReady) {
    return (
      <AccountEntry
        onBack={() => setStarted(false)}
        onComplete={(account) => {
          persistLocalData({ ...localData, account });
          setAccountReady(true);
        }}
      />
    );
  }

  if (!onboarded) {
    return (
      <Onboarding
        profile={profile}
        setProfile={setProfile}
        step={step}
        setStep={setStep}
        plan={plan}
        onDone={() => {
          persistLocalData({ ...localData, profile });
          setOnboarded(true);
          const tourDone = window.localStorage.getItem(TOUR_STORAGE_KEY) === "true";
          if (!tourDone) {
            setTourStep(1);
            setTourReady(true);
          }
        }}
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
              setAccountReady(true);
              persistLocalData({ ...localData, profile: undefined });
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
                localData={localData}
                account={localData.account}
                onSaveCheckIn={saveCheckIn}
                onSaveReflection={saveReflection}
                onCalendar={() => setActive("calendar")}
                onWorkouts={() => setActive("workouts")}
                onNutrition={() => setActive("nutrition")}
                onSetProfile={setProfile}
                onPersistLocalData={persistLocalData}
              />
            )}
            {active === "calendar" && <CalendarScreen profile={profile} plan={plan} localData={localData} onToday={() => setActive("today")} />}
            {active === "workouts" && (
              <WorkoutScreen
                profile={profile}
                checkIn={checkIn}
                gym={gym}
                localData={localData}
                setGym={setGym}
                onSaveWorkout={saveWorkout}
              />
            )}
            {active === "nutrition" && <NutritionScreen checkIn={checkIn} plan={plan} localData={localData} onSaveMeal={saveMeal} />}
            {active === "analytics" && <AnalyticsScreen profile={profile} plan={plan} checkIn={checkIn} localData={localData} onToday={() => setActive("today")} />}
          </motion.section>
        )}

        <BottomNav active={active} setActive={setActive} />
      </div>
      {tourReady && tourStep >= 1 && tourStep <= tourSteps.length && (
        <GuidedTour
          step={tourStep}
          onNext={() => {
            const next = tourStep + 1;
            if (next > tourSteps.length) {
              setTourStep(0);
              setTourReady(false);
              window.localStorage.setItem(TOUR_STORAGE_KEY, "true");
            } else {
              setTourStep(next);
            }
          }}
          onSkip={() => {
            setTourStep(0);
            setTourReady(false);
            window.localStorage.setItem(TOUR_STORAGE_KEY, "true");
          }}
        />
      )}
    </main>
  );
}

function GuidedTour({
  step,
  onNext,
  onSkip
}: {
  step: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const currentStep = tourSteps[step - 1];
  const [rect, setRect] = useState<DOMRect | null>(null);

  const measure = useCallback(() => {
    if (!currentStep) return;
    const element = document.querySelector(`[data-tour="${currentStep.target}"]`);
    if (element) {
      setRect(element.getBoundingClientRect());
    } else {
      setRect(null);
    }
  }, [currentStep]);

  useEffect(() => {
    measure();
    const handleResize = () => measure();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);
    const timer = setTimeout(measure, 100);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
      clearTimeout(timer);
    };
  }, [measure]);

  if (!currentStep) return null;

  const padding = 8;
  const tooltipTop = rect ? rect.bottom + padding + 12 : "50%";
  const tooltipOverflows = rect ? rect.bottom + 200 > window.innerHeight : false;
  const tooltipAbove = tooltipOverflows && rect ? rect.top - padding - 12 : null;

  return (
    <AnimatePresence>
      <motion.div
        key={`tour-${step}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50"
        aria-modal="true"
        role="dialog"
        aria-label={`Подсказка ${step} из ${tourSteps.length}`}
      >
        <div className="absolute inset-0 bg-black/60" onClick={onSkip} />

        {rect && (
          <div
            className="absolute rounded-2xl border-2 border-mira-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
            style={{
              top: rect.top - padding,
              left: rect.left - padding,
              width: rect.width + padding * 2,
              height: rect.height + padding * 2
            }}
          />
        )}

        <motion.div
          initial={{ opacity: 0, y: tooltipAbove ? 8 : -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="absolute left-4 right-4 mx-auto max-w-sm rounded-2xl bg-mira-card p-5 shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
          style={{
            top: tooltipAbove ?? tooltipTop
          }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-mira-primary">
            {step} из {tourSteps.length}
          </p>
          <p className="mt-2 text-sm leading-6 text-mira-text">{currentStep.text}</p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              className="text-sm font-semibold text-mira-muted transition hover:text-mira-text"
              onClick={onSkip}
              type="button"
            >
              Пропустить
            </button>
            <Button size="sm" onClick={onNext}>
              {step === tourSteps.length ? "Готово" : "Далее"}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function MiraLoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 text-mira-text">
      <div className="flex flex-col items-center gap-4 text-center">
        <MiraSymbol />
        <p className="text-sm font-semibold text-mira-muted">Открываем твой день</p>
      </div>
    </main>
  );
}

function Landing({ onStart }: { onStart: () => void }) {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const headlineY = useTransform(scrollYProgress, [0, 1], [0, -72]);
  const dashboardY = useTransform(scrollYProgress, [0, 1], [0, -132]);
  const orbitY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  return (
    <main className="soft-grid overflow-hidden text-mira-text">
      <section ref={heroRef} className="relative min-h-[840px] px-5 pb-16 pt-6 sm:min-h-[760px]">
        <motion.div style={{ y: orbitY }} className="pointer-events-none absolute -right-16 top-36 h-64 w-64 rounded-full border-[26px] border-mira-primary/10" />
        <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_430px] lg:items-center lg:pt-12">
          <motion.section style={{ y: headlineY }} className="pt-4 lg:pt-10">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <LogoMark />
              <span className="text-sm font-semibold text-mira-muted">Mira</span>
            </div>
            <Badge className="mb-6 border-mira-primary/15 bg-mira-card/80 text-mira-primary">Твой личный ритм</Badge>
            <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.07em] sm:text-7xl">
              Понять себя. Выбрать, что делать сегодня.
            </motion.h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-mira-muted">
              Mira соединяет цикл, сон, энергию, нагрузку и питание в один спокойный ориентир на день.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={onStart}>Создать личный план <ArrowRight className="h-4 w-4" /></Button>
              <a className="inline-flex h-14 items-center justify-center rounded-full px-6 text-sm font-semibold text-mira-primary transition hover:bg-white/5" href="#how-it-works">Как это работает</a>
            </div>
            <p className="mt-4 text-sm text-mira-muted">Без диагнозов. Без оценок тела. Ты решаешь, чем делиться.</p>
          </motion.section>

          <motion.section style={{ y: dashboardY }} initial={{ opacity: 0, y: 36, rotate: 2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 0.6 }} className="phone-shell relative mx-auto w-full max-w-sm rounded-[2.5rem] border border-white/10 bg-mira-card p-3">
            <div className="rounded-[2rem] bg-mira-background p-5">
              <div className="mb-7 flex items-center justify-between"><LogoMark /><Badge>Сегодня</Badge></div>
              <Card className="bg-mira-primary p-6 text-mira-ink">
                <p className="text-sm font-semibold text-mira-ink/65">Ресурс на сегодня</p>
                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">В балансе</h2>
                <p className="mt-3 text-sm leading-6 text-mira-ink/75">Умеренное движение, привычная еда и более спокойный вечер.</p>
              </Card>
              <div className="mt-4 grid grid-cols-2 gap-3"><Metric label="Энергия" value="6/10" /><Metric label="Сон" value="Нормально" /><Metric label="Цикл" value="День 14" /><Metric label="Нагрузка" value="Средняя" /></div>
            </div>
          </motion.section>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-white/10 bg-[#20201e] px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-mira-primary">Три шага</p>
          <h2 className="mt-3 max-w-xl text-3xl font-black tracking-[-0.05em]">Меньше полей. Больше понятных решений.</h2>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {[{ n: "01", title: "Отметь состояние", text: "Энергия, сон, настроение и дискомфорт - только то, что важно сегодня." }, { n: "02", title: "Увидь контекст", text: "Цикл и привычки становятся ориентиром, а не жёстким правилом." }, { n: "03", title: "Выбери свой темп", text: "Mira предлагает движение, питание и восстановление без давления." }].map((item) => <Card key={item.n} className="min-h-48 p-5"><p className="text-sm font-bold text-mira-primary">{item.n}</p><h3 className="mt-7 text-xl font-black tracking-[-0.04em]">{item.title}</h3><p className="mt-3 text-sm leading-6 text-mira-muted">{item.text}</p></Card>)}
          </div>
          <Button className="mt-8 w-full sm:w-auto" size="lg" onClick={onStart}>Начать с личного ритма <ArrowRight className="h-4 w-4" /></Button>
        </div>
      </section>
    </main>
  );
}

function AccountEntry({ onBack, onComplete }: { onBack: () => void; onComplete: (account: MiraAccount) => void }) {
  const [mode, setMode] = useState<"create" | "sign-in">("create");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedHealthContext, setAcceptedHealthContext] = useState(false);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isCreate = mode === "create";
  const canSubmit = email.includes("@") && password.length >= 8 && (!isCreate || (name.trim().length > 1 && acceptedTerms && acceptedHealthContext));

  const submit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setStatus("");
    try {
      if (supabase) {
        const result = isCreate
          ? await supabase.auth.signUp({ email, password, options: { data: { name: name.trim() } } })
          : await supabase.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        onComplete({ name: name.trim() || email.split("@")[0], email, storage: "cloud", createdAt: new Date().toISOString() });
        return;
      }
      onComplete({ name: name.trim() || email.split("@")[0], email, storage: "local", createdAt: new Date().toISOString() });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Не удалось продолжить. Проверь данные и попробуй ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen px-5 py-6 text-mira-text">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col">
        <div className="flex items-center justify-between"><button aria-label="Назад" className="grid h-11 w-11 place-items-center rounded-full border border-white/10 text-mira-text" onClick={onBack}><ArrowLeft className="h-5 w-5" /></button><LogoMark /><span className="w-11" /></div>
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="my-auto py-10">
          <div className="mb-7 grid h-16 w-16 place-items-center rounded-[1.25rem] bg-mira-primary text-mira-ink"><ShieldCheck className="h-8 w-8" /></div>
          <p className="text-sm font-semibold text-mira-primary">Твой личный ритм</p>
          <h1 className="mt-3 text-4xl font-black leading-[1.02] tracking-[-0.06em]">{isCreate ? "Создадим твой профиль" : "Рады видеть тебя снова"}</h1>
          <p className="mt-4 text-sm leading-6 text-mira-muted">{isCreate ? "С ним можно сохранить настройки и продолжить на другом устройстве." : "Войди, чтобы открыть сохранённый контекст и свой день."}</p>
          <div className="mt-8 space-y-3">
            {isCreate && <label className="block"><span className="mb-2 block text-sm font-semibold text-mira-muted">Как к тебе обращаться</span><div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-mira-card px-4"><UserRound className="h-5 w-5 text-mira-primary" /><input className="h-14 min-w-0 flex-1 bg-transparent text-mira-text outline-none" maxLength={40} onChange={(event) => setName(event.target.value)} placeholder="Имя" value={name} /></div></label>}
            <label className="block"><span className="mb-2 block text-sm font-semibold text-mira-muted">Электронная почта</span><div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-mira-card px-4"><AtSign className="h-5 w-5 text-mira-primary" /><input className="h-14 min-w-0 flex-1 bg-transparent text-mira-text outline-none" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" type="email" value={email} /></div></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold text-mira-muted">Пароль</span><div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-mira-card px-4"><LockKeyhole className="h-5 w-5 text-mira-primary" /><input className="h-14 min-w-0 flex-1 bg-transparent text-mira-text outline-none" minLength={8} onChange={(event) => setPassword(event.target.value)} placeholder="Не меньше 8 символов" type="password" value={password} /></div></label>
          </div>
          {isCreate && <div className="mt-6 space-y-3 text-sm leading-5 text-mira-muted"><ConsentRow checked={acceptedTerms} label="Я принимаю условия использования и политику конфиденциальности." onChange={setAcceptedTerms} /><ConsentRow checked={acceptedHealthContext} label="Я разрешаю использовать мои отметки только для персонального контекста в Mira. Согласие можно изменить в настройках." onChange={setAcceptedHealthContext} /></div>}
          {status && <p className="mt-4 text-sm font-semibold text-mira-cycle" role="alert">{status}</p>}
        </motion.section>
        <div className="pb-4"><Button className="w-full" disabled={!canSubmit || isSubmitting} size="lg" onClick={submit}>{isSubmitting ? "Проверяем данные..." : isCreate ? "Создать профиль" : "Войти"} <ArrowRight className="h-4 w-4" /></Button><button className="mt-5 w-full text-sm font-semibold text-mira-primary" onClick={() => { setMode(isCreate ? "sign-in" : "create"); setStatus(""); }}>{isCreate ? "У меня уже есть аккаунт" : "Создать новый аккаунт"}</button><p className="mt-5 text-center text-xs leading-5 text-mira-muted">{supabase ? "Аккаунт хранится в защищённом сервисе авторизации." : "Сейчас включён локальный режим: данные останутся на этом устройстве до подключения облачной синхронизации."}</p></div>
      </div>
    </main>
  );
}

function ConsentRow({ checked, label, onChange }: { checked: boolean; label: string; onChange: (value: boolean) => void }) {
  return <button className="flex w-full items-start gap-3 text-left" onClick={() => onChange(!checked)} type="button"><span className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border", checked ? "border-mira-primary bg-mira-primary text-mira-ink" : "border-white/25 bg-mira-card")}><Check className={cn("h-3.5 w-3.5", checked ? "opacity-100" : "opacity-0")} /></span><span>{label}</span></button>;
}

function Onboarding({
  profile,
  setProfile,
  step,
  setStep,
  plan,
  onDone
}: {
  profile: OnboardingState;
  setProfile: (profile: OnboardingState) => void;
  step: number;
  setStep: (step: number) => void;
  plan: ReturnType<typeof buildDailyPlan>;
  onDone: () => void;
}) {
  const progress = ((step + 1) / 5) * 100;
  const stageNames = ["Цель", "Цикл", "Ритм", "Фокус", "Первый план"];
  const stageIcons = [Sparkles, CalendarDays, Moon, HeartPulse, Check];
  const StageIcon = stageIcons[step];

  return (
    <main className="min-h-screen overflow-hidden px-5 py-6 text-mira-text">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <LogoMark />
          <span className="text-sm font-semibold text-mira-muted">{stageNames[step]} · {step + 1}/5</span>
        </div>
        <div className="mb-3 flex gap-1.5" aria-label={`Шаг ${step + 1} из 5`}>
          {stageNames.map((name, index) => <span key={name} className={cn("h-1.5 flex-1 rounded-full transition-colors", index <= step ? "bg-mira-primary" : "bg-mira-card")} />)}
        </div>
        <div className="mb-8 h-1 overflow-hidden rounded-full bg-mira-card" aria-hidden="true">
          <div
            className="h-full rounded-full bg-mira-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.28 }}>
        <Card className="min-h-[570px] p-6 sm:p-7">
          <div className="mb-7 flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-mira-primary text-mira-ink"><StageIcon className="h-6 w-6" /></div><span className="text-sm font-semibold text-mira-muted">Настройка Mira</span></div>
          {step === 0 && (
            <StepShell
              eyebrow="Начнём с важного"
              title="Что ты хочешь получить от Mira?"
              subtitle="Выбери главное направление. Его всегда можно изменить позже."
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
              subtitle="Эти данные помогают сделать рекомендации чуть точнее. Можно пропустить и вернуться позже."
            >
              <Field label="Первый день последней менструации">
                <input
                  className="w-full rounded-2xl border border-white/10 bg-mira-background px-4 py-3"
                  type="date"
                  value={profile.periodStart}
                  onChange={(event) => setProfile({ ...profile, periodStart: event.target.value })}
                />
              </Field>
              <Field label="Средняя длина цикла">
                <input
                  className="w-full rounded-2xl border border-white/10 bg-mira-background px-4 py-3"
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
              <Button
                className="w-full"
                variant="ghost"
                onClick={() => setProfile({ ...profile, periodStart: "" })}
              >
                Не помню, настрою позже
              </Button>
            </StepShell>
          )}

          {step === 2 && (
            <StepShell
              eyebrow="Обычный ритм"
              title="Как проходит большинство твоих дней?"
              subtitle="Mira учитывает твой ритм, а не просит соответствовать чужому плану."
            >
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
              <Field label={`Стресс обычно: ${profile.stressLevel}/10`}>
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
            </StepShell>
          )}

          {step === 3 && (
            <StepShell
              eyebrow="Твой фокус"
              title="Что хочется замечать бережнее?"
              subtitle="Выбери несколько сигналов. Они сформируют твой быстрый чек-ин."
            >
              <MultiChoiceGrid
                options={focusAreaOptions}
                values={profile.focusAreas}
                onChange={(focusAreas) => setProfile({ ...profile, focusAreas })}
              />
            </StepShell>
          )}

          {step === 4 && (
            <StepShell
              eyebrow="Твой первый день"
              title="Mira готова быть рядом сегодня"
              subtitle="Это стартовый план на основе выбранного ритма. После первого чек-ина он станет точнее."
            >
              <div className="rounded-3xl bg-mira-ink p-5 text-white">
                <p className="text-sm font-semibold text-white/60">Движение</p>
                <p className="mt-2 text-xl font-black tracking-[-0.04em]">{plan.movement.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/70">{plan.movement.detail}</p>
              </div>
              <div className="grid gap-3 text-sm">
                <div className="rounded-2xl bg-mira-background p-4">
                  <p className="font-bold">Питание</p>
                  <p className="mt-1 text-mira-muted">{plan.nutrition.title}</p>
                </div>
                <div className="rounded-2xl bg-mira-background p-4">
                  <p className="font-bold">Восстановление</p>
                  <p className="mt-1 text-mira-muted">{plan.recovery.title}</p>
                </div>
              </div>
            </StepShell>
          )}
        </Card>
        </motion.div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>
            Назад
          </Button>
          <Button onClick={() => (step === 4 ? onDone() : setStep(step + 1))}>
            {step === 4 ? "Открыть мой день" : "Продолжить"}
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
  localData,
  account,
  onSaveCheckIn,
  onSaveReflection,
  onCalendar,
  onWorkouts,
  onNutrition,
  onSetProfile,
  onPersistLocalData
}: {
  plan: ReturnType<typeof buildDailyPlan>;
  profile: OnboardingState;
  checkIn: CheckInState;
  localData: MiraLocalData;
  account?: MiraAccount;
  onSaveCheckIn: (checkIn: CheckInState) => void;
  onSaveReflection: (value: Omit<DailyReflection, "date">) => void;
  onCalendar: () => void;
  onWorkouts: () => void;
  onNutrition: () => void;
  onSetProfile: (profile: OnboardingState) => void;
  onPersistLocalData: (next: MiraLocalData) => void;
}) {
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [periodConfirmed, setPeriodConfirmed] = useState(false);
  const resource = getResourceToday(checkIn);
  const hasSavedCheckIn = Boolean(localData.checkIns[localDateKey()]);
  const reflection = localData.reflections[localDateKey()];
  const analyzedMeals = localData.meals.filter((meal) => meal.date === localDateKey() && meal.energyKcal);
  const nutritionEnergy = analyzedMeals.length
    ? {
        min: analyzedMeals.reduce((sum, meal) => sum + (meal.energyKcal?.min ?? 0), 0),
        max: analyzedMeals.reduce((sum, meal) => sum + (meal.energyKcal?.max ?? 0), 0),
        confidence: Math.round(analyzedMeals.reduce((sum, meal) => sum + (meal.confidence ?? 0), 0) / analyzedMeals.length * 100)
      }
    : null;
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

  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? "Доброе утро" : currentHour < 17 ? "Добрый день" : "Добрый вечер";
  const userName = account?.name;
  const greetingText = userName ? `${timeGreeting}, ${userName}` : timeGreeting;

  const markPeriodStart = () => {
    const todayDate = new Date().toISOString().slice(0, 10);
    const updatedProfile = { ...profile, periodStart: todayDate };
    onSetProfile(updatedProfile);
    onPersistLocalData({ ...localData, profile: updatedProfile });
    setPeriodConfirmed(true);
    setTimeout(() => setPeriodConfirmed(false), 3000);
  };

  return (
    <div className="space-y-4">
      <section className="px-1 pt-1">
        <p className="capitalize text-sm font-semibold text-mira-muted">{today}</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.06em]">{greetingText}</h1>
        <p className="mt-2 text-sm leading-6 text-mira-muted">Посмотрим на твой сегодняшний контекст без лишнего давления.</p>
      </section>

      <Card className="bg-[#30272b]" data-tour="cycle-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-mira-muted">Цикл</p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">День {plan.cycleDay}</h2>
            <p className="mt-1 text-sm text-mira-primary">{plan.phase} фаза</p>
            {(plan.cycleDay > 20 || !profile.periodStart) && !periodConfirmed && (
              <button
                className="mt-2 rounded-full bg-mira-cycle/20 px-3 py-1 text-xs font-bold text-mira-cycle transition hover:bg-mira-cycle/30"
                onClick={markPeriodStart}
                type="button"
              >
                Начались
              </button>
            )}
          </div>
          <CycleDial cycleDay={plan.cycleDay} cycleLength={profile.cycleLength} />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-sm">
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

      {(plan.cycleDay > 20 || !profile.periodStart) && !periodConfirmed && (
        <Card className="border-mira-cycle/30 bg-[#30272b]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-mira-muted">Менструация</p>
              <h2 className="mt-1 text-lg font-black tracking-[-0.04em]">Начались месячные?</h2>
              <p className="mt-1 text-sm leading-5 text-mira-muted">Отметка обновит день цикла и сделает рекомендации точнее.</p>
            </div>
          </div>
          <Button className="mt-4 w-full" variant="secondary" onClick={markPeriodStart}>
            <HeartPulse className="h-4 w-4 text-mira-cycle" />
            Отметить начало менструации
          </Button>
        </Card>
      )}
      {periodConfirmed && (
        <Card className="border-mira-primary/30 bg-[#1d302b]">
          <div className="flex items-center gap-3">
            <Check className="h-5 w-5 text-mira-primary" />
            <p className="text-sm font-semibold text-mira-text">Начало менструации отмечено. Цикл пересчитан.</p>
          </div>
        </Card>
      )}

      <DashboardCalendar profile={profile} plan={plan} localData={localData} onOpenCalendar={onCalendar} />

      {nutritionEnergy && (
        <Card className="bg-[#1d302b]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-mira-muted">Энергия из фото еды</p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">{nutritionEnergy.min}-{nutritionEnergy.max} ккал</h2>
              <p className="mt-1 text-sm leading-6 text-mira-muted">Ориентировочный диапазон по {analyzedMeals.length} {analyzedMeals.length === 1 ? "фото" : "фото"}; это не точный подсчёт.</p>
            </div>
            <Badge className="bg-mira-background text-mira-text">Уверенность {nutritionEnergy.confidence}%</Badge>
          </div>
        </Card>
      )}

      <Card className="border-mira-primary/30 bg-[#1d302b]" data-tour="checkin-button">
        <p className="text-sm font-semibold text-mira-muted">Следующий шаг</p>
        <h2 className="mt-2 text-xl font-black tracking-[-0.04em]">
          {!hasSavedCheckIn ? "Отметь, как ты сейчас" : checkIn.painLevel > 0 ? "Сегодня выбираем восстановление" : "План на сегодня готов"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-mira-muted">
          {!hasSavedCheckIn
            ? "Короткий чек-ин помогает Mira предложить более уместный темп дня."
            : checkIn.painLevel > 0
              ? "Боль важнее тренировочной цели. Выбери только комфортное движение или отдых."
              : "Ты можешь открыть тренировку или оставить в плане только то, что сегодня посильно."}
        </p>
        <Button className="mt-4 w-full" size="lg" onClick={!hasSavedCheckIn ? () => setCheckInOpen(true) : onWorkouts}>
          {!hasSavedCheckIn ? <ClipboardCheck className="h-4 w-4" /> : <Dumbbell className="h-4 w-4" />}
          {!hasSavedCheckIn ? "Отметить состояние" : checkIn.painLevel > 0 ? "Открыть восстановление" : "Открыть план"}
        </Button>
      </Card>

      {hasSavedCheckIn ? (
        <>
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

      <Card className="overflow-hidden p-0" data-tour="recommendation-card">
        <div className="bg-mira-ink p-5 text-white">
          <p className="text-sm font-semibold text-white/60">Главная рекомендация</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Поддерживающий план на сегодня</h2>
          <p className="mt-2 text-sm leading-6 text-white/70">{plan.movement.reason}</p>
        </div>
        <div className="divide-y divide-white/10">
          <TodayRecommendation icon={<BriefcaseBusiness />} label="Работа" text={workRecommendation} />
          <TodayRecommendation icon={<Dumbbell />} label="Тренировка" text={`${plan.movement.title} - ${plan.movement.detail}.`} />
          <TodayRecommendation icon={<HeartPulse />} label="Питание" text={`${plan.nutrition.title}. ${plan.nutrition.detail}.`} />
          <TodayRecommendation icon={<Moon />} label="Восстановление" text={`${plan.recovery.title}. ${plan.recovery.detail}.`} />
        </div>
      </Card>
        </>
      ) : (
        <Card>
          <p className="text-sm font-semibold text-mira-muted">План появится после check-in</p>
          <p className="mt-2 text-sm leading-6 text-mira-muted">Mira не будет делать вид, что знает твой ресурс без твоей отметки. Начни с нескольких коротких ответов.</p>
        </Card>
      )}

      <section>
        <p className="mb-3 px-1 text-sm font-semibold text-mira-muted">Ещё сегодня</p>
        {!hasSavedCheckIn ? (
          <Button className="w-full" size="lg" data-tour="checkin-button" onClick={() => setCheckInOpen(true)}>
            <ClipboardCheck className="h-5 w-5" />
            Как ты сегодня?
          </Button>
        ) : currentHour < 17 ? (
          <div className="space-y-3">
            <Button className="w-full" size="lg" onClick={onWorkouts}>
              <Dumbbell className="h-5 w-5" />
              Открыть тренировку
            </Button>
            <Button className="w-full" variant="secondary" onClick={onNutrition}>
              <Camera className="h-4 w-4 text-mira-primary" />
              Добавить еду
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Button className="w-full" size="lg" onClick={() => setReflectionOpen(true)}>
              <Moon className="h-5 w-5" />
              Как прошёл день?
            </Button>
            <Button className="w-full" variant="secondary" onClick={onNutrition}>
              <Camera className="h-4 w-4 text-mira-primary" />
              Добавить еду
            </Button>
          </div>
        )}
      </section>

      {checkInOpen && (
        <DailyCheckIn
          initial={checkIn}
          onClose={() => setCheckInOpen(false)}
          onSave={(value) => {
            onSaveCheckIn(value);
            setCheckInOpen(false);
          }}
        />
      )}

      <Card className="bg-[#1d302b]">
        <p className="text-sm font-semibold text-mira-muted">Небольшое наблюдение</p>
        <p className="mt-2 text-sm leading-6 text-mira-text">{insight}</p>
      </Card>

      <Card>
        <p className="text-sm font-semibold text-mira-muted">Закрыть день</p>
        <h2 className="mt-1 text-xl font-black tracking-[-0.04em]">{reflection ? "Отметка дня сохранена" : "Как прошёл день?"}</h2>
        <p className="mt-2 text-sm leading-6 text-mira-muted">
          {reflection
            ? "Ты сможешь увидеть эту отметку в личной истории. Её можно обновить в любой момент."
            : "Пара коротких отметок помогут Mira показывать только твой реальный ритм."}
        </p>
        <Button className="mt-4 w-full" variant="secondary" onClick={() => setReflectionOpen(true)}>
          {reflection ? "Обновить отметку" : "Отметить день"}
        </Button>
      </Card>

      {reflectionOpen && (
        <DailyReflectionForm
          initial={reflection}
          onClose={() => setReflectionOpen(false)}
          onSave={(value) => {
            onSaveReflection(value);
            setReflectionOpen(false);
          }}
        />
      )}
    </div>
  );
}

function CycleDial({ cycleDay, cycleLength }: { cycleDay: number; cycleLength: number }) {
  const progress = Math.min(100, Math.max(4, (cycleDay / cycleLength) * 100));
  const accent = cycleDay <= 5 ? "#EF4653" : "#76D7F3";

  return (
    <div
      aria-label={`День цикла ${cycleDay} из ${cycleLength}`}
      className="grid h-16 w-16 shrink-0 place-items-center rounded-full p-1"
      style={{ background: `conic-gradient(${accent} ${progress}%, #484742 0)` }}
    >
      <div className="grid h-full w-full place-items-center rounded-full bg-mira-card text-center">
        <span className="text-[9px] font-bold uppercase text-mira-muted">день</span>
        <span className="-mt-1 text-lg font-black text-mira-text">{cycleDay}</span>
      </div>
    </div>
  );
}

function DashboardCalendar({
  profile,
  plan,
  localData,
  onOpenCalendar
}: {
  profile: OnboardingState;
  plan: ReturnType<typeof buildDailyPlan>;
  localData: MiraLocalData;
  onOpenCalendar: () => void;
}) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const currentDay = today.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const [selectedDay, setSelectedDay] = useState(currentDay);
  const calendarDays = useMemo(
    () => Array.from({ length: daysInMonth }, (_, index) => createCalendarDay(index + 1, currentDay, plan, profile, localData, year, month)),
    [currentDay, daysInMonth, localData, month, plan, profile, year]
  );
  const selected = calendarDays[selectedDay - 1];
  const monthName = new Intl.DateTimeFormat("ru-RU", { month: "long" }).format(today);
  const selectedLabel = selected.isPeriod
    ? "Отмечена менструация"
    : selected.isPredictedPeriod
      ? "Ориентировочное окно следующей менструации"
      : selected.isOvulation
        ? "Ориентировочная овуляция"
        : selected.isFertile
          ? "Ориентировочное фертильное окно"
          : `${selected.phase} · день цикла ${selected.cycleDay}`;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-mira-muted">Календарь цикла</p>
          <h2 className="mt-1 capitalize text-xl font-black tracking-[-0.04em]">{monthName}</h2>
        </div>
        <button
          aria-label="Открыть подробный календарь"
          className="grid h-10 w-10 place-items-center rounded-full bg-mira-background text-mira-primary transition hover:bg-mira-primary hover:text-mira-ink"
          onClick={onOpenCalendar}
          title="Открыть календарь"
          type="button"
        >
          <CalendarDays className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-y-1 text-center">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
          <span key={day} className="pb-1 text-[10px] font-bold text-mira-muted">{day}</span>
        ))}
        {Array.from({ length: monthOffset }).map((_, index) => <span key={`dashboard-empty-${index}`} />)}
        {calendarDays.map((day) => {
          const selectedDate = day.day === selectedDay;
          const period = day.isPeriod;
          const fertile = day.isFertile;
          const todayDate = day.day === currentDay;

          return (
            <button
              key={day.day}
              aria-label={`Выбрать ${day.day} число`}
              aria-pressed={selectedDate}
              className={cn(
                "relative mx-auto grid h-9 w-9 place-items-center rounded-full text-xs font-bold transition",
                selectedDate ? "bg-mira-ink text-white shadow-soft" : period ? "bg-mira-cycle/65 text-mira-text" : "text-mira-text hover:bg-mira-background",
                fertile && !selectedDate ? "ring-1 ring-[#d9d4ee]" : "",
                todayDate && !selectedDate ? "border border-mira-primary" : ""
              )}
              onClick={() => setSelectedDay(day.day)}
              type="button"
            >
              {day.day}
              {day.isOvulation && !selectedDate && <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-mira-primary" />}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-mira-background px-3 py-3">
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-mira-primary" />
        <p className="text-sm leading-5 text-mira-muted">{selectedLabel}</p>
      </div>
      <p className="mt-3 text-xs leading-5 text-mira-muted">Отметки ориентировочные и не являются медицинским прогнозом.</p>
    </Card>
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
  const [expanded, setExpanded] = useState(false);

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
          <p className="mt-1 text-sm leading-5 text-mira-muted">4 поля за 10 секунд. Остальное можно добавить ниже.</p>
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
        <Field label="Симптомы, если хочется отметить">
          <div className="flex flex-wrap gap-2">
            {checkInSymptoms.map((symptom) => (
              <button
                key={symptom}
                className={cn(
                  "rounded-full border px-3 py-2 text-sm font-semibold transition",
                  draft.symptoms.includes(symptom)
                    ? "border-mira-primary bg-mira-primary text-mira-ink"
                    : "border-white/10 bg-mira-background text-mira-muted"
                )}
                onClick={() => toggleListValue("symptoms", symptom)}
                type="button"
              >
                {symptom}
              </button>
            ))}
          </div>
        </Field>

        {!expanded && (
          <Button className="w-full" variant="ghost" onClick={() => setExpanded(true)}>
            Добавить больше
          </Button>
        )}

        {expanded && (
          <>
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
            <Field label="Рабочая нагрузка">
              <ChoiceGrid
                options={["Лёгкая", "Обычная", "Высокая"]}
                value={draft.workload}
                onChange={(workload) => setDraft({ ...draft, workload: workload as CheckInState["workload"] })}
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
                          ? "border-mira-primary bg-mira-primary text-mira-ink"
                          : "border-white/10 bg-mira-background text-mira-muted"
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
            <Field label="Заметка (необязательно)">
              <textarea
                className="min-h-20 w-full resize-y rounded-2xl border border-white/10 bg-mira-background px-4 py-3 text-sm text-mira-text outline-none transition focus:border-mira-primary"
                maxLength={280}
                placeholder="Например: много встреч, хочу оставить вечер спокойнее"
                value={draft.note}
                onChange={(event) => setDraft({ ...draft, note: event.target.value })}
              />
            </Field>
          </>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 pt-1">
        <Button variant="secondary" onClick={onClose}>Отмена</Button>
        <Button onClick={() => onSave(draft)}>Сохранить</Button>
      </div>
    </Card>
  );
}

function DailyReflectionForm({
  initial,
  onClose,
  onSave
}: {
  initial?: DailyReflection;
  onClose: () => void;
  onSave: (value: Omit<DailyReflection, "date">) => void;
}) {
  const [energyAfter, setEnergyAfter] = useState(initial?.energyAfter ?? 6);
  const [painLevel, setPainLevel] = useState(initial?.painLevel ?? 0);
  const [note, setNote] = useState(initial?.note ?? "");

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-4 pb-4">
      <Card className="rounded-t-[2rem] border-b-0 bg-mira-card p-5 shadow-[0_-18px_60px_rgba(0,0,0,0.38)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-mira-muted">Вечерняя отметка</p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">Как ощущения сейчас?</h2>
            <p className="mt-1 text-sm leading-5 text-mira-muted">Можно заполнить за несколько секунд или пропустить.</p>
          </div>
          <Button aria-label="Закрыть вечернюю отметку" className="h-10 w-10 shrink-0 p-0" variant="ghost" onClick={onClose}>
            <span aria-hidden="true">×</span>
          </Button>
        </div>
        <div className="mt-5 space-y-5">
          <Field label={`Ресурс сейчас: ${energyAfter}/10`}>
            <input
              className="slider w-full"
              max={10}
              min={1}
              onChange={(event) => setEnergyAfter(Number(event.target.value))}
              type="range"
              value={energyAfter}
            />
          </Field>
          <Field label={`Боль или дискомфорт сейчас: ${painLevel}/10`}>
            <input
              className="slider w-full"
              max={10}
              min={0}
              onChange={(event) => setPainLevel(Number(event.target.value))}
              type="range"
              value={painLevel}
            />
          </Field>
          <Field label="Короткая заметка (необязательно)">
            <textarea
              className="min-h-20 w-full resize-y rounded-2xl border border-white/10 bg-mira-background px-4 py-3 text-sm text-mira-text outline-none transition focus:border-mira-primary"
              maxLength={280}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Например: прогулка помогла переключиться"
              value={note}
            />
          </Field>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onClose}>Не сейчас</Button>
          <Button onClick={() => onSave({ energyAfter, painLevel, note })}>Сохранить</Button>
        </div>
      </Card>
    </div>
  );
}

function WorkoutScreen({
  profile,
  checkIn,
  gym,
  setGym,
  localData,
  onSaveWorkout
}: {
  profile: OnboardingState;
  checkIn: CheckInState;
  gym: GymState;
  setGym: (gym: GymState) => void;
  localData: MiraLocalData;
  onSaveWorkout: (value: Omit<WorkoutLog, "id" | "date">) => void;
}) {
  const todayMeals = localData.meals.filter((entry) => entry.date === localDateKey());
  const recommendation = useMemo(
    () => buildWorkout(profile, checkIn, gym, { mealsToday: todayMeals.length }),
    [checkIn, gym, profile, todayMeals.length]
  );
  const [generated, setGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [safetyMessage, setSafetyMessage] = useState("");
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [generatedPlan, setGeneratedPlan] = useState<WorkoutPlan | null>(null);
  const [generationSource, setGenerationSource] = useState<"ai" | "fallback">("fallback");
  const highPain = checkIn.painLevel >= 5;
  const todayWorkouts = localData.workouts.filter((entry) => entry.date === localDateKey());
  const displayPlan = generatedPlan ?? recommendation;

  const updateGym = (next: Partial<GymState>) => {
    setGym({ ...gym, ...next });
    setGenerated(false);
    setGeneratedPlan(null);
    setIsGenerating(false);
    setStopped(false);
    setSafetyMessage("");
  };

  const generateWorkout = async () => {
    setIsGenerating(true);
    setSafetyMessage("");
    setStopped(false);

    if (highPain) {
      setGeneratedPlan(recommendation);
      setGenerationSource("fallback");
      setExercises(recommendation.exercises);
      setGenerated(true);
      setIsGenerating(false);
      setSafetyMessage("Выбран режим восстановления без силовой нагрузки.");
      return;
    }

    try {
      const cycleDay = getCycleDay(profile.periodStart, profile.cycleLength);
      const result = await generateWorkoutWithAi({
        profile: {
          trainingPlace: profile.trainingPlace,
          level: profile.level,
          workoutsPerWeek: profile.workoutsPerWeek
        },
        checkIn,
        gym,
        cycle: { day: cycleDay, phase: getCyclePhase(cycleDay) },
        nutrition: {
          mealsToday: todayMeals.length,
          summary: todayMeals.slice(-3).map((meal) => {
            const calories = meal.energyKcal ? `, примерно ${meal.energyKcal.min}-${meal.energyKcal.max} ккал` : "";
            return `${meal.label}${calories}`;
          })
        }
      });
      const aiPlan: WorkoutPlan = {
        ...recommendation,
        ...result.workout,
        time: gym.time,
        readinessScore: recommendation.readinessScore
      };
      setGeneratedPlan(aiPlan);
      setGenerationSource(result.source);
      setExercises(aiPlan.exercises);
      setGenerated(true);
      setSafetyMessage(result.message ?? (result.source === "ai" ? "План Mira AI собран по твоему сегодняшнему контексту." : "Выбран бережный восстановительный режим."));
    } catch {
      setGeneratedPlan(recommendation);
      setGenerationSource("fallback");
      setExercises(recommendation.exercises);
      setGenerated(true);
      setSafetyMessage("AI сейчас недоступен, поэтому использован локальный расчёт по твоим сегодняшним данным.");
    } finally {
      setIsGenerating(false);
    }
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
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm font-semibold text-mira-muted">Почему именно такой план</p>
          <Badge className="bg-mira-background text-mira-text">Нагрузка {displayPlan.readinessScore}/100</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {displayPlan.factors.map((factor) => (
            <span key={factor} className="rounded-full bg-mira-background px-3 py-2 text-xs font-semibold text-mira-muted">
              {factor}
            </span>
          ))}
        </div>
        <p className="text-sm leading-6 text-mira-muted">Доступное время: {gym.time}. Фаза цикла влияет на расчёт мягко и никогда не важнее боли или самочувствия.</p>
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
          Учитываем время, состояние, цикл, рабочую нагрузку и записи еды.
        </div>
      )}

      {generated && (
        <Card className="overflow-hidden p-0">
          <div className="bg-mira-primary p-5 text-mira-ink">
            <Badge className="border-mira-ink/10 bg-mira-ink/10 text-mira-ink">{generationSource === "ai" ? "План Mira AI" : "Локальный алгоритм"}</Badge>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.05em]">{displayPlan.title}</h2>
            <p className="mt-2 text-sm text-mira-ink/75">{displayPlan.time} · {displayPlan.intensity}</p>
          </div>
          <div className="space-y-4 p-5">
            <p className="rounded-2xl bg-mira-background p-4 text-sm leading-6 text-mira-muted">{displayPlan.explanation}</p>
            {displayPlan.nutritionSupport && (
              <div className="rounded-2xl bg-[#30272b] p-4 text-sm leading-6 text-mira-muted">
                <p className="font-bold text-mira-text">Контекст питания</p>
                <p className="mt-1">{displayPlan.nutritionSupport}</p>
              </div>
            )}
            {safetyMessage && <p className="text-sm font-semibold text-mira-primary">{safetyMessage}</p>}
            {!stopped && (
              <>
                <WorkoutBlock title="Разминка" items={[displayPlan.warmup]} />
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
                <WorkoutBlock title="Завершение" items={[displayPlan.cooldown]} />
                <Button className="w-full" size="lg" onClick={() => {
                  onSaveWorkout({
                    status: highPain ? "recovery" : "completed",
                    title: displayPlan.title,
                    durationMinutes: Number.parseInt(displayPlan.time, 10)
                  });
                  setStopped(true);
                  setSafetyMessage(highPain ? "Восстановительная сессия сохранена. Спасибо, что выбрала комфортный темп." : "Тренировка сохранена. Вечером можно добавить короткую отметку о самочувствии.");
                }}>
                  Завершить и сохранить
                </Button>
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
                    onSaveWorkout({
                      status: "skipped",
                      title: displayPlan.title,
                      durationMinutes: 0,
                      note: "Остановлена до завершения"
                    });
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

      <Card className="border-dashed bg-mira-card/60">
        <p className="text-sm font-semibold text-mira-muted">История тренировок</p>
        {todayWorkouts.length ? (
          <div className="mt-3 space-y-2">
            {todayWorkouts.map((entry) => (
              <div key={entry.id} className="rounded-2xl bg-mira-background p-3">
                <p className="text-sm font-bold text-mira-text">{entry.title}</p>
                <p className="mt-1 text-xs leading-5 text-mira-muted">{entry.status === "completed" ? "Завершена" : entry.status === "recovery" ? "Восстановление" : "Остановлена"}{entry.durationMinutes ? ` · ${entry.durationMinutes} мин` : ""}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm leading-6 text-mira-muted">Здесь появятся завершённые тренировки и заметки о том, как они ощущались.</p>
        )}
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
  plan,
  localData,
  onToday
}: {
  profile: OnboardingState;
  plan: ReturnType<typeof buildDailyPlan>;
  localData: MiraLocalData;
  onToday: () => void;
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
    () => Array.from({ length: daysInMonth }, (_, index) => createCalendarDay(index + 1, currentDay, plan, profile, localData, year, month)),
    [currentDay, daysInMonth, localData, month, plan, profile, year]
  );
  const selected = calendarDays[selectedDay - 1];
  const selectedDate = new Date(year, month, selectedDay);
  const weekStart = Math.max(1, selectedDay - ((selectedDate.getDay() + 6) % 7));
  const weekDays = calendarDays.slice(weekStart - 1, Math.min(weekStart + 6, daysInMonth));
  const monthName = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(today);
  const hasLocalEntries = calendarDays.some((day) => day.energy || day.workout || day.nutrition || day.note);

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
                active ? "border-mira-primary bg-mira-card text-mira-text shadow-soft" : "border-transparent bg-mira-card/50 text-mira-muted"
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

      {!hasLocalEntries && (
        <Card className="bg-[#1d302b]">
          <p className="text-sm font-semibold text-mira-muted">Первая запись</p>
          <h2 className="mt-2 text-xl font-black tracking-[-0.04em]">Календарь оживёт с твоим первым чек-ином</h2>
          <p className="mt-2 text-sm leading-6 text-mira-muted">Сейчас здесь есть только ориентиры цикла. Самочувствие, тренировки, еда и заметки появятся после сохранения твоих записей.</p>
          <Button className="mt-4 w-full" onClick={onToday}>Отметить состояние</Button>
        </Card>
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
      <Card className="rounded-t-[2rem] border-b-0 bg-mira-card p-5 shadow-[0_-18px_60px_rgba(0,0,0,0.38)]">
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
          <CalendarDetail label="Состояние" value={day.energy ? `Энергия ${day.energy}/10 · настроение ${day.mood} · сон: ${day.sleep.toLowerCase()}` : "Не отмечено"} />
          <CalendarDetail label="Работа" value={day.workload || "Не отмечена"} />
          <CalendarDetail label="Тренировка" value={day.workout || "Не отмечена"} />
          <CalendarDetail label="Питание" value={day.nutrition || "Нет записей"} />
          {day.note && <CalendarDetail label="Заметка" value={day.note} />}
        </div>
        <div className="mt-4 rounded-2xl bg-[#1d302b] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-mira-muted">Рекомендация на день</p>
          <p className="mt-2 text-sm leading-6 text-mira-text">{day.recommendation}</p>
        </div>
      </Card>
    </div>
  );
}

function CalendarDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-white/10 pb-3 last:border-0 last:pb-0">
      <span className="shrink-0 font-semibold text-mira-muted">{label}</span>
      <span className="text-right leading-5 text-mira-text">{value}</span>
    </div>
  );
}

function createCalendarDay(
  day: number,
  currentDay: number,
  plan: ReturnType<typeof buildDailyPlan>,
  profile: OnboardingState,
  localData: MiraLocalData,
  year: number,
  month: number
): CalendarDay {
  const cycleDay = ((plan.cycleDay - 1 + day - currentDay + profile.cycleLength * 2) % profile.cycleLength) + 1;
  const isPeriod = cycleDay <= 5;
  const isPredictedPeriod = cycleDay >= profile.cycleLength - 2;
  const isFertile = cycleDay >= 11 && cycleDay <= 16;
  const isOvulation = cycleDay === 14;
  const date = localDateKey(new Date(year, month, day));
  const checkIn = localData.checkIns[date]?.value;
  const workout = localData.workouts.find((entry) => entry.date === date);
  const mealCount = localData.meals.filter((entry) => entry.date === date).length;
  const symptoms = checkIn?.symptoms ?? [];
  const busy = checkIn?.workload === "Высокая";
  const energy = checkIn?.energy ?? 0;

  return {
    day,
    cycleDay,
    phase: cycleDay <= 5 ? "Менструальная фаза" : cycleDay <= 12 ? "Фолликулярная фаза" : cycleDay <= 16 ? "Овуляторная фаза" : "Лютеиновая фаза",
    isPeriod,
    isPredictedPeriod,
    isFertile,
    isOvulation,
    symptoms,
    mood: checkIn ? `${checkIn.mood}/10` : "",
    energy,
    sleep: checkIn?.sleep ?? "",
    workload: checkIn ? (busy ? "Высокая нагрузка" : "Обычная нагрузка") : "",
    workout: workout
      ? workout.status === "completed"
        ? `Завершено: ${workout.title}`
        : workout.status === "recovery"
          ? `Восстановление: ${workout.title}`
          : `Пропущено: ${workout.title}`
      : "",
    nutrition: mealCount ? `${mealCount} ${mealCount === 1 ? "приём пищи" : "приёма пищи"}` : "",
    note: localData.notes[date] || checkIn?.note || undefined,
    recommendation: !checkIn
      ? "Записи за этот день пока нет. Добавь короткий чек-ин, когда захочешь сохранить контекст."
      : symptoms.length
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
    ...(day.workload ? ["workload" as const] : []),
    ...(day.workout ? ["workouts" as const] : []),
    ...(day.nutrition ? ["nutrition" as const] : []),
    ...(day.note ? ["notes" as const] : [])
  ];

  return available.filter((layer) => activeLayers.includes(layer));
}

function weekdayShort(year: number, month: number, day: number) {
  return new Intl.DateTimeFormat("ru-RU", { weekday: "short" }).format(new Date(year, month, day)).slice(0, 2);
}

function NutritionScreen({
  checkIn,
  plan,
  localData,
  onSaveMeal
}: {
  checkIn: CheckInState;
  plan: ReturnType<typeof buildDailyPlan>;
  localData: MiraLocalData;
  onSaveMeal: (value: Omit<MealLog, "id" | "date">) => void;
}) {
  const [photoFlowOpen, setPhotoFlowOpen] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeMealOutput | null>(null);
  const [analysisSource, setAnalysisSource] = useState<"ai" | "demo" | "fallback" | null>(null);
  const [analysisMessage, setAnalysisMessage] = useState("");
  const [manualMealOpen, setManualMealOpen] = useState(false);
  const todayMeals = localData.meals.filter((entry) => entry.date === localDateKey());
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

      <Card className="bg-[#1d302b]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-mira-muted">Сводка за сегодня</p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">{todayMeals.length ? `${todayMeals.length} ${todayMeals.length === 1 ? "приём пищи" : "приёма пищи"}` : "Пока без записей"}</h2>
          </div>
          <Badge className="bg-mira-card/80 text-mira-text">На устройстве</Badge>
        </div>
        <p className="mt-3 text-sm leading-6 text-mira-muted">
          {todayMeals.length ? "Записи остаются локально в этом браузере. Ты всегда сможешь добавить контекст позже." : "Добавь еду вручную или через фото, чтобы сохранить контекст дня."}
        </p>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="bg-mira-ink p-5 text-white">
          <p className="text-sm font-semibold text-white/60">Приём пищи</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Покажи, что на тарелке</h2>
          <p className="mt-2 text-sm leading-6 text-white/70">Фото помогает сделать ориентировочную запись. Это не точный подсчёт.</p>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-3">
            <Button className="h-auto min-h-16 whitespace-normal px-3 py-3 text-center" size="lg" onClick={() => setPhotoFlowOpen(true)}>
              <Camera className="h-4 w-4" /> Фото еды
            </Button>
            <Button className="h-auto min-h-16 whitespace-normal px-3 py-3 text-center" size="lg" variant="secondary" onClick={() => setManualMealOpen(true)}>
              <Salad className="h-4 w-4" /> Добавить вручную
            </Button>
          </div>
        </div>
      </Card>

      {analysis && (
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-mira-muted">Анализ блюда</p>
              <h2 className="mt-1 text-xl font-black tracking-[-0.04em]">Ориентировочная оценка</h2>
            </div>
            <Badge className="bg-mira-background text-mira-text">Уверенность {Math.round(analysis.confidence * 100)}%</Badge>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {analysis.foods.map((food) => (
              <span key={food} className="rounded-full bg-mira-background px-3 py-2 text-xs font-semibold text-mira-text">{food}</span>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-mira-background p-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-mira-muted">Калорийность</p>
              <p className="mt-1 text-sm font-bold text-mira-text">{analysis.calories.min}-{analysis.calories.max} ккал</p>
            </div>
            <div className="rounded-2xl bg-mira-background p-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-mira-muted">Белки</p>
              <p className="mt-1 text-sm font-bold text-mira-text">{analysis.macros.protein.min}-{analysis.macros.protein.max} г</p>
            </div>
            <div className="rounded-2xl bg-mira-background p-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-mira-muted">Углеводы</p>
              <p className="mt-1 text-sm font-bold text-mira-text">{analysis.macros.carbs.min}-{analysis.macros.carbs.max} г</p>
            </div>
            <div className="rounded-2xl bg-mira-background p-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-mira-muted">Жиры</p>
              <p className="mt-1 text-sm font-bold text-mira-text">{analysis.macros.fat.min}-{analysis.macros.fat.max} г</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-[#30272b] p-4">
            <p className="text-sm font-semibold text-mira-text">Что может повлиять на оценку</p>
            <p className="mt-1 text-sm leading-6 text-mira-muted">{analysis.uncertaintyFactors.join(", ")}. {analysis.note}</p>
          </div>
          {analysisSource && <p className="mt-3 text-xs leading-5 text-mira-muted">{analysisSource === "ai" ? "Оценка создана AI по одному фото и остаётся приблизительной." : analysisMessage}</p>}
        </Card>
      )}

      <Card>
        <p className="text-sm font-semibold text-mira-muted">Что может поддержать дальше</p>
        <p className="mt-2 text-sm leading-6 text-mira-text">{recommendation}</p>
      </Card>

      <Card className="border-dashed bg-mira-card/60">
        <p className="text-sm font-semibold text-mira-muted">История питания</p>
        {todayMeals.length ? (
          <div className="mt-3 space-y-2">
            {todayMeals.map((meal) => (
              <div key={meal.id} className="rounded-2xl bg-mira-background p-3">
                <p className="text-sm font-bold text-mira-text">{meal.label}</p>
                <p className="mt-1 text-xs text-mira-muted">
                  {meal.source === "manual"
                    ? "Добавлено вручную"
                    : meal.source === "photo-ai"
                      ? `AI-оценка: ${meal.energyKcal?.min ?? 0}-${meal.energyKcal?.max ?? 0} ккал`
                      : "Ориентировочный demo-анализ"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm leading-6 text-mira-muted">Здесь появятся сохранённые приёмы пищи и твои уточнения к оценкам.</p>
        )}
      </Card>

      {photoFlowOpen && (
        <MealPhotoFlow
          onClose={() => setPhotoFlowOpen(false)}
          onAnalyze={async (image) => {
            const result = await analyzeMealPhoto(image, { energy: checkIn.energy, symptoms: checkIn.symptoms });
            setAnalysis(result.analysis);
            setAnalysisSource(result.source);
            setAnalysisMessage(result.message ?? "");
            onSaveMeal({
              label: result.analysis.foods.join(", "),
              source: result.source === "ai" ? "photo-ai" : "photo-demo",
              energyKcal: result.analysis.calories,
              confidence: result.analysis.confidence,
              note: result.analysis.note
            });
            setPhotoFlowOpen(false);
          }}
        />
      )}

      {manualMealOpen && (
        <ManualMealForm
          onClose={() => setManualMealOpen(false)}
          onSave={(value) => {
            onSaveMeal({ label: value.label, source: "manual", note: value.note || undefined });
            setManualMealOpen(false);
          }}
        />
      )}
    </div>
  );
}

function MealPhotoFlow({ onClose, onAnalyze }: { onClose: () => void; onAnalyze: (image: File) => Promise<void> }) {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [hasConsent, setHasConsent] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const selectPhoto = (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) {
      setFile(null);
      setFileName("");
      setFileError("Выбери изображение JPEG, PNG или WebP размером до 8 МБ.");
      return;
    }
    setFileError("");
    setFile(file);
    setFileName(file.name);
  };

  const submit = async () => {
    if (!file || !hasConsent) return;
    setIsAnalyzing(true);
    try {
      await onAnalyze(file);
    } catch {
      setFileError("Не удалось отправить фото на анализ. Попробуй ещё раз или добавь еду вручную.");
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-4 pb-4">
      <Card className="rounded-t-[2rem] border-b-0 bg-mira-card p-5 shadow-[0_-18px_60px_rgba(0,0,0,0.38)]">
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
          <span className="mt-1 text-xs leading-5 text-mira-muted">Поддерживаются JPEG, PNG и WebP до 8 МБ.</span>
          <input
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => selectPhoto(event.target.files?.[0])}
          />
        </label>
        {fileError && <p className="mt-3 rounded-2xl bg-[#30272b] p-3 text-sm leading-6 text-mira-text" role="alert">{fileError}</p>}
        <label className="mt-4 flex items-start gap-3 rounded-2xl bg-mira-background p-4 text-sm leading-6 text-mira-muted">
          <input
            checked={hasConsent}
            className="mt-1 h-4 w-4 shrink-0 accent-mira-primary"
            onChange={(event) => setHasConsent(event.target.checked)}
            type="checkbox"
          />
          <span>Я согласна отправить это фото в настроенный AI-сервис для приблизительной оценки блюда. Фото не сохраняется в локальной истории Mira.</span>
        </label>
        <p className="mt-4 text-sm leading-6 text-mira-muted">Результат покажет диапазоны калорий и БЖУ с уверенностью и видимой неопределённостью. Это не точный подсчёт.</p>
        <Button className="mt-4 w-full" disabled={!file || !hasConsent || isAnalyzing} size="lg" onClick={submit}>
          {isAnalyzing ? "Анализируем фото..." : "Проанализировать фото"}
        </Button>
      </Card>
    </div>
  );
}

function ManualMealForm({
  onClose,
  onSave
}: {
  onClose: () => void;
  onSave: (value: { label: string; note: string }) => void;
}) {
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-4 pb-4">
      <Card className="rounded-t-[2rem] border-b-0 bg-mira-card p-5 shadow-[0_-18px_60px_rgba(0,0,0,0.38)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-mira-muted">Приём пищи</p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">Добавить без фото</h2>
            <p className="mt-1 text-sm leading-5 text-mira-muted">Короткой заметки достаточно. Не нужно считать калории или порции.</p>
          </div>
          <Button aria-label="Закрыть запись еды" className="h-10 w-10 shrink-0 p-0" variant="ghost" onClick={onClose}>
            <span aria-hidden="true">×</span>
          </Button>
        </div>
        <div className="mt-5 space-y-4">
          <Field label="Что было в приёме пищи?">
            <input
              autoFocus
              className="w-full rounded-2xl border border-white/10 bg-mira-background px-4 py-3 text-sm text-mira-text outline-none transition focus:border-mira-primary"
              maxLength={120}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Например: суп и хлеб, йогурт с ягодами"
              value={label}
            />
          </Field>
          <Field label="Заметка (необязательно)">
            <textarea
              className="min-h-20 w-full resize-y rounded-2xl border border-white/10 bg-mira-background px-4 py-3 text-sm text-mira-text outline-none transition focus:border-mira-primary"
              maxLength={280}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Например: поела между встречами"
              value={note}
            />
          </Field>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
          <Button disabled={!label.trim()} onClick={() => onSave({ label: label.trim(), note: note.trim() })}>Сохранить</Button>
        </div>
      </Card>
    </div>
  );
}

function AnalyticsScreen({
  profile,
  plan,
  checkIn,
  localData,
  onToday
}: {
  profile: OnboardingState;
  plan: ReturnType<typeof buildDailyPlan>;
  checkIn: CheckInState;
  localData: MiraLocalData;
  onToday: () => void;
}) {
  const records = Object.values(localData.checkIns).sort((a, b) => a.date.localeCompare(b.date));
  const recent = records.slice(-7);
  const minimumForPatterns = 3;
  const missingRecords = Math.max(0, minimumForPatterns - records.length);
  const average = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
  const energyValues = recent.map((record) => record.value.energy);
  const moodValues = recent.map((record) => record.value.mood);
  const painValues = recent.map((record) => record.value.painLevel);
  const sleepValues = recent.map((record) => record.value.sleep === "Хорошо" ? 3 : record.value.sleep === "Нормально" ? 2 : 1);
  const cravingCount = recent.filter((record) => record.value.symptoms.includes("тяга")).length;
  const completedWorkouts = localData.workouts.filter((entry) => entry.status === "completed").length;
  const recoveryDays = localData.workouts.filter((entry) => entry.status === "recovery").length;
  const painReplacements = localData.workouts.filter((entry) => entry.note?.includes("боль")).length;
  const insights = [
    `За последние ${recent.length} ${recent.length === 1 ? "день" : "дня"} средняя энергия была ${average(energyValues)}/10.`,
    checkIn.stress >= 7
      ? "Сегодня стресс выше обычного. Учитывай его рядом с любыми выводами о нагрузке."
      : "Один день не объясняет закономерность: Mira покажет паттерны только по нескольким отметкам.",
    `Текущая фаза «${plan.phase.toLowerCase()}» остаётся контекстом, а не правилом для твоего тела.`
  ];

  return (
    <div className="space-y-4 pb-8">
      <section className="px-1">
        <p className="text-sm font-semibold text-mira-muted">Аналитика</p>
        <h1 className="mt-1 text-3xl font-black tracking-[-0.05em]">Паттерны, а не оценки</h1>
        <p className="mt-2 text-sm leading-6 text-mira-muted">Здесь появляются только твои сохранённые записи. Они не объясняют причины и не заменяют профессиональную помощь.</p>
      </section>

      {records.length < minimumForPatterns && (
        <Card className="bg-[#1d302b]">
          <p className="text-sm font-semibold text-mira-muted">Первые наблюдения</p>
          <h2 className="mt-2 text-xl font-black tracking-[-0.04em]">
            {missingRecords ? `Нужно ещё ${missingRecords} ${missingRecords === 1 ? "чек-ин" : "чек-ина"}` : "Данные готовы"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-mira-muted">После трёх сохранённых чек-инов Mira сможет показать простую сводку самочувствия. Персональные паттерны появятся только после достаточного количества записей.</p>
          <Button className="mt-4 w-full" onClick={onToday}>Отметить состояние</Button>
        </Card>
      )}

      <Card>
        <p className="text-sm font-semibold text-mira-muted">Текущий цикл</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <AnalyticsMetric label="Настройка цикла" value={`${profile.cycleLength} дн.`} />
          <AnalyticsMetric label="День цикла" value={`${plan.cycleDay}`} />
          <AnalyticsMetric label="Записей" value={`${records.length}`} />
        </div>
        <p className="mt-4 text-sm leading-6 text-mira-muted">Текущая фаза: {plan.phase}. Оценки цикла остаются ориентировочными.</p>
      </Card>

      {records.length >= minimumForPatterns && (
        <>
          <Card>
            <p className="text-sm font-semibold text-mira-muted">Симптомы и состояние</p>
            <p className="mt-1 text-sm leading-6 text-mira-muted">Сводка последних {recent.length} сохранённых чек-инов.</p>
            <div className="mt-4 space-y-4">
              <AnalyticsTrend label="Боль" values={painValues} note={`Среднее: ${average(painValues)}/10.`} />
              <AnalyticsTrend label="Настроение" values={moodValues} note={`Среднее: ${average(moodValues)}/10.`} positive />
              <AnalyticsTrend label="Энергия" values={energyValues} note={`Среднее: ${average(energyValues)}/10.`} positive />
              <AnalyticsTrend label="Сон" values={sleepValues} note="Шкала: плохо, нормально, хорошо." positive />
            </div>
          </Card>

          <Card className="bg-[#30272b]">
            <p className="text-sm font-semibold text-mira-muted">Работа и ресурс</p>
            <h2 className="mt-2 text-xl font-black tracking-[-0.04em]">Контекст без выводов за тебя</h2>
            <p className="mt-2 text-sm leading-6 text-mira-muted">Высокая рабочая нагрузка отмечена в {recent.filter((record) => record.value.workload === "Высокая").length} из {recent.length} последних чек-инов. Это наблюдение, а не объяснение причины.</p>
          </Card>

          <Card>
            <p className="text-sm font-semibold text-mira-muted">Тренировки</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <AnalyticsMetric label="Завершено" value={`${completedWorkouts}`} />
              <AnalyticsMetric label="Восстановление" value={`${recoveryDays}`} />
              <AnalyticsMetric label="Пропущено" value={`${localData.workouts.filter((entry) => entry.status === "skipped").length}`} />
              <AnalyticsMetric label="Реакция на боль" value={`${painReplacements}`} />
            </div>
            <p className="mt-4 text-sm leading-6 text-mira-muted">Восстановительные дни - часть плана, а не пропуск результата.</p>
          </Card>

          <Card>
            <p className="text-sm font-semibold text-mira-muted">Питание</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <AnalyticsMetric label="Записи еды" value={`${localData.meals.length}`} />
              <AnalyticsMetric label="Отметки тяги" value={`${cravingCount}`} />
            </div>
            <p className="mt-4 text-sm leading-6 text-mira-muted">Отметки помогают заметить контекст, а не оценивать питание.</p>
          </Card>

          <Card className="bg-mira-ink text-white">
            <p className="text-sm font-semibold text-white/60">Наблюдения</p>
            <h2 className="mt-2 text-xl font-black tracking-[-0.04em]">Контекст из твоих записей</h2>
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
        </>
      )}
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
      <Card className="bg-[#1d302b]">
        <p className="text-sm font-semibold text-mira-muted">Навигатор здоровья</p>
        <h2 className="mt-2 text-xl font-black tracking-[-0.04em]">Понять, что стоит обсудить</h2>
        <p className="mt-2 text-sm leading-6 text-mira-muted">Это спокойный обзор паттернов из самоотчёта, а не медицинская оценка.</p>

        <div className="mt-4 rounded-2xl bg-mira-card/80 p-4">
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
                    selectedLevel === signal.level ? "border-mira-primary bg-mira-background" : "border-white/10 bg-mira-card"
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
            <div className="rounded-2xl bg-[#30272b] p-4">
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
    <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4 last:border-0 last:pb-0">
      <div>
        <p className="text-sm font-bold text-mira-text">{label}</p>
        <p className="mt-1 text-sm leading-5 text-mira-muted">{description}</p>
      </div>
      <button
        aria-checked={checked}
        aria-label={label}
        className={cn(
          "mt-1 flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition",
          checked ? "bg-mira-primary" : "bg-white/15"
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
        <Badge className="bg-mira-card/80">Прототип</Badge>
        <button
          aria-label="Открыть профиль и настройки"
          className="grid h-11 w-11 place-items-center rounded-full bg-mira-primary text-mira-ink shadow-soft"
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
    <nav aria-label="Основная навигация" className="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 mx-auto grid max-w-md grid-cols-5 gap-1 rounded-full border border-white/10 bg-mira-card/95 p-2 shadow-soft backdrop-blur">
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
            data-tour={item.id === "calendar" ? "nav-calendar" : item.id === "workouts" ? "nav-workouts" : undefined}
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
              : "border-white/10 bg-mira-background text-mira-text"
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

function MultiChoiceGrid({
  options,
  values,
  onChange
}: {
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((option) => {
        const selected = values.includes(option);
        return (
          <button
            key={option}
            aria-pressed={selected}
            className={cn(
              "rounded-2xl border px-4 py-3 text-left text-sm font-bold transition",
              selected
                ? "border-mira-primary bg-mira-primary text-white shadow-glow"
                : "border-white/10 bg-mira-background text-mira-text"
            )}
            onClick={() =>
              onChange(selected ? values.filter((value) => value !== option) : [...values, option])
            }
            type="button"
          >
            {option}
          </button>
        );
      })}
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
      <MiraSymbol />
      <div>
        <p className="text-lg font-black tracking-[-0.05em]">mira</p>
        <p className="text-xs font-semibold text-mira-muted">ИИ-коуч для тела</p>
      </div>
    </div>
  );
}

function MiraSymbol() {
  return (
    <div aria-label="Логотип Mira" className="grid h-12 w-12 place-items-center rounded-2xl bg-mira-ink shadow-soft" role="img">
      <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="12" stroke="#45443f" strokeWidth="3" />
        <path d="M18 6a12 12 0 0 1 10.8 6.8" stroke="#76D7F3" strokeLinecap="round" strokeWidth="3" />
        <path d="M28.8 24.3A12 12 0 0 1 18 30" stroke="#76D7F3" strokeLinecap="round" strokeWidth="3" />
        <circle cx="29.2" cy="16.4" fill="#EF4653" r="2.5" />
      </svg>
    </div>
  );
}
