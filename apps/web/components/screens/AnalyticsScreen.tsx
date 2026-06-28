"use client";

import {
  Activity,
  AlertCircle,
  Brain,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  Footprints,
  Moon,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getRedFlags, getPhaseCorrelations } from "@/lib/alerts";
import { getCycleNorm } from "@/lib/cycleEngine";
import { getCycleAnalytics, type CycleAnalyticsPoint } from "@/lib/cycleAnalytics";
import { getCorrelations } from "@/lib/correlations";
import { getHealthSummary, statusMeta } from "@/lib/healthScore";
import { getSmartInsights } from "@/lib/insights";
import { dateKey, getCycleDay, getCyclePhase, getPhaseLabel } from "@/lib/store";
import { getWorkMode, type WorkMode } from "@/lib/workMode";
import type { ScreenProps } from "./types";

type Tone = "success" | "watch" | "alert" | "neutral";

const toneClass: Record<Tone, string> = {
  success: "border-mira-success/15 bg-[#E0F5E8]/30 text-mira-success",
  watch: "border-[#C4B07E]/20 bg-[#F5F0E0]/45 text-[#9A7B2F]",
  alert: "border-mira-cycle/20 bg-[#F8E8EE]/55 text-mira-cycle",
  neutral: "border-mira-lavender/20 bg-mira-bg text-mira-muted",
};

function Progress({ value, color = "bg-mira-primary" }: { value: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-mira-lavender-light">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

function pct(count: number, goal: number) {
  return Math.min(100, Math.round((count / Math.max(goal, 1)) * 100));
}

function shortList(items: string[], empty: string) {
  if (items.length === 0) return empty;
  if (items.length <= 2) return items.join(", ");
  return `${items.slice(0, 2).join(", ")} +${items.length - 2}`;
}

function SectionTitle({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-3 px-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">{label}</p>
      <p className="text-sm font-bold text-mira-text">{title}</p>
    </div>
  );
}

function MiniStat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-lg border border-mira-lavender/20 bg-mira-bg px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">{label}</p>
      <p className="mt-1 text-xl font-black leading-none text-mira-text">{value}</p>
      <p className="mt-1 text-[10px] leading-snug text-mira-muted">{note}</p>
    </div>
  );
}

function ForecastCard({ label, title, body, tone = "neutral" }: { label: string; title: string; body: string; tone?: Tone }) {
  return (
    <Card className={`p-4 ${toneClass[tone]}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest">{label}</p>
      <p className="mt-2 text-xl font-black leading-tight text-mira-text">{title}</p>
      <p className="mt-2 text-xs leading-relaxed text-mira-muted">{body}</p>
    </Card>
  );
}

function DataBenefit({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-white/70 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <p className="text-xs font-bold text-mira-text">{title}</p>
      </div>
      <p className="text-[11px] leading-relaxed text-mira-muted">{body}</p>
    </div>
  );
}

function TrackerValueCard({ emoji, title, value, body, ready }: { emoji: string; title: string; value: string; body: string; ready: boolean }) {
  return (
    <Card className={`p-3 ${ready ? "border-mira-success/15 bg-[#E0F5E8]/20" : "border-mira-lavender/20 bg-white"}`}>
      <div className="mb-2 flex items-start gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/70 text-base">{emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold leading-tight text-mira-text">{title}</p>
          <p className={`mt-0.5 text-[10px] font-bold ${ready ? "text-mira-success" : "text-mira-muted"}`}>{value}</p>
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-mira-muted">{body}</p>
    </Card>
  );
}

function CycleBar({ cycle, maxPain, maxPms, maxEnergy }: { cycle: CycleAnalyticsPoint; maxPain: number; maxPms: number; maxEnergy: number }) {
  return (
    <div className="rounded-2xl border border-mira-lavender/20 bg-white p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-mira-text">{cycle.label}</p>
          <p className="text-[10px] text-mira-muted">{new Date(`${cycle.start}T00:00:00`).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}</p>
        </div>
        <Badge className="bg-mira-bg text-[10px] text-mira-muted shadow-none">{cycle.length} дн.</Badge>
      </div>
      <div className="space-y-2">
        <MetricBar label="Боль" value={cycle.strongPainDays} max={maxPain} color="bg-mira-cycle" />
        <MetricBar label="ПМС" value={cycle.pmsDays} max={maxPms} color="bg-[#A07EC4]" />
        <MetricBar label="Энергия" value={cycle.lowEnergyDays} max={maxEnergy} color="bg-[#C4B07E]" />
        <MetricBar label="Обильность" value={cycle.heavyFlowDays} max={Math.max(1, cycle.heavyFlowDays)} color="bg-[#C47E9B]" />
      </div>
    </div>
  );
}

function MetricBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px]">
        <span className="font-semibold text-mira-muted">{label}</span>
        <span className="text-mira-text">{value}</span>
      </div>
      <Progress value={(value / Math.max(max, 1)) * 100} color={color} />
    </div>
  );
}

function CycleAnalyticsCard({ analytics, onOpenReport }: { analytics: NonNullable<ReturnType<typeof getCycleAnalytics>>; onOpenReport: () => void }) {
  const maxPain = Math.max(1, ...analytics.cycles.map(c => c.strongPainDays));
  const maxPms = Math.max(1, ...analytics.cycles.map(c => c.pmsDays));
  const maxEnergy = Math.max(1, ...analytics.cycles.map(c => c.lowEnergyDays));

  return (
    <Card className="mb-5 border-mira-primary/10 bg-mira-lavender-light/20 p-4">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/70 text-mira-primary">
          <TrendingUp className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Аналитика цикла</p>
          <p className="mt-0.5 text-base font-bold leading-snug text-mira-text">{analytics.headline}</p>
          <p className="mt-1 text-xs leading-relaxed text-mira-muted">{analytics.insight}</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {analytics.cycles.map(cycle => (
          <CycleBar key={cycle.start} cycle={cycle} maxPain={maxPain} maxPms={maxPms} maxEnergy={maxEnergy} />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {analytics.links.map(link => (
          <MiniStat key={link.label} label={link.label} value={link.value} note={link.note} />
        ))}
      </div>

      {analytics.doctorNote && (
        <div className="mt-3 rounded-2xl border border-mira-cycle/15 bg-white/75 p-3">
          <p className="text-xs font-semibold leading-relaxed text-mira-cycle">{analytics.doctorNote}</p>
          <Button className="mt-3 w-full" variant="outline" onClick={onOpenReport}>
            <FileText className="h-4 w-4" /> В отчёт врачу
          </Button>
        </div>
      )}
    </Card>
  );
}

function WorkAnalyticsCard({ mode }: { mode: WorkMode }) {
  const toneClass = {
    green: "border-mira-success/15 bg-[#E0F5E8]/25",
    lavender: "border-mira-primary/10 bg-mira-lavender-light/25",
    warm: "border-[#C4B07E]/15 bg-[#F5F0E0]/35",
    rose: "border-mira-cycle/15 bg-[#F8E8EE]/40",
  }[mode.tone];

  const iconClass = {
    green: "text-mira-success",
    lavender: "text-mira-primary",
    warm: "text-[#9A7A35]",
    rose: "text-mira-cycle",
  }[mode.tone];

  const loadLabel = mode.kind === "deep" ? "Можно брать сложное" : mode.kind === "steady" ? "Лучше ровный темп" : "Нужен мягкий режим";
  const loadScore = mode.kind === "deep" ? 82 : mode.kind === "steady" ? 62 : 38;
  const loadColor = mode.tone === "rose" ? "bg-mira-cycle" : mode.tone === "warm" ? "bg-[#C4B07E]" : "bg-mira-success";

  return (
    <Card className={`mb-5 p-4 ${toneClass}`}>
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/70">
          <BriefcaseBusiness className={`h-5 w-5 ${iconClass}`} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Работа и нагрузка</p>
          <p className="mt-0.5 text-base font-bold leading-snug text-mira-text">{mode.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-mira-muted">{mode.body}</p>
        </div>
      </div>

      <div className="mb-3 rounded-2xl bg-white/70 p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-mira-text">{loadLabel}</p>
          <p className="text-sm font-black text-mira-text">{loadScore}%</p>
        </div>
        <Progress value={loadScore} color={loadColor} />
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        {mode.bestFor.map((item) => (
          <div key={item} className="rounded-lg bg-white/70 px-2 py-2 text-center">
            <p className="text-[10px] font-bold leading-tight text-mira-text">{item}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl bg-white/70 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Не перегружать</p>
          <p className="mt-0.5 text-xs leading-relaxed text-mira-text">{mode.avoid}</p>
        </div>
        <div className="rounded-xl bg-white/70 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Паузы</p>
          <p className="mt-0.5 text-xs leading-relaxed text-mira-text">{mode.pause}</p>
        </div>
      </div>

      <details className="mt-2 rounded-xl bg-white/70 px-3 py-2">
        <summary className="cursor-pointer text-xs font-bold text-mira-primary">Шаблон сообщения, если плохо</summary>
        <p className="mt-2 text-xs leading-relaxed text-mira-text">{mode.messageTemplate}</p>
      </details>
    </Card>
  );
}

export function AnalyticsScreen({ data, navigate, onCheckIn }: ScreenProps) {
  const profile = data.profile;
  const today = data.checkIns[dateKey()];
  const checkIns = Object.values(data.checkIns);
  const totalDays = checkIns.length;

  const norm = getCycleNorm(profile);
  const cycleLength = norm.cycleLength;
  const periodLength = profile?.cycleConfig.periodLength ?? 5;
  const cycleDay = getCycleDay(profile);
  const phase = getCyclePhase(cycleDay, periodLength, cycleLength);
  const health = getHealthSummary(data);
  const redFlags = getRedFlags(data);
  const smartInsights = getSmartInsights(data);
  const correlations = getCorrelations(data);
  const phaseCorrelations = getPhaseCorrelations(data);
  const cycleAnalytics = getCycleAnalytics(data);
  const workMode = getWorkMode(phase, today);

  const painEntries = checkIns.filter(c => c.pain && c.pain.kinds.some(k => k !== "none"));
  const strongPainEntries = painEntries.filter(c => c.pain?.level === "strong");
  const sleepEntries = checkIns.filter(c => c.sleep);
  const energyEntries = checkIns.filter(c => c.energy);
  const moodEntries = checkIns.filter(c => c.mood);
  const pmsEntries = checkIns.filter(c => c.pms && c.pms.symptoms.length > 0);
  const symptomLogEntries = checkIns.filter(c => c.symptomLog);
  const periodEntries = checkIns.filter(c => c.period);
  const mealEntries = checkIns.filter(c => c.meals && c.meals.length > 0);
  const waterEntries = Object.values(data.waterLog ?? {}).filter(entry => entry.glasses > 0);
  const walkingEntries = Object.values(data.walkingLog ?? {}).filter(entry => entry.steps > 0);
  const walkingDays = walkingEntries.length;
  const workoutEntries = data.workouts.filter(workout => workout.status !== "skipped");
  const weightEntries = Object.values(data.weightLog ?? {});
  const intimacyEntries = checkIns.filter(c => c.intimacy?.happened);
  const delayChecks = checkIns.flatMap(c => c.delayChecks ?? []);
  const badEpisodes = checkIns.flatMap(c => c.badEpisodes ?? []);
  const labEntries = data.labs ?? [];
  const kitReady = data.periodKit?.items.filter(item => item.checked).length ?? 0;

  const missingToday = [
    !today?.sleep ? "сон" : null,
    !today?.energy ? "энергию" : null,
    !today?.mood ? "настроение" : null,
    !today?.pms ? "ПМС" : null,
  ].filter((item): item is string => Boolean(item));

  const dataNeeds: Array<{
    id: string;
    icon: typeof CalendarDays;
    label: string;
    count: number;
    goal: number;
    unit: string;
    why: string;
    color: string;
  }> = [
    { id: "daily", icon: ClipboardList, label: "Ежедневные отметки", count: totalDays, goal: 7, unit: "дней", why: "первые наблюдения", color: "bg-mira-primary" },
    { id: "cycle", icon: CalendarDays, label: "Старт месячных", count: norm.observedCycles, goal: 2, unit: "цикла", why: "точность прогноза", color: "bg-mira-cycle" },
    { id: "sleep", icon: Moon, label: "Сон", count: sleepEntries.length, goal: 7, unit: "дней", why: "связь с энергией", color: "bg-[#7E8EC4]" },
    { id: "energy", icon: Zap, label: "Энергия", count: energyEntries.length, goal: 7, unit: "дней", why: "пики и спады", color: "bg-[#C4B07E]" },
    { id: "mood", icon: Brain, label: "Настроение", count: moodEntries.length, goal: 7, unit: "дней", why: "связь с фазами", color: "bg-[#9B8EC4]" },
    { id: "walking", icon: Footprints, label: "Ходьба", count: walkingDays, goal: 7, unit: "дней", why: "связь с энергией и ПМС", color: "bg-mira-success" },
    { id: "pain", icon: Activity, label: "Боль", count: painEntries.length, goal: 3, unit: "раза", why: "повтор боли", color: "bg-[#C47E9B]" },
    { id: "pms", icon: Sparkles, label: "ПМС", count: pmsEntries.length, goal: 3, unit: "раза", why: "предупреждения заранее", color: "bg-[#A07EC4]" },
    { id: "symptomLog", icon: ClipboardList, label: "Лог симптомов", count: symptomLogEntries.length, goal: 6, unit: "дней", why: "повторы перед месячными", color: "bg-[#7E9BC4]" },
  ];

  const weakestNeed = dataNeeds.slice().sort((a, b) => pct(a.count, a.goal) - pct(b.count, b.goal))[0];
  const usefulMetrics = health.metrics.filter(metric => metric.status !== "nodata");
  const trackerValueCards = [
    {
      emoji: "🔄",
      title: "Цикл и месячные",
      value: periodEntries.length > 0 ? `${periodEntries.length} дней` : "нет отметок",
      ready: norm.observedCycles >= 1 || periodEntries.length > 0,
      body: norm.observedCycles >= 1
        ? "Помогает прогнозировать месячные, задержки и дни подготовки."
        : "Отметь старт месячных, чтобы Mira поняла твою длину цикла.",
    },
    {
      emoji: "🌸",
      title: "Боль",
      value: painEntries.length > 0 ? `${painEntries.length} дней` : "нет отметок",
      ready: painEntries.length > 0,
      body: painEntries.length > 0
        ? `Mira видит боль и отдельно считает сильную: ${strongPainEntries.length} раз.`
        : "Нужна, чтобы понять, повторяется ли боль в одни и те же дни.",
    },
    {
      emoji: "🙂",
      title: "Настроение и ПМС",
      value: `${moodEntries.length + pmsEntries.length} отметок`,
      ready: moodEntries.length > 0 || pmsEntries.length > 0,
      body: moodEntries.length > 0 || pmsEntries.length > 0
        ? "Помогает связать тревогу, раздражение и ПМС с фазами цикла."
        : "Покажет, когда эмоциональные симптомы повторяются перед месячными.",
    },
    {
      emoji: "😴",
      title: "Сон и энергия",
      value: `${sleepEntries.length}/${energyEntries.length} дней`,
      ready: sleepEntries.length > 0 || energyEntries.length > 0,
      body: sleepEntries.length > 0 || energyEntries.length > 0
        ? "Используется для советов по нагрузке, восстановлению и работе."
        : "Нужны, чтобы Mira отличала усталость от случайного дня.",
    },
    {
      emoji: "🥗",
      title: "Питание",
      value: mealEntries.length > 0 ? `${mealEntries.length} дней` : "нет отметок",
      ready: mealEntries.length > 0,
      body: mealEntries.length > 0
        ? "Ищем связь еды с энергией, тягой к сладкому и ПМС."
        : "Поможет понять, какая еда поддерживает энергию в разные фазы.",
    },
    {
      emoji: "💧",
      title: "Вода",
      value: waterEntries.length > 0 ? `${waterEntries.length} дней` : "нет отметок",
      ready: waterEntries.length > 0,
      body: waterEntries.length > 0
        ? "Учитывается в связях с самочувствием и ПМС."
        : "Нужна, чтобы проверить связь воды, вздутия и энергии.",
    },
    {
      emoji: "🚶",
      title: "Ходьба",
      value: walkingDays > 0 ? `${walkingDays} дней` : "нет отметок",
      ready: walkingDays > 0,
      body: walkingDays > 0
        ? "Помогает смотреть, как движение связано с энергией и настроением."
        : "Пока Mira не может понять, помогает ли тебе прогулка.",
    },
    {
      emoji: "🏋️",
      title: "Тренировки",
      value: workoutEntries.length > 0 ? `${workoutEntries.length} раз` : "нет отметок",
      ready: workoutEntries.length > 0,
      body: workoutEntries.length > 0
        ? "Используется для связи тренировок со сном и восстановлением."
        : "Поможет адаптировать спорт под фазу цикла и самочувствие.",
    },
    {
      emoji: "⚖️",
      title: "Вес",
      value: weightEntries.length > 0 ? `${weightEntries.length} замеров` : "нет замеров",
      ready: weightEntries.length >= 2,
      body: weightEntries.length >= 2
        ? "Можно смотреть тренд, не реагируя на один случайный скачок."
        : "Нужно 2+ замера, чтобы показать тренд без лишней тревоги.",
    },
    {
      emoji: "❤️",
      title: "Секс и цикл",
      value: intimacyEntries.length > 0 ? `${intimacyEntries.length} отметок` : "скрыто/нет",
      ready: intimacyEntries.length > 0,
      body: intimacyEntries.length > 0
        ? "Используется для риска беременности, боли, крови после секса и отчёта врачу."
        : "Если отмечать, Mira подскажет про риски и красные флаги.",
    },
    {
      emoji: "⚠️",
      title: "Задержки и «мне плохо»",
      value: `${delayChecks.length + badEpisodes.length} записей`,
      ready: delayChecks.length > 0 || badEpisodes.length > 0,
      body: delayChecks.length > 0 || badEpisodes.length > 0
        ? "Попадает в красные флаги и помогает собрать спокойный план действий."
        : "Нужно только когда есть задержка или плохое самочувствие.",
    },
    {
      emoji: "🧪",
      title: "Анализы и аптечка",
      value: `${labEntries.length} анализов · ${kitReady}/9 аптечка`,
      ready: labEntries.length > 0 || kitReady > 0,
      body: labEntries.length > 0 || kitReady > 0
        ? "Помогает подготовиться к врачу и к месячным заранее."
        : "Анализы нужны для вопросов врачу, аптечка — чтобы не забыть важное.",
    },
  ];

  const evidenceItems = [
    ...redFlags.map(flag => ({
      key: `flag-${flag.title}`,
      tone: "alert" as Tone,
      icon: "!",
      title: flag.title,
      body: flag.body,
    })),
    ...correlations.map(item => ({
      key: item.id,
      tone: item.strength === "strong" ? "success" as Tone : "watch" as Tone,
      icon: item.emoji,
      title: item.title,
      body: item.body,
    })),
    ...phaseCorrelations.slice(0, 2).map(item => ({
      key: `phase-${item.symptom}`,
      tone: "watch" as Tone,
      icon: "↔",
      title: `${item.symptom}: ${item.phase}`,
      body: item.explanation,
    })),
    ...smartInsights.map((item, index) => ({
      key: `smart-${index}`,
      tone: item.type === "action" ? "alert" as Tone : "neutral" as Tone,
      icon: item.icon === "positive" ? "✓" : "i",
      title: item.title,
      body: item.body,
    })),
  ].slice(0, 3);

  const heroTone: Tone = redFlags.length > 0 ? "alert" : totalDays < 7 ? "watch" : evidenceItems.length > 0 ? "success" : "neutral";
  const heroTitle = redFlags.length > 0
    ? "Есть сигнал, который стоит обсудить"
    : totalDays < 7
      ? "Пока рано делать личные выводы"
      : evidenceItems.length > 0
        ? "Mira уже видит, что повторяется"
        : "Данных достаточно для первых наблюдений";
  const heroBody = redFlags.length > 0
    ? "На этой странице собраны факты, которые можно превратить в отчёт для врача."
    : totalDays < 7
      ? `Отметь состояние ещё ${Math.max(0, 7 - totalDays)} раз, и Mira начнёт показывать не общие советы, а твои повторы.`
      : "Сравниваем цикл, сон, боль, ходьбу, энергию и настроение, чтобы показать не цифры, а смысл.";
  const confidenceScore = norm.confidence === "high" ? 86 : norm.confidence === "medium" ? 68 : Math.max(28, Math.min(62, totalDays * 7 + norm.observedCycles * 12));
  const periodWindowStart = Math.max(0, norm.daysUntilPeriod - 2);
  const periodWindowEnd = Math.max(periodWindowStart, norm.daysUntilPeriod + 2);
  const pmsStart = Math.max(0, norm.daysUntilPeriod - 5);
  const pmsEnd = Math.max(0, norm.daysUntilPeriod - 2);
  const currentPhaseLabel = getPhaseLabel(phase);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-mira-text">Аналитика</h1>
        <p className="mt-1 text-sm text-mira-muted">Понимай цикл, прогнозируй и планируй</p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="border-mira-primary/15 bg-mira-lavender-light/20 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Mira понимает ритм</p>
          <div className="mt-3 flex items-center gap-3">
            <div
              className="grid h-20 w-20 shrink-0 place-items-center rounded-full"
              style={{ background: `conic-gradient(#8B5CF6 ${confidenceScore}%, #EEE9F5 0)` }}
              aria-label={`Уверенность прогнозов ${confidenceScore}%`}
            >
              <div className="grid h-16 w-16 place-items-center rounded-full bg-white">
                <span className="text-xl font-black text-mira-primary">{confidenceScore}%</span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-mira-muted">
              На основе {norm.observedCycles} циклов и {totalDays} дней с отметками.
            </p>
          </div>
        </Card>
        <ForecastCard
          label="Следующие месячные"
          title={norm.daysUntilPeriod <= 0 ? "задержка" : `через ${periodWindowStart}-${periodWindowEnd} дн.`}
          body={norm.daysUntilPeriod <= 0 ? `Задержка ${norm.delayDays} дн. Можно разобрать причины.` : `Окно прогноза: примерно ${norm.daysUntilPeriod} дн.`}
          tone={norm.daysUntilPeriod <= 3 ? "alert" : "neutral"}
        />
        <ForecastCard
          label="ПМС может начаться"
          title={norm.daysUntilPeriod <= 5 ? "скоро" : `через ${pmsStart}-${pmsEnd} дн.`}
          body={pmsEntries.length > 0 ? `Уже есть ${pmsEntries.length} ПМС-отметок для прогноза.` : "Отмечай настроение и симптомы, чтобы Mira предупредила заранее."}
          tone="watch"
        />
        <ForecastCard
          label="Фаза цикла"
          title={currentPhaseLabel}
          body={`День цикла ${cycleDay} из ${cycleLength}. Советы ниже учитывают эту фазу.`}
          tone="neutral"
        />
      </div>

      <Card className={`mb-4 p-4 ${toneClass[heroTone]}`}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/70">
            {redFlags.length > 0 ? <AlertCircle className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest">Главный вывод</p>
            <p className="mt-1 text-lg font-bold leading-snug text-mira-text">{heroTitle}</p>
            <p className="mt-1 text-sm leading-relaxed text-mira-muted">{heroBody}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Button onClick={() => onCheckIn?.()}>
            <Plus className="h-4 w-4" /> Отметить сегодня
          </Button>
          <Button variant="outline" onClick={() => navigate("report")}>
            <FileText className="h-4 w-4" /> Отчёт врачу
          </Button>
        </div>
      </Card>

      <SectionTitle label="1" title={evidenceItems.length > 0 ? "Что уже повторяется" : "Что появится здесь"} />
      <div className="mb-5 space-y-3">
        {evidenceItems.length > 0 ? (
          evidenceItems.map(item => (
            <Card key={item.key} className={`p-4 ${toneClass[item.tone]}`}>
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/70 text-sm font-black">{item.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-snug text-mira-text">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-mira-muted">{item.body}</p>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="border-mira-lavender/20 bg-mira-bg p-4">
            <p className="text-sm font-bold text-mira-text">Пока нет устойчивого повтора</p>
            <p className="mt-1 text-xs leading-relaxed text-mira-muted">
              Отмечай состояние несколько дней. Mira покажет, что повторяется именно у тебя: боль, ПМС, сон, энергия или настроение.
            </p>
          </Card>
        )}
      </div>

      <SectionTitle label="2" title="Что дают мои отметки" />
      <Card className="mb-3 border-mira-lavender/20 bg-white p-4">
        <p className="mb-3 text-sm font-bold text-mira-text">Как эти данные помогают тебе</p>
        <div className="grid gap-3 md:grid-cols-5">
          <DataBenefit icon="📅" title="Готовиться" body="Планировать дни до месячных без неожиданностей." />
          <DataBenefit icon="💗" title="Понимать ПМС" body="Настроение и симптомы становятся не случайными." />
          <DataBenefit icon="⚡" title="Планировать нагрузку" body="Выбирать лучшие дни для спорта и работы." />
          <DataBenefit icon="💧" title="Находить триггеры" body="Сон, вода, еда и стресс связываются с самочувствием." />
          <DataBenefit icon="🛡️" title="Идти к врачу" body="Факты уже собраны и готовы к отчёту." />
        </div>
      </Card>
      <div className="mb-5 grid grid-cols-2 gap-3">
        {trackerValueCards.map(card => (
          <TrackerValueCard key={card.title} {...card} />
        ))}
      </div>

      <SectionTitle label="3" title="Как это влияет на жизнь" />
      <WorkAnalyticsCard mode={workMode} />

      <SectionTitle label="4" title="Что сделать дальше" />
      <div className="mb-5 space-y-3">
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mira-lavender-light text-mira-primary">
              <ClipboardList className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-mira-text">
                {today ? "Сегодня уже есть отметка" : "Отметь сегодняшнее состояние"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-mira-muted">
                {today
                  ? `Если хочешь точнее: добавь ${shortList(missingToday, "ничего не нужно")}.`
                  : "Одна отметка сегодня поможет понять связь цикла, сна, энергии, боли и настроения."}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E0F5E8] text-mira-success">
              <Target className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-mira-text">Чтобы выводы стали личными: {weakestNeed.label.toLowerCase()}</p>
              <p className="mt-1 text-xs leading-relaxed text-mira-muted">
                Сейчас собрано {weakestNeed.count}/{weakestNeed.goal} {weakestNeed.unit}. Это поможет Mira увидеть: {weakestNeed.why}.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <SectionTitle label="5" title="Когда лучше к врачу" />
      <div className="mb-5 space-y-3">
        {redFlags.length > 0 ? (
          redFlags.slice(0, 3).map(flag => (
            <Card key={flag.title} className="border-mira-cycle/20 bg-[#F8E8EE]/45 p-4">
              <p className="text-sm font-bold text-mira-text">{flag.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-mira-muted">{flag.body}</p>
            </Card>
          ))
        ) : (
          <Card className="border-mira-success/15 bg-[#E0F5E8]/25 p-4">
            <p className="text-sm font-bold text-mira-text">Срочных сигналов нет</p>
            <p className="mt-1 text-xs leading-relaxed text-mira-muted">
              По текущим отметкам нет повторяющихся красных флагов. Если появится резкая боль, обморок, очень обильное кровотечение или кровь после секса — лучше обратиться за медицинской помощью.
            </p>
          </Card>
        )}

        <Button className="w-full" variant="outline" onClick={() => navigate("report")}>
          <FileText className="h-4 w-4" /> Собрать отчёт врачу
        </Button>
      </div>

      <details className="mb-5 rounded-2xl border border-mira-lavender/20 bg-white p-4">
        <summary className="cursor-pointer text-sm font-bold text-mira-text">
          Подробности по циклу и самочувствию
        </summary>
        <p className="mt-1 text-xs leading-relaxed text-mira-muted">
          Здесь можно посмотреть цифры, если хочется разобраться глубже.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-mira-muted">Цикл</p>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Цикл" value={`${cycleLength}`} note="дней по норме" />
              <MiniStat label="Месячные" value={`${periodLength}`} note="дней обычно" />
              <MiniStat label="Циклов" value={`${norm.observedCycles}`} note="наблюдаем" />
              <MiniStat label="Разброс" value={norm.observedCycles >= 2 ? `${norm.spread}` : "—"} note="дней между циклами" />
            </div>
          </div>

          {cycleAnalytics && (
            <CycleAnalyticsCard analytics={cycleAnalytics} onOpenReport={() => navigate("report")} />
          )}

          {usefulMetrics.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-mira-muted">Показатели</p>
              <div className="grid grid-cols-2 gap-3">
                {health.metrics.map((metric) => {
                  const meta = statusMeta[metric.status];
                  return (
                    <Card key={metric.id} className="p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-lg">{metric.emoji}</span>
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />
                      </div>
                      <p className="text-xs font-bold text-mira-text">{metric.label}</p>
                      <p className="mt-1 text-[11px] font-semibold" style={{ color: meta.color }}>{metric.verdict}</p>
                      <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-mira-muted">{metric.detail}</p>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </details>

      <details className="mb-5 rounded-2xl border border-mira-lavender/20 bg-white p-4">
        <summary className="cursor-pointer text-sm font-bold text-mira-text">
          Что Mira ещё не знает обо мне
        </summary>
        <p className="mt-1 text-xs leading-relaxed text-mira-muted">
          Эти отметки помогают отличать случайный плохой день от твоего повторяющегося паттерна.
        </p>
        <div className="mt-4 space-y-3">
          {dataNeeds.map((need) => {
            const Icon = need.icon;
            const value = pct(need.count, need.goal);
            const done = value >= 100;
            return (
              <div key={need.id} className="grid grid-cols-[32px_1fr_auto] items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mira-bg text-mira-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <p className="truncate text-xs font-bold text-mira-text">{need.label}</p>
                    {done && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-mira-success" />}
                  </div>
                  <Progress value={value} color={need.color} />
                  <p className="mt-1 truncate text-[10px] text-mira-muted">{need.why}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-mira-text">{need.count}/{need.goal}</p>
                  <p className="text-[10px] text-mira-muted">{need.unit}</p>
                </div>
              </div>
            );
          })}
        </div>
      </details>

    </div>
  );
}
