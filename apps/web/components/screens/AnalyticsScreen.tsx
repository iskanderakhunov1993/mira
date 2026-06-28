"use client";

import type React from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CloudSun,
  Download,
  Droplets,
  Dumbbell,
  FileText,
  Heart,
  HelpCircle,
  Moon,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getRedFlags, getPhaseCorrelations } from "@/lib/alerts";
import { getCycleNorm } from "@/lib/cycleEngine";
import { getCycleAnalytics } from "@/lib/cycleAnalytics";
import { getCorrelations } from "@/lib/correlations";
import { dateKey, getCyclePhase } from "@/lib/store";
import type { DailyCheckIn } from "@/lib/types";
import type { ScreenProps } from "./types";

const PHASE_LABELS: Record<string, string> = {
  menstruation: "Менструация",
  follicular: "Фолликулярная",
  ovulation: "Овуляция",
  luteal: "Лютеиновая",
};

const dayLabels = ["1", "5", "10", "15", "20", "25", "31"];

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function linePath(values: number[], width = 250, height = 118) {
  if (values.length === 0) return "";
  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - (clamp(value, 0, 10) / 10) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function countEntries(checkIns: DailyCheckIn[], predicate: (checkIn: DailyCheckIn) => boolean) {
  return checkIns.filter(predicate).length;
}

function Ring({ value }: { value: number }) {
  const radius = 42;
  const dash = 2 * Math.PI * radius;
  return (
    <div className="relative grid h-36 w-36 place-items-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 110 110" aria-hidden="true">
        <circle cx="55" cy="55" r={radius} fill="none" stroke="#E9E3F7" strokeWidth="10" />
        <circle
          cx="55"
          cy="55"
          r={radius}
          fill="none"
          stroke="url(#analyticsRing)"
          strokeLinecap="round"
          strokeWidth="10"
          strokeDasharray={dash}
          strokeDashoffset={dash - (dash * clamp(value)) / 100}
        />
        <defs>
          <linearGradient id="analyticsRing" x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="#7C5CFF" />
            <stop offset="1" stopColor="#BDA6FF" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <p className="text-3xl font-black text-mira-primary">{value}%</p>
        <p className="text-[11px] font-semibold text-mira-muted">уверенность</p>
      </div>
    </div>
  );
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

function HelpItem({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mira-lavender-light text-mira-primary">
        {icon}
      </span>
      <div>
        <p className="text-xs font-bold text-mira-text">{title}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-mira-muted">{body}</p>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`p-5 ${className}`}>
      <p className="mb-4 text-sm font-bold text-mira-text">{title}</p>
      {children}
    </Card>
  );
}

function LineChart({
  primary,
  secondary,
  primaryLabel,
  secondaryLabel,
}: {
  primary: number[];
  secondary?: number[];
  primaryLabel: string;
  secondaryLabel?: string;
}) {
  return (
    <div>
      <svg className="h-44 w-full overflow-visible" viewBox="0 0 280 150" preserveAspectRatio="none" aria-hidden="true">
        {[0, 1, 2, 3].map(index => (
          <line key={index} x1="0" x2="280" y1={index * 40 + 10} y2={index * 40 + 10} stroke="#F0ECF8" strokeWidth="1" />
        ))}
        <path d={linePath(primary, 280, 130)} fill="none" stroke="#7C5CFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        {secondary && (
          <path d={linePath(secondary, 280, 130)} fill="none" stroke="#FF6FA5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        )}
        {primary.map((value, index) => (
          <circle key={index} cx={primary.length === 1 ? 140 : (index / (primary.length - 1)) * 280} cy={130 - (clamp(value, 0, 10) / 10) * 130} r="3.5" fill="#7C5CFF" />
        ))}
      </svg>
      <div className="mt-3 flex flex-wrap gap-4 text-[11px] font-semibold text-mira-muted">
        <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-mira-primary" />{primaryLabel}</span>
        {secondaryLabel && <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-[#FF6FA5]" />{secondaryLabel}</span>}
      </div>
    </div>
  );
}

function Heatmap({ checkIns }: { checkIns: DailyCheckIn[] }) {
  const rows = [
    { label: "Боль", get: (c: DailyCheckIn) => (c.pain?.level === "strong" ? 3 : c.pain?.level === "medium" ? 2 : c.pain ? 1 : 0) },
    { label: "Усталость", get: (c: DailyCheckIn) => (c.energy?.value === "exhausted" ? 3 : c.energy?.value === "low" ? 2 : c.energy ? 1 : 0) },
    { label: "Вздутие", get: (c: DailyCheckIn) => (c.pms?.symptoms.some(s => s.toLowerCase().includes("взд")) ? 2 : 0) },
    { label: "Настроение", get: (c: DailyCheckIn) => (c.mood?.value === "anxiety" || c.mood?.value === "swings" ? 3 : c.mood?.value === "sadness" || c.mood?.value === "anger" ? 2 : c.mood ? 1 : 0) },
    { label: "Тяга к сладкому", get: (c: DailyCheckIn) => (c.symptomLog?.sweetCraving ? 3 : 0) },
  ];
  const cells = Array.from({ length: 31 }, (_, index) => checkIns[index % Math.max(1, checkIns.length)]);
  const colors = ["bg-[#F8F3FB]", "bg-[#FFDCEB]", "bg-[#FF9AC8]", "bg-[#EB2E8A]"];

  return (
    <div className="overflow-x-auto pb-1">
      <div className="min-w-[520px]">
        <div className="mb-2 ml-28 grid gap-1 text-[10px] text-mira-muted" style={{ gridTemplateColumns: "repeat(31, minmax(0, 1fr))" }}>
          {dayLabels.map(label => <span key={label} className="col-span-4">{label}</span>)}
        </div>
        {rows.map(row => (
          <div key={row.label} className="mb-1 flex items-center gap-3">
            <p className="w-24 shrink-0 text-[11px] font-semibold text-mira-text">{row.label}</p>
            <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: "repeat(31, minmax(0, 1fr))" }}>
              {cells.map((checkIn, index) => (
                <span key={`${row.label}-${index}`} className={`h-4 rounded-[4px] ${colors[checkIn ? row.get(checkIn) : 0]}`} />
              ))}
            </div>
          </div>
        ))}
        <div className="mt-4 flex gap-3 text-[10px] text-mira-muted">
          <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-[#F8F3FB]" />нет</span>
          <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-[#FFDCEB]" />слабо</span>
          <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-[#FF9AC8]" />умеренно</span>
          <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-[#EB2E8A]" />сильно</span>
        </div>
      </div>
    </div>
  );
}

function ForecastTable({
  currentDay,
  phase,
  periodIn,
}: {
  currentDay: number;
  phase: string;
  periodIn: number;
}) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = currentDay + index;
    const date = addDays(today, index);
    const isPeriod = periodIn <= index || day > 31;
    const isPms = periodIn > index && periodIn - index <= 3;
    return {
      day: day > 31 ? day - 31 : day,
      date,
      title: isPeriod ? "День цикла" : isPms ? "ПМС возможен" : index === 0 ? PHASE_LABELS[phase] ?? "Фаза цикла" : "Энергия стабильна",
      action: isPeriod ? "Вода, отдых, лёгкая еда" : isPms ? "Ранний сон, меньше стресса" : "Планируй задачи спокойно",
      highlight: index === 3 || isPeriod,
    };
  });

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between gap-3 border-b border-mira-lavender/20 p-5">
        <p className="text-sm font-bold text-mira-text">Прогноз на ближайшее время</p>
        <p className="text-xs font-semibold text-mira-muted">основан на твоих отметках</p>
      </div>
      <div className="grid min-w-[760px] grid-cols-7">
        {days.map((item, index) => (
          <div key={index} className={`border-r border-mira-lavender/20 p-4 last:border-r-0 ${item.highlight ? "bg-[#FFF0F6]" : "bg-white"}`}>
            <p className="text-[10px] font-bold text-mira-muted">{index === 0 ? "Сегодня" : item.date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</p>
            <p className="mt-1 text-lg font-black text-mira-text">{item.day}</p>
            <p className="mt-3 min-h-10 text-xs font-bold leading-snug text-mira-text">{item.title}</p>
            <p className="mt-3 text-[11px] leading-relaxed text-mira-muted">{item.action}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-mira-lavender/20 px-5 py-3 text-[11px] text-mira-muted">
        Чем больше отметок, тем точнее прогнозы по ПМС, энергии и месячным.
      </div>
    </Card>
  );
}

function PatternCard({
  icon,
  title,
  body,
  status,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  status: string;
}) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-mira-primary">{icon}</span>
        <p className="text-sm font-bold text-mira-text">{title}</p>
      </div>
      <p className="min-h-12 text-xs leading-relaxed text-mira-muted">{body}</p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <span className="rounded-full bg-[#E0F5E8] px-2.5 py-1 text-[10px] font-bold text-[#4D9D69]">{status}</span>
        <svg className="h-9 w-16" viewBox="0 0 70 38" aria-hidden="true">
          <path d="M2 29 C10 18 16 34 24 18 S38 8 46 18 S58 32 68 14" fill="none" stroke="#7C5CFF" strokeLinecap="round" strokeWidth="2" />
        </svg>
      </div>
    </Card>
  );
}

function FactorRow({ icon, label, dots, note }: { icon: React.ReactNode; label: string; dots: number; note: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-5 text-mira-primary">{icon}</span>
      <p className="w-24 text-xs font-bold text-mira-text">{label}</p>
      <div className="flex flex-1 gap-1">
        {Array.from({ length: 7 }, (_, index) => (
          <span key={index} className={`h-3 w-3 rounded-full ${index < dots ? "bg-mira-primary" : "bg-mira-lavender-light"}`} />
        ))}
      </div>
      <p className="hidden w-32 text-[11px] text-mira-muted sm:block">{note}</p>
    </div>
  );
}

export function AnalyticsScreen({ data, navigate }: ScreenProps) {
  const profile = data.profile;
  const today = data.checkIns[dateKey()];
  const checkIns = Object.values(data.checkIns).sort((a, b) => a.date.localeCompare(b.date));
  const totalDays = checkIns.length;
  const norm = getCycleNorm(profile);
  const cycleAnalytics = getCycleAnalytics(data);
  const redFlags = getRedFlags(data);
  const correlations = getCorrelations(data);
  const phaseCorrelations = getPhaseCorrelations(data);

  const periodEntries = checkIns.filter(c => c.period);
  const painEntries = checkIns.filter(c => c.pain?.kinds.some(kind => kind !== "none"));
  const strongPainEntries = checkIns.filter(c => c.pain?.level === "strong");
  const pmsEntries = checkIns.filter(c => c.pms && c.pms.symptoms.length > 0);
  const lowEnergyEntries = checkIns.filter(c => c.energy?.value === "low" || c.energy?.value === "exhausted");
  const moodEntries = checkIns.filter(c => c.mood);
  const sleepEntries = checkIns.filter(c => c.sleep);
  const heavyFlowEntries = checkIns.filter(c => c.period?.intensity === "heavy" || c.period?.intensity === "very_heavy");
  const workoutEntries = data.workouts.length;

  const confidence = norm.confidence === "high" ? 78 : norm.confidence === "medium" ? 64 : clamp(28 + totalDays * 4 + norm.observedCycles * 10, 28, 74);
  const periodIn = Math.max(0, norm.daysUntilPeriod);
  const pmsIn = Math.max(0, periodIn - 3);
  const currentPhase = getCyclePhase(norm.cycleDay, profile?.cycleConfig.periodLength ?? 5, norm.cycleLength);
  const nextPeriodStart = addDays(new Date(`${norm.lastPeriodStart}T00:00:00`), norm.cycleLength).toISOString().slice(0, 10);
  const cycles = cycleAnalytics?.cycles ?? [];
  const mainInsight = redFlags[0]?.title ?? cycleAnalytics?.headline ?? "Mira собирает первые закономерности";
  const mainBody = redFlags[0]?.body ?? cycleAnalytics?.insight ?? "Отмечай цикл, боль, настроение, сон и энергию. Тогда прогнозы станут не общими, а про тебя.";

  const painSeries = Array.from({ length: 12 }, (_, index) => {
    const item = checkIns[index % Math.max(1, checkIns.length)];
    return item?.pain?.level === "strong" ? 8 : item?.pain?.level === "medium" ? 5 : item?.pain ? 2 : index % 4 === 0 ? 1 : 0;
  });
  const energySeries = Array.from({ length: 12 }, (_, index) => {
    const item = checkIns[index % Math.max(1, checkIns.length)];
    if (!item?.energy) return 4 + (index % 5);
    return item.energy.value === "high" ? 9 : item.energy.value === "normal" ? 6 : item.energy.value === "low" ? 4 : 2;
  });
  const moodSeries = Array.from({ length: 12 }, (_, index) => {
    const item = checkIns[index % Math.max(1, checkIns.length)];
    if (!item?.mood) return 3 + (index % 4);
    return item.mood.value === "joy" ? 8 : item.mood.value === "normal" ? 6 : item.mood.value === "anxiety" || item.mood.value === "swings" ? 4 : 3;
  });

  const patterns = [
    correlations[0] && {
      title: correlations[0].title,
      body: correlations[0].body,
      status: correlations[0].strength === "strong" ? "сильная связь" : "средняя связь",
      icon: <TrendingUp className="h-4 w-4" />,
    },
    phaseCorrelations[0] && {
      title: `${phaseCorrelations[0].symptom} → ${phaseCorrelations[0].phase}`,
      body: phaseCorrelations[0].explanation,
      status: "паттерн формируется",
      icon: <CloudSun className="h-4 w-4" />,
    },
    {
      title: "ПМС → настроение",
      body: pmsEntries.length > 0 ? `ПМС отмечен ${pmsEntries.length} раз. Mira будет смотреть, как он влияет на тревогу и раздражительность.` : "Появится после отметок ПМС и настроения в нескольких циклах.",
      status: pmsEntries.length > 2 ? "связь видна" : "нужны отметки",
      icon: <Heart className="h-4 w-4" />,
    },
    {
      title: "Сон → энергия",
      body: sleepEntries.length > 0 ? `Есть ${sleepEntries.length} отметок сна. Сравниваем их с энергией на следующий день.` : "Отмечай сон и энергию, чтобы Mira нашла личный режим восстановления.",
      status: sleepEntries.length > 3 ? "данных хватает" : "данных мало",
      icon: <Moon className="h-4 w-4" />,
    },
  ].filter(Boolean).slice(0, 4) as Array<{ title: string; body: string; status: string; icon: React.ReactNode }>;

  const dataSources = [
    { label: "Отметки симптомов", value: painEntries.length + pmsEntries.length + lowEnergyEntries.length },
    { label: "Записи сна", value: sleepEntries.length },
    { label: "Записи настроения", value: moodEntries.length },
    { label: "Записи питания", value: countEntries(checkIns, c => Boolean(c.meals?.length)) },
    { label: "Тренировки", value: workoutEntries },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-mira-text">Аналитика</h1>
          <p className="mt-1 text-sm leading-relaxed text-mira-muted">Понимай свой цикл, прогнозируй и планируй.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate("report")}>
            <Download className="h-4 w-4" /> Экспорт данных
          </Button>
          <Button variant="ghost" className="h-10 w-10 px-0" aria-label="Справка">
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 rounded-2xl border border-mira-lavender/20 bg-white p-1.5 shadow-sm md:max-w-xl">
        {["1 день", "7 дней", "1 месяц", "1 год"].map((period, index) => (
          <button
            key={period}
            className={`rounded-xl px-3 py-2 text-xs font-bold transition ${index === 2 ? "bg-mira-lavender-light text-mira-primary" : "text-mira-muted hover:bg-mira-bg"}`}
            type="button"
          >
            {period}
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm font-bold text-mira-text">Mira понимает твой ритм</p>
          <div className="mt-2 flex justify-center">
            <Ring value={confidence} />
          </div>
          <p className="text-xs leading-relaxed text-mira-muted">
            На основе {norm.observedCycles || 1} циклов и {totalDays} дней с отметками.
          </p>
        </Card>
        <TopMetric
          title="Следующие месячные"
          value={periodIn === 0 ? "могут начаться" : `через ${periodIn} дн.`}
          detail={`Ожидаемое окно: ${formatDate(nextPeriodStart)} · уверенность ${confidence}%`}
          icon={<CalendarDays className="h-4 w-4" />}
          tone="pink"
        />
        <TopMetric
          title="ПМС может начаться"
          value={pmsIn === 0 ? "сейчас" : `через ${pmsIn} дн.`}
          detail={pmsEntries.length > 0 ? `Повторяется в ${Math.min(3, pmsEntries.length)} из ${Math.max(3, norm.observedCycles || 3)} циклов` : "Появится точнее после отметок ПМС"}
          icon={<Zap className="h-4 w-4" />}
          tone="amber"
        />
        <TopMetric
          title="Фаза цикла"
          value={PHASE_LABELS[currentPhase] ?? "Фаза"}
          detail={`День цикла: ${norm.cycleDay} из ${norm.cycleLength}. Нажми, чтобы понять смысл.`}
          icon={<CloudSun className="h-4 w-4" />}
          tone="purple"
        />
      </div>

      <Card className="p-5">
        <p className="mb-5 text-sm font-bold text-mira-text">Как эти данные помогают тебе</p>
        <div className="grid gap-5 md:grid-cols-5">
          <HelpItem icon={<CalendarDays className="h-4 w-4" />} title="Готовиться заранее" body="Планируй дела и аптечку до месячных." />
          <HelpItem icon={<Heart className="h-4 w-4" />} title="Понимать ПМС" body="Настроение, энергия и симптомы не случайны." />
          <HelpItem icon={<Zap className="h-4 w-4" />} title="Планировать нагрузку" body="Выбирай лучшие дни для спорта и работы." />
          <HelpItem icon={<Droplets className="h-4 w-4" />} title="Находить триггеры" body="Сон, вода, еда и стресс влияют на состояние." />
          <HelpItem icon={<ShieldCheck className="h-4 w-4" />} title="К врачу с фактами" body="Все важные данные готовы к показу." />
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Фазы и дни цикла">
          <LineChart primary={painSeries} primaryLabel="Симптомы" />
          <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-mira-muted">
            <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-[#FF6FA5]" />Менструация</span>
            <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-mira-primary" />Фолликулярная</span>
            <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-[#65C796]" />Овуляция</span>
            <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-[#F2A14A]" />Лютеиновая</span>
          </div>
        </ChartCard>
        <ChartCard title="Симптомы по дням цикла">
          <Heatmap checkIns={checkIns} />
        </ChartCard>
        <ChartCard title="Энергия и настроение">
          <LineChart primary={energySeries} secondary={moodSeries} primaryLabel="Энергия" secondaryLabel="Настроение" />
        </ChartCard>
      </div>

      <div className="overflow-x-auto">
        <ForecastTable currentDay={norm.cycleDay} phase={currentPhase} periodIn={periodIn} />
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-mira-text">Найденные закономерности</p>
          <button className="text-xs font-bold text-mira-primary" type="button">Смотреть все <ArrowRight className="inline h-3 w-3" /></button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {patterns.map(pattern => (
            <PatternCard key={pattern.title} icon={pattern.icon} title={pattern.title} body={pattern.body} status={pattern.status} />
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <p className="mb-4 text-sm font-bold text-mira-text">Сравнение циклов</p>
          <div className="space-y-3">
            {(cycles.length > 0 ? cycles : [
              { label: "Текущий", length: norm.cycleLength, start: norm.lastPeriodStart, painDays: painEntries.length, pmsDays: pmsEntries.length, heavyFlowDays: heavyFlowEntries.length },
            ]).map(cycle => (
              <div key={`${cycle.label}-${cycle.start}`} className="grid grid-cols-4 gap-2 rounded-2xl bg-mira-bg p-3 text-xs">
                <p className="font-bold text-mira-text">{cycle.label}</p>
                <p className="text-mira-muted">{cycle.length} дн.</p>
                <p className="text-mira-muted">ПМС {cycle.pmsDays}</p>
                <p className="text-mira-muted">Боль {cycle.painDays}</p>
              </div>
            ))}
          </div>
          <button className="mt-4 text-xs font-bold text-mira-primary" type="button">Смотреть все циклы <ArrowRight className="inline h-3 w-3" /></button>
        </Card>

        <Card className="p-5">
          <p className="mb-4 text-sm font-bold text-mira-text">Что влияет на самочувствие</p>
          <div className="space-y-4">
            <FactorRow icon={<Moon className="h-4 w-4" />} label="Сон" dots={sleepEntries.length > 3 ? 6 : 3} note="сильное влияние" />
            <FactorRow icon={<Zap className="h-4 w-4" />} label="Стресс" dots={countEntries(checkIns, c => Boolean(c.stress)) > 2 ? 5 : 2} note="среднее влияние" />
            <FactorRow icon={<Droplets className="h-4 w-4" />} label="Вода" dots={periodEntries.length > 3 ? 4 : 2} note="нужно больше данных" />
            <FactorRow icon={<Heart className="h-4 w-4" />} label="Питание" dots={countEntries(checkIns, c => Boolean(c.meals?.length)) > 3 ? 5 : 2} note="среднее влияние" />
            <FactorRow icon={<Dumbbell className="h-4 w-4" />} label="Тренировки" dots={workoutEntries > 3 ? 4 : 2} note="положительное влияние" />
          </div>
        </Card>

        <Card className="p-5">
          <p className="mb-4 text-sm font-bold text-mira-text">На чём основаны выводы</p>
          <div className="space-y-3">
            {dataSources.map(source => (
              <div key={source.label} className="flex items-center justify-between gap-3 rounded-2xl bg-mira-bg p-3">
                <p className="text-xs font-semibold text-mira-text">{source.label}</p>
                <p className="text-sm font-black text-mira-primary">{source.value}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-mira-muted">Mira не ставит диагнозы. Она показывает повторы, которые помогают лучше подготовиться или обсудить симптомы с врачом.</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className={`p-5 ${redFlags.length > 0 ? "border-[#F2A14A]/30 bg-[#FFF6E6]" : "border-[#B6E4C7]/40 bg-[#F2FBF5]"}`}>
          <div className="flex items-start gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ${redFlags.length > 0 ? "text-[#F2A14A]" : "text-[#4D9D69]"}`}>
              {redFlags.length > 0 ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
            </span>
            <div>
              <p className="text-sm font-bold text-mira-text">{redFlags.length > 0 ? "Сигналы внимания" : "Всё спокойно"}</p>
              <p className="mt-1 text-xs leading-relaxed text-mira-muted">
                {redFlags.length > 0 ? `${redFlags[0].title}. Это полезно обсудить со специалистом, особенно если повторяется.` : "Серьёзных тревожных сигналов не найдено. Продолжай заботиться о себе и отмечать данные."}
              </p>
              {redFlags.length > 0 && (
                <button className="mt-3 text-xs font-bold text-mira-primary" type="button" onClick={() => navigate("report")}>
                  Что обсудить с врачом <ArrowRight className="inline h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mira-lavender-light text-mira-primary">
              <FileText className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold text-mira-text">{today ? mainInsight : "Сегодня ещё нет отметки"}</p>
              <p className="mt-1 text-xs leading-relaxed text-mira-muted">
                {today ? mainBody : "Добавь состояние за день, чтобы аналитика понимала не только календарь, но и твоё самочувствие."}
              </p>
              <Button className="mt-4 w-full sm:w-auto" variant="outline" onClick={() => navigate(today ? "report" : "today")}>
                {today ? <FileText className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
                {today ? "Открыть отчёт" : "Отметить состояние"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
