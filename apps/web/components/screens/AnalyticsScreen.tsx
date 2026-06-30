"use client";

import { useEffect, useState } from "react";
import type React from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CloudSun,
  Droplets,
  Dumbbell,
  FileText,
  Footprints,
  Heart,
  Moon,
  Scale,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PagePurposeCard } from "@/components/ui/PagePurposeCard";
import { getRedFlags } from "@/lib/alerts";
import { analyticsDemoUsers } from "@/lib/analyticsDemoUsers";
import { getCycleNorm } from "@/lib/cycleEngine";
import { getCycleAnalytics } from "@/lib/cycleAnalytics";
import { getCyclePhase } from "@/lib/store";
import type { DailyCheckIn } from "@/lib/types";
import type { ScreenProps } from "./types";

const PHASE_LABELS: Record<string, string> = {
  menstruation: "Менструация",
  follicular: "Фолликулярная",
  ovulation: "Овуляция",
  luteal: "Лютеиновая",
};

type ConfidenceLevel = "low" | "early" | "medium" | "strong";

const confidenceText: Record<ConfidenceLevel, { label: string; body: string }> = {
  low: { label: "Мало данных", body: "Пока рано делать вывод" },
  early: { label: "Первые признаки", body: "Похоже, это может повторяться" },
  medium: { label: "Средняя уверенность", body: "Это повторяется в нескольких циклах" },
  strong: { label: "Сильная связь", body: "Есть устойчивая закономерность" },
};

function getConfidenceLevel(count: number, cycles: number): ConfidenceLevel {
  if (count <= 1) return "low";
  if (count <= 3 || cycles < 2) return "early";
  if (count <= 7 || cycles < 3) return "medium";
  return "strong";
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function countEntries(checkIns: DailyCheckIn[], predicate: (checkIn: DailyCheckIn) => boolean) {
  return checkIns.filter(predicate).length;
}

function TopMetric({
  title,
  value,
  detail,
  icon,
  tone = "purple",
}: {
  title: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  tone?: "purple" | "pink" | "amber" | "blue";
}) {
  const toneClass = {
    purple: "from-white to-[#F6F1FF] text-mira-primary",
    pink: "from-white to-[#FFF0F6] text-[#FF5F9D]",
    amber: "from-white to-[#FFF6E6] text-[#F09A38]",
    blue: "from-white to-[#EEF7FF] text-[#4686D9]",
  }[tone];

  return (
    <Card className={`min-h-[176px] bg-gradient-to-br ${toneClass} p-5`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="text-sm font-bold text-mira-text">{title}</p>
        <span className="rounded-full bg-white/80 p-2 shadow-sm">{icon}</span>
      </div>
      <p className="text-2xl font-black leading-tight">{value}</p>
      <p className="mt-3 text-xs leading-relaxed text-mira-muted">{detail}</p>
    </Card>
  );
}

function PatternCard({
  icon,
  title,
  body,
  confidence,
  action,
  why,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  confidence: ConfidenceLevel;
  action: string;
  why?: string;
}) {
  const meta = confidenceText[confidence];

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-mira-primary">{icon}</span>
        <p className="text-sm font-bold text-mira-text">{title}</p>
      </div>
      <p className="min-h-12 text-xs leading-relaxed text-mira-muted">{body}</p>
      {why && (
        <div className="mt-3 rounded-2xl bg-mira-bg px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Почему важно</p>
          <p className="mt-1 text-[11px] leading-relaxed text-mira-text">{why}</p>
        </div>
      )}
      <div className="mt-4 rounded-2xl bg-white px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Уверенность</p>
        <p className="mt-1 text-xs font-black text-mira-text">{meta.label}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-mira-muted">{meta.body}</p>
      </div>
      <div className="mt-2 rounded-2xl bg-mira-bg px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Что делать</p>
        <p className="mt-1 text-xs font-semibold leading-relaxed text-mira-text">{action}</p>
      </div>
    </Card>
  );
}

function CareInsight({
  icon,
  title,
  value,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-mira-lavender/20 bg-mira-bg p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-mira-primary shadow-sm">
          {icon}
        </span>
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-mira-primary">{value}</span>
      </div>
      <p className="text-sm font-bold text-mira-text">{title}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-mira-muted">{body}</p>
    </div>
  );
}

function DemoUsersCard({ activeName, onLoad }: { activeName?: string; onLoad: (index: number) => void }) {
  return (
    <Card className="mb-5 border-mira-primary/10 bg-white p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Dev-сценарии аналитики</p>
          <p className="mt-1 text-sm font-bold text-mira-text">Проверка разных состояний продукта</p>
        </div>
        <p className="text-xs text-mira-muted">Внутренний режим: данные заменят текущий локальный профиль</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {analyticsDemoUsers.map((user, index) => {
          const isActive = activeName === user.name;
          return (
            <button
              key={user.id}
              type="button"
              onClick={() => onLoad(index)}
              className={`rounded-2xl border p-3 text-left transition active:scale-[0.99] ${
                isActive ? "border-mira-primary bg-mira-lavender-light/60" : "border-mira-lavender/20 bg-mira-bg hover:border-mira-primary/25"
              }`}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-mira-text">{user.label}</p>
                  <p className="text-[11px] font-semibold text-mira-primary">{user.name}</p>
                </div>
                {isActive && <CheckCircle2 className="h-4 w-4 shrink-0 text-mira-primary" />}
              </div>
              <p className="min-h-10 text-[11px] leading-relaxed text-mira-muted">{user.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {user.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-mira-muted">{tag}</span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function AnalyticsEmptyState({
  title,
  body,
  onCheckIn,
  onPeriod,
  onProfile,
}: {
  title: string;
  body: string;
  onCheckIn?: () => void;
  onPeriod?: () => void;
  onProfile?: () => void;
}) {
  return (
    <Card className="border-mira-primary/10 bg-white p-6 shadow-[0_12px_32px_rgba(45,38,64,0.05)]">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-mira-lavender-light text-mira-primary">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-black text-mira-text">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-mira-muted">{body}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {onCheckIn && <Button onClick={onCheckIn}>Добавить состояние</Button>}
            {onPeriod && <Button variant="outline" onClick={onPeriod}>Отметить месячные</Button>}
            {onProfile && <Button onClick={onProfile}>Добавить дату</Button>}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function AnalyticsScreen({ data, persist, navigate, onCheckIn }: ScreenProps) {
  const [showDebugTools, setShowDebugTools] = useState(false);
  const profile = data.profile;
  const checkIns = Object.values(data.checkIns).sort((a, b) => a.date.localeCompare(b.date));
  const totalDays = checkIns.length;
  const norm = getCycleNorm(profile);
  const cycleAnalytics = getCycleAnalytics(data);
  const redFlags = getRedFlags(data);

  const pmsEntries = checkIns.filter(c => c.pms && c.pms.symptoms.length > 0);
  const lowEnergyEntries = checkIns.filter(c => c.energy?.value === "low" || c.energy?.value === "exhausted");
  const sleepEntries = checkIns.filter(c => c.sleep);
  const badSleepEntries = checkIns.filter(c => c.sleep?.quality === "bad" || c.sleep?.quality === "little" || c.sleep?.quality === "insomnia");
  const anxietyEntries = checkIns.filter(c => c.mood?.value === "anxiety" || c.symptomLog?.anxiety || c.pms?.symptoms.some(symptom => symptom.toLowerCase().includes("трев")));
  const workoutEntries = data.workouts.length;
  const waterEntries = Object.values(data.waterLog ?? {});
  const walkingEntries = Object.values(data.walkingLog ?? {});
  const weightEntries = Object.values(data.weightLog ?? {});
  const enoughWalkingDays = walkingEntries.filter(entry => entry.steps >= Math.min(entry.goal, 5000)).length;
  const lowWaterDays = waterEntries.filter(entry => entry.glasses < 4).length;
  const latestWeight = weightEntries.sort((a, b) => b.date.localeCompare(a.date))[0];
  const previousWeight = weightEntries.filter(entry => latestWeight && entry.date < latestWeight.date).sort((a, b) => b.date.localeCompare(a.date))[0];
  const weightDelta = latestWeight && previousWeight ? Math.round((latestWeight.weight - previousWeight.weight) * 10) / 10 : null;

  const overallConfidence = totalDays >= 21 && norm.observedCycles >= 3
    ? "strong"
    : totalDays >= 10 && norm.observedCycles >= 2
      ? "medium"
      : totalDays >= 4
        ? "early"
        : "low";
  const confidenceLabel = confidenceText[overallConfidence].label;
  const periodIn = Math.max(0, norm.daysUntilPeriod);
  const pmsIn = Math.max(0, periodIn - 3);
  const currentPhase = getCyclePhase(norm.cycleDay, profile?.cycleConfig.periodLength ?? 5, norm.cycleLength);
  const cycleStatusText = norm.isDelayed ? `Задержка ${norm.delayDays} дн.` : `День цикла: ${norm.cycleDay} из ${norm.cycleLength}`;
  const nextPeriodStart = addDays(new Date(`${norm.lastPeriodStart}T00:00:00`), norm.cycleLength).toISOString().slice(0, 10);
  const isLearning = totalDays < 7;
  const maturity = totalDays < 7 ? "learning" : norm.observedCycles < 2 ? "early" : norm.observedCycles < 3 ? "pattern" : "strong";
  const maturityText = {
    learning: "Пока рано делать вывод: нужны первые ежедневные отметки.",
    early: "Похоже, некоторые состояния могут повторяться.",
    pattern: "Есть повторы в нескольких циклах, но Mira продолжает уточнять связь.",
    strong: "Есть устойчивая закономерность, если отметки продолжат повторяться.",
  }[maturity];
  const mainInsight = isLearning
    ? "Mira пока учится понимать твой цикл"
    : redFlags[0]?.title ?? cycleAnalytics?.headline ?? "Mira заметила первые повторения";
  const mainBody = isLearning
    ? "Mira не делает выводы наугад. Отметь боль, настроение, энергию и сон ещё несколько дней — тогда здесь появятся первые личные закономерности."
    : redFlags[0]?.body ?? cycleAnalytics?.insight ?? "Похоже, некоторые состояния могут повторяться. Нужно ещё немного данных, чтобы подтвердить связь.";

  function loadDemoUser(index: number) {
    const demo = analyticsDemoUsers[index];
    if (!demo) return;
    persist(demo.build());
  }

  const sleepEnergyConfidence = getConfidenceLevel(Math.min(badSleepEntries.length, lowEnergyEntries.length), norm.observedCycles);
  const anxietyCycleConfidence = getConfidenceLevel(Math.min(anxietyEntries.length, pmsEntries.length || anxietyEntries.length), norm.observedCycles);
  const patterns = [
    {
      title: "Сон и энергия",
      body: badSleepEntries.length > 0 && lowEnergyEntries.length > 0
        ? "Похоже, плохой сон часто совпадает с низкой энергией на следующий день. Mira заметила это в нескольких отметках. Нужно ещё немного данных, чтобы подтвердить связь."
        : "Пока данных мало. Отмечай сон и энергию, чтобы Mira проверила, есть ли между ними повтор.",
      why: "Если связь подтвердится, можно заранее беречь сон перед днями, когда энергия обычно ниже.",
      confidence: sleepEnergyConfidence,
      action: "Следить за сном ещё 7 дней и отмечать энергию утром.",
      icon: <Moon className="h-4 w-4" />,
    },
    {
      title: "Тревога и цикл",
      body: anxietyEntries.length > 0
        ? "Похоже, тревога чаще появляется перед месячными. Mira видит первые совпадения, но ещё уточняет, повторится ли это в следующем цикле."
        : "Пока нет достаточных отметок тревоги. Если тревога появляется, отмечай настроение рядом с днём цикла.",
      why: "Так легче не винить себя и заранее снижать нагрузку в эмоционально сложные дни.",
      confidence: anxietyCycleConfidence,
      action: "Отмечать настроение каждый день до следующего цикла.",
      icon: <Heart className="h-4 w-4" />,
    },
    {
      title: "Забота и самочувствие",
      body: walkingEntries.length > 0 || waterEntries.length > 0
        ? "Mira видит первые данные по воде, ходьбе и самочувствию. Пока это наблюдение, а не вывод."
        : "Добавь воду и ходьбу в разделе Забота, чтобы Mira смогла проверить возможные связи.",
      why: "Данные заботы помогают отличать влияние цикла от сна, воды, нагрузки и восстановления.",
      confidence: getConfidenceLevel(walkingEntries.length + waterEntries.length, norm.observedCycles),
      action: "Добавлять воду и ходьбу хотя бы 7 дней подряд.",
      icon: <Footprints className="h-4 w-4" />,
    },
  ];
  const visiblePatterns = isLearning ? [] : patterns;

  const nextActions = [
    redFlags.length > 0
      ? "Показать повторяющийся сигнал врачу."
      : totalDays < 7
        ? `Сделать ещё ${Math.max(1, 7 - totalDays)} отметок состояния, чтобы первый вывод стал точнее.`
        : "Продолжать отмечать боль, настроение и энергию в ключевые дни цикла.",
    periodIn <= 3
      ? "Подготовить аптечку, воду и спокойный режим на ближайшие дни."
      : "Отмечать сон и нагрузку, чтобы Mira нашла связь с энергией.",
    waterEntries.length < 3 || walkingEntries.length < 3
      ? "Добавить воду и ходьбу в разделе Забота хотя бы 3 дня подряд."
      : "Сравнить заботу с самочувствием после следующего цикла.",
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setShowDebugTools(process.env.NODE_ENV !== "production" && params.get("debug") === "true");
  }, []);

  const hasCycleData = Boolean(profile?.cycleConfig.periodStart);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-mira-text">Аналитика</h1>
          <p className="mt-1 text-sm leading-relaxed text-mira-muted">
            Здесь Mira ищет повторы по циклу, боли, энергии, настроению, сну и заботе.
          </p>
        </div>
      </div>

      {showDebugTools ? (
        <DemoUsersCard activeName={profile?.name} onLoad={loadDemoUser} />
      ) : (
        <Card className="border-mira-primary/10 bg-white p-5 shadow-[0_12px_32px_rgba(45,38,64,0.05)]">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-mira-lavender-light text-mira-primary">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Твоя аналитика</p>
              <h2 className="mt-1 text-lg font-black text-mira-text">Mira ищет повторения, а не оценивает тебя</h2>
              <p className="mt-2 text-sm leading-relaxed text-mira-muted">
                Mira смотрит на цикл, симптомы, сон, энергию и заботу, чтобы находить повторения и помогать подготовиться к врачу.
              </p>
            </div>
          </div>
        </Card>
      )}

      {!hasCycleData ? (
        <AnalyticsEmptyState
          title="Mira пока не знает твой цикл"
          body="Добавь дату последних месячных, чтобы получить прогноз."
          onProfile={() => navigate("profile")}
        />
      ) : totalDays < 3 ? (
        <AnalyticsEmptyState
          title="Пока мало данных для выводов"
          body="Отмечай состояние 3-5 дней, и Mira начнёт замечать первые повторения."
          onCheckIn={onCheckIn}
          onPeriod={onCheckIn}
        />
      ) : (
      <>

      <Card className="overflow-hidden border-mira-primary/15 bg-white p-5">
        <div className="grid gap-4 lg:grid-cols-[1.7fr_0.8fr]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Главный вывод</p>
            <h2 className="mt-1 text-xl font-black text-mira-text">
              {isLearning ? mainInsight : `Mira заметила: ${mainInsight}`}
            </h2>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-mira-bg p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Что заметила</p>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-mira-text">{mainBody}</p>
              </div>
              <div className="rounded-2xl bg-mira-bg p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Почему важно</p>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-mira-text">
                  Это помогает заранее подготовить день, снизить тревогу и прийти к врачу с фактами, если симптом повторяется.
                </p>
              </div>
              <div className="rounded-2xl bg-mira-bg p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Что делать дальше</p>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-mira-text">{nextActions[0]}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-mira-lavender-light/35 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Насколько вывод надёжный</p>
            <p className="mt-1 text-xl font-black text-mira-text">{confidenceLabel}</p>
            <p className="mt-1 text-xs leading-relaxed text-mira-muted">
              {confidenceText[overallConfidence].body}. {totalDays >= 7 ? "Mira всё ещё проверяет связь по новым отметкам." : `Ещё ${Math.max(1, 7 - totalDays)} отметок — и выводы станут точнее.`}
            </p>
            <div className="mt-3 rounded-xl bg-white/70 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Комментарий</p>
              <p className="mt-1 text-[11px] font-semibold leading-relaxed text-mira-text">{maturityText}</p>
            </div>
          </div>
        </div>
        {redFlags.length > 0 && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => navigate("report")}>
              <FileText className="h-4 w-4" /> Показать врачу
            </Button>
          </div>
        )}
      </Card>

      <PagePurposeCard
        items={[
          { label: "Зачем", title: "Понять повторы", body: "Mira ищет, что повторяется по циклам, симптомам, сну, энергии и заботе." },
          { label: "Что сделать", title: "Смотри вывод", body: "Начни с верхней карточки: что замечено, почему важно и какой следующий шаг." },
          { label: "Что получишь", title: "Меньше догадок", body: "Поймёшь, что готовить заранее и что стоит вынести врачу." },
        ]}
      />

      <div className="px-1">
        <p className="text-sm font-bold text-mira-text">Прогноз</p>
        <p className="mt-1 text-xs leading-relaxed text-mira-muted">Календарная часть: когда ждать месячные, ПМС и текущая фаза.</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <TopMetric
          title="Следующие месячные"
          value={periodIn === 0 ? "могут начаться" : `через ${periodIn} дн.`}
          detail={`Ожидаемое окно: ${formatDate(nextPeriodStart)} · ${confidenceLabel.toLowerCase()}`}
          icon={<CalendarDays className="h-4 w-4" />}
          tone="pink"
        />
        <TopMetric
          title="Возможные симптомы перед месячными"
          value={pmsIn === 0 ? "сейчас" : `через ${pmsIn} дн.`}
          detail={pmsEntries.length > 0 ? `Повторяется в ${Math.min(3, pmsEntries.length)} из ${Math.max(3, norm.observedCycles || 3)} циклов` : "Появится точнее после отметок ПМС"}
          icon={<Zap className="h-4 w-4" />}
          tone="amber"
        />
        <TopMetric
          title="Фаза цикла"
          value={PHASE_LABELS[currentPhase] ?? "Фаза"}
          detail={`${cycleStatusText}. Mira не ставит диагноз, но помогает спокойно разобраться.`}
          icon={<CloudSun className="h-4 w-4" />}
          tone="purple"
        />
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-mira-text">Что повторяется</p>
            <p className="mt-1 text-xs leading-relaxed text-mira-muted">
              Это главная часть аналитики: что повторяется именно у тебя.
            </p>
          </div>
        </div>
        {visiblePatterns.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {visiblePatterns.map(pattern => (
              <PatternCard
                key={pattern.title}
                icon={pattern.icon}
                title={pattern.title}
                body={pattern.body}
                why={pattern.why}
                confidence={pattern.confidence}
                action={pattern.action}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-mira-lavender/40 bg-mira-bg p-4">
            <p className="text-sm font-bold text-mira-text">Mira пока собирает первые повторы</p>
            <p className="mt-1 text-xs leading-relaxed text-mira-muted">
              Отметь ещё {Math.max(1, 3 - Math.min(3, totalDays))} дн. боль, настроение и энергию, чтобы Mira заметила первое повторение.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {["Боль", "Настроение", "Энергия"].map(item => (
                <div key={item} className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-mira-text">{item}</div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card className="border-mira-primary/15 bg-white p-5">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mira-lavender-light text-mira-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Что сделать</p>
            <p className="mt-1 text-sm font-bold text-mira-text">Что сделать по этим выводам</p>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          {nextActions.map((item, index) => (
            <div key={item} className="rounded-2xl bg-mira-bg px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Шаг {index + 1}</p>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-mira-text">{item}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className={`p-5 ${redFlags.length > 0 ? "border-[#F2A14A]/30 bg-[#FFF6E6]" : "border-[#B6E4C7]/40 bg-[#F2FBF5]"}`}>
        <div className="flex items-start gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ${redFlags.length > 0 ? "text-[#F2A14A]" : "text-[#4D9D69]"}`}>
            {redFlags.length > 0 ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          </span>
          <div>
            <p className="text-sm font-bold text-mira-text">{redFlags.length > 0 ? "Это стоит обсудить с врачом" : "Серьёзных сигналов не видно"}</p>
            <p className="mt-1 text-xs leading-relaxed text-mira-muted">
              {redFlags.length > 0 ? `${redFlags[0].title}. Это не диагноз, но хороший повод показать историю симптомов.` : "Продолжай отмечать состояние. Если появится повторяющаяся сильная боль, кровь между месячными или сильная слабость, Mira выделит это."}
            </p>
            {redFlags.length > 0 && (
              <button className="mt-3 text-xs font-bold text-mira-primary" type="button" onClick={() => navigate("report")}>
                Показать врачу <ArrowRight className="inline h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-mira-text">Как забота влияет на самочувствие</p>
            <p className="mt-1 text-xs leading-relaxed text-mira-muted">
              Здесь Mira связывает данные из страницы “Забота” с энергией, болью, возможными симптомами перед месячными и фазой цикла.
            </p>
          </div>
          <button className="text-xs font-bold text-mira-primary" type="button" onClick={() => navigate("care")}>
            Добавить данные <ArrowRight className="inline h-3 w-3" />
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <CareInsight
            icon={<Droplets className="h-4 w-4" />}
            title="Вода"
            value={`${waterEntries.length} дн.`}
            body={waterEntries.length >= 3
              ? lowWaterDays > 0 ? `В ${lowWaterDays} дн. воды было мало. Mira проверит связь со вздутием и усталостью.` : "Mira уже может заметить первые повторения по воде и энергии."
              : "Нужно 3+ дня воды, чтобы увидеть связь со вздутием и энергией."}
          />
          <CareInsight
            icon={<Heart className="h-4 w-4" />}
            title="Питание"
            value={`${countEntries(checkIns, c => Boolean(c.meals?.length))} дн.`}
            body={countEntries(checkIns, c => Boolean(c.meals?.length)) >= 3
              ? "Mira сравнивает еду с энергией, тягой к сладкому и возможными симптомами перед месячными."
              : "Отмечай еду несколько дней, чтобы понять, что поддерживает энергию."}
          />
          <CareInsight
            icon={<Footprints className="h-4 w-4" />}
            title="Ходьба"
            value={`${walkingEntries.length} дн.`}
            body={walkingEntries.length >= 3
              ? `${enoughWalkingDays} дн. были с мягкой активностью. Проверяем связь с настроением и болью.`
              : "Шаги помогут понять, когда прогулка поддерживает настроение и восстановление."}
          />
          <CareInsight
            icon={<Dumbbell className="h-4 w-4" />}
            title="Тренировки"
            value={`${workoutEntries}`}
            body={workoutEntries >= 3
              ? "Сравниваем нагрузку с фазой цикла, сном и энергией на следующий день."
              : "После нескольких тренировок появится вывод по нагрузке и восстановлению."}
          />
          <CareInsight
            icon={<Scale className="h-4 w-4" />}
            title="Вес"
            value={latestWeight ? `${latestWeight.weight.toFixed(1)} кг` : "нет"}
            body={weightDelta === null
              ? "Нужно 2+ замера, чтобы показать тренд без тревоги из-за одного дня."
              : `${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(1)} кг к прошлому замеру. Mira учитывает фазу цикла и задержку жидкости.`}
          />
        </div>
      </Card>

      {redFlags.length > 0 && (
        <Card className="border-mira-primary/15 bg-white p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-mira-text">Готово для разговора с врачом</p>
              <p className="mt-1 text-xs leading-relaxed text-mira-muted">
                Mira уже выделила сигнал, который лучше показать вместе с датами и симптомами.
              </p>
            </div>
            <Button onClick={() => navigate("report")}>
              <FileText className="h-4 w-4" /> Открыть отчёт врачу
            </Button>
          </div>
        </Card>
      )}
      </>
      )}
    </div>
  );
}
