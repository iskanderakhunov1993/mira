"use client";

import { useState } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  Footprints,
  HeartPulse,
  Moon,
  Plus,
  ShieldCheck,
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
import { getCorrelations } from "@/lib/correlations";
import { getHealthSummary, statusMeta } from "@/lib/healthScore";
import { getNormMap, getNormOverallPercent, getSmartInsights } from "@/lib/insights";
import { dateKey } from "@/lib/store";
import type { ScreenProps } from "./types";
import type { DailyCheckIn } from "@/lib/types";

type DetailTab = "cycle" | "symptoms" | "state" | "safety";
type Tone = "success" | "watch" | "alert" | "neutral";
type IconType = typeof CalendarDays;

const moodLabels: Record<string, string> = {
  normal: "Спокойно",
  joy: "Радость",
  sadness: "Грусть",
  anger: "Раздражение",
  anxiety: "Тревога",
  swings: "Перепады",
};
const energyLabels: Record<string, string> = {
  exhausted: "Истощение",
  low: "Низкая",
  normal: "Нормальная",
  high: "Высокая",
};
const sleepLabels: Record<string, string> = {
  good: "Хороший",
  normal: "Нормальный",
  bad: "Плохой",
  little: "Мало сна",
  insomnia: "Бессонница",
};
const painLabels: Record<string, string> = {
  cramps: "Спазмы",
  lower_abdomen: "Низ живота",
  headache: "Голова",
  breast: "Грудь",
  back: "Спина",
  ovulatory: "Овуляторная",
};
const appetiteLabels: Record<string, string> = {
  low: "Низкий аппетит",
  normal: "Обычный аппетит",
  high: "Высокий аппетит",
};
const libidoLabels: Record<string, string> = {
  low: "Низкое либидо",
  normal: "Обычное либидо",
  high: "Высокое либидо",
};

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

function countBy<T>(arr: T[], fn: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of arr) {
    const key = fn(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function pct(count: number, goal: number) {
  return Math.min(100, Math.round((count / Math.max(goal, 1)) * 100));
}

function shortList(items: string[], empty: string) {
  if (items.length === 0) return empty;
  if (items.length <= 2) return items.join(", ");
  return `${items.slice(0, 2).join(", ")} +${items.length - 2}`;
}

function cycleDayForEntry(entry: DailyCheckIn, periodStart: string, cycleLength: number) {
  const start = new Date(periodStart);
  const date = new Date(entry.date);
  const diff = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return ((diff % cycleLength) + cycleLength) % cycleLength + 1;
}

function renderDistribution(counts: Record<string, number>, labels: Record<string, string>, total: number, color: string) {
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) {
    return <p className="text-xs italic text-mira-muted">Пока нет данных</p>;
  }

  return (
    <div className="space-y-3">
      {sorted.map(([key, count]) => (
        <div key={key}>
          <div className="mb-1 flex justify-between gap-3 text-xs">
            <span className="truncate text-mira-text">{labels[key] ?? key}</span>
            <span className="shrink-0 text-mira-muted">{Math.round((count / Math.max(total, 1)) * 100)}%</span>
          </div>
          <Progress value={(count / Math.max(total, 1)) * 100} color={color} />
        </div>
      ))}
    </div>
  );
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

export function AnalyticsScreen({ data, navigate, onCheckIn }: ScreenProps) {
  const [detailTab, setDetailTab] = useState<DetailTab>("cycle");
  const profile = data.profile;
  const today = data.checkIns[dateKey()];
  const checkIns = Object.values(data.checkIns);
  const totalDays = checkIns.length;

  const norm = getCycleNorm(profile);
  const cycleLength = norm.cycleLength;
  const periodLength = profile?.cycleConfig.periodLength ?? 5;
  const normMap = getNormMap(data);
  const normOverall = getNormOverallPercent(data);
  const health = getHealthSummary(data);
  const redFlags = getRedFlags(data);
  const smartInsights = getSmartInsights(data);
  const correlations = getCorrelations(data);
  const phaseCorrelations = getPhaseCorrelations(data);

  const painEntries = checkIns.filter(c => c.pain && c.pain.kinds.some(k => k !== "none"));
  const strongPainEntries = painEntries.filter(c => c.pain?.level === "strong");
  const sleepEntries = checkIns.filter(c => c.sleep);
  const energyEntries = checkIns.filter(c => c.energy);
  const moodEntries = checkIns.filter(c => c.mood);
  const pmsEntries = checkIns.filter(c => c.pms && c.pms.symptoms.length > 0);
  const symptomLogEntries = checkIns.filter(c => c.symptomLog);
  const prePeriodEntries = profile?.cycleConfig.periodStart
    ? symptomLogEntries.filter(entry => {
      const day = cycleDayForEntry(entry, profile.cycleConfig.periodStart, cycleLength);
      return day > cycleLength - 7 || day <= periodLength;
    })
    : [];
  const prePeriodSignals = [
    ...prePeriodEntries.flatMap(entry => {
      const log = entry.symptomLog;
      if (!log) return [];
      return [
        log.appetite === "high" ? "растёт аппетит" : null,
        log.sweetCraving ? "тянет к сладкому" : null,
        log.anxiety ? "растёт тревога" : null,
        log.libido === "low" ? "снижается либидо" : null,
        entry.energy?.value === "low" || entry.energy?.value === "exhausted" ? "падает энергия" : null,
      ].filter((item): item is string => Boolean(item));
    }),
  ];
  const topPrePeriodSignals = Object.entries(countBy(prePeriodSignals, v => v)).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const mealDays = checkIns.filter(c => c.meals && c.meals.length > 0).length;
  const waterDays = Object.keys(data.waterLog ?? {}).length;
  const walkingEntries = Object.values(data.walkingLog ?? {}).filter(entry => entry.steps > 0);
  const walkingDays = walkingEntries.length;
  const avgSteps = walkingDays > 0 ? Math.round(walkingEntries.reduce((sum, entry) => sum + entry.steps, 0) / walkingDays) : 0;

  const missingToday = [
    !today?.sleep ? "сон" : null,
    !today?.energy ? "энергию" : null,
    !today?.mood ? "настроение" : null,
    !today?.pms ? "ПМС" : null,
  ].filter((item): item is string => Boolean(item));

  const dataNeeds: Array<{
    id: string;
    icon: IconType;
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

  const readiness = Math.round(dataNeeds.reduce((sum, need) => sum + pct(need.count, need.goal), 0) / dataNeeds.length);
  const weakestNeed = dataNeeds.slice().sort((a, b) => pct(a.count, a.goal) - pct(b.count, b.goal))[0];
  const usefulMetrics = health.metrics.filter(metric => metric.status !== "nodata");
  const watchMetrics = health.metrics.filter(metric => metric.status === "watch" || metric.status === "concern");

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
      ? "Пока собираем базу для личной нормы"
      : evidenceItems.length > 0
        ? "Mira уже видит первые паттерны"
        : "Данных становится достаточно для наблюдений";
  const heroBody = redFlags.length > 0
    ? "На этой странице собраны факты, которые можно превратить в отчёт для врача."
    : totalDays < 7
      ? `Нужно ещё ${Math.max(0, 7 - totalDays)} отметок, чтобы отличать обычное для тебя от случайного дня.`
        : "Сравниваем цикл, сон, боль, ходьбу, энергию и настроение, чтобы подсвечивать не просто цифры, а смысл.";

  const detailTabs: Array<{ id: DetailTab; label: string; icon: IconType }> = [
    { id: "cycle", label: "Цикл", icon: TrendingUp },
    { id: "symptoms", label: "Симптомы", icon: HeartPulse },
    { id: "state", label: "Сон и энергия", icon: Moon },
    { id: "safety", label: "Врач", icon: ShieldCheck },
  ];

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-mira-text">Аналитика</h1>
        <p className="mt-1 text-sm text-mira-muted">Что Mira уже понимает и какие данные нужны дальше</p>
      </div>

      <Card className={`mb-4 p-4 ${toneClass[heroTone]}`}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/70">
            {redFlags.length > 0 ? <AlertCircle className="h-5 w-5" /> : <Target className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest">Главное сейчас</p>
              <Badge className="shrink-0 bg-white/80 text-[10px] shadow-none">{readiness}% данных</Badge>
            </div>
            <p className="text-base font-bold leading-snug text-mira-text">{heroTitle}</p>
            <p className="mt-1 text-xs leading-relaxed text-mira-muted">{heroBody}</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <MiniStat label="Отметки" value={`${totalDays}`} note="дней" />
          <MiniStat label="Норма" value={`${normOverall}%`} note="карта ритма" />
          <MiniStat label="Сигналы" value={`${watchMetrics.length}`} note="для внимания" />
        </div>
      </Card>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <Card className="p-3">
          <div className="mb-2 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-mira-primary" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Сегодня</p>
          </div>
          <p className="text-sm font-bold leading-snug text-mira-text">
            {today ? "Есть отметка" : "День пока пустой"}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-mira-muted">
            {today
              ? `Не хватает: ${shortList(missingToday, "всё важное отмечено")}`
              : "Отметка сегодня сильнее всего улучшит аналитику."}
          </p>
          <Button className="mt-3 w-full" size="sm" onClick={() => onCheckIn?.()}>
            <Plus className="h-4 w-4" /> Отметить
          </Button>
        </Card>

        <Card className="p-3">
          <div className="mb-2 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-mira-success" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Главный пробел</p>
          </div>
          <p className="text-sm font-bold leading-snug text-mira-text">{weakestNeed.label}</p>
          <p className="mt-1 text-[11px] leading-snug text-mira-muted">
            {weakestNeed.count}/{weakestNeed.goal} {weakestNeed.unit} · {weakestNeed.why}
          </p>
          <div className="mt-3">
            <Progress value={pct(weakestNeed.count, weakestNeed.goal)} color={weakestNeed.color} />
          </div>
        </Card>
      </div>

      <SectionTitle label="Данные" title="Что важно собирать для точной аналитики" />
      <Card className="mb-5 p-4">
        <div className="space-y-3">
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
      </Card>

      <SectionTitle label="Выводы" title={evidenceItems.length > 0 ? "Что уже видно по данным" : "Какие выводы появятся здесь"} />
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
            <p className="text-sm font-bold text-mira-text">Пока рано делать выводы</p>
            <p className="mt-1 text-xs leading-relaxed text-mira-muted">
              После нескольких отметок Mira начнёт показывать связи: когда падает энергия, в какие дни чаще боль, как сон связан с фазой цикла.
            </p>
          </Card>
        )}
      </div>

      {usefulMetrics.length > 0 && (
        <div className="mb-5">
          <SectionTitle label="Состояние" title="Короткая сводка по показателям" />
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

      <SectionTitle label="Подробности" title="Разобрать данные по разделам" />
      <div className="mb-4 grid grid-cols-2 gap-2">
        {detailTabs.map(tab => {
          const Icon = tab.icon;
          const active = detailTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setDetailTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-bold transition ${
                active
                  ? "border-mira-primary bg-mira-lavender-light text-mira-primary"
                  : "border-mira-lavender/25 bg-white text-mira-muted"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {detailTab === "cycle" && (
        <div className="mb-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Цикл" value={`${cycleLength}`} note="дней по норме" />
            <MiniStat label="Месячные" value={`${periodLength}`} note="дней обычно" />
            <MiniStat label="Циклов" value={`${norm.observedCycles}`} note="наблюдаем" />
            <MiniStat label="Разброс" value={norm.observedCycles >= 2 ? `${norm.spread}` : "—"} note="дней между циклами" />
          </div>
          <Card className="p-4">
            <p className="text-sm font-bold text-mira-text">Что это значит</p>
            <p className="mt-1 text-xs leading-relaxed text-mira-muted">
              {norm.observedCycles === 0
                ? "Пока длина цикла взята из онбординга. Отмечай начало месячных, чтобы Mira посчитала твою реальную норму."
                : norm.observedCycles === 1
                  ? `Есть 1 завершённый цикл. Нужен ещё один, чтобы сравнить длительность и понять разброс.`
                  : norm.isRegular
                    ? `Цикл выглядит регулярным: ${cycleLength} дней, разброс ${norm.spread} дн.`
                    : `Цикл колеблется от ${norm.minLength} до ${norm.maxLength} дней. Если разброс большой и повторяется, это стоит обсудить.`}
            </p>
          </Card>
        </div>
      )}

      {detailTab === "symptoms" && (
        <div className="mb-5 space-y-3">
          <Card className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Боль</p>
            <p className="mt-2 text-2xl font-black text-mira-text">{painEntries.length} <span className="text-sm font-normal text-mira-muted">дней</span></p>
            <p className="mt-1 text-xs leading-relaxed text-mira-muted">
              {strongPainEntries.length > 0
                ? `Сильная боль отмечена ${strongPainEntries.length} раз. Если мешает обычной жизни, стоит обсудить с врачом.`
                : painEntries.length > 0
                  ? "Продолжай отмечать, в какие дни она появляется, чтобы увидеть фазу и повтор."
                  : "Если боли нет, это нормально. Отмечай боль только когда она появляется."}
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Типы боли</p>
            <div className="mt-3">
              {renderDistribution(
                countBy(painEntries.flatMap(c => c.pain!.kinds.filter(k => k !== "none")), v => v),
                painLabels,
                painEntries.flatMap(c => c.pain!.kinds.filter(k => k !== "none")).length || 1,
                "bg-mira-cycle",
              )}
            </div>
          </Card>

          <Card className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">ПМС</p>
            <div className="mt-3">
              {(() => {
                const allSymptoms = pmsEntries.flatMap(c => c.pms!.symptoms);
                const sorted = Object.entries(countBy(allSymptoms, v => v)).sort((a, b) => b[1] - a[1]);
                if (sorted.length === 0) return <p className="text-xs italic text-mira-muted">Пока нет данных о ПМС</p>;
                return (
                  <div className="space-y-2">
                    {sorted.slice(0, 5).map(([symptom, count]) => (
                      <div key={symptom} className="flex items-center justify-between rounded-lg bg-mira-bg px-3 py-2">
                        <span className="text-xs font-semibold text-mira-text">{symptom}</span>
                        <Badge className="bg-white text-[10px] shadow-none">{count}x</Badge>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </Card>

          <Card className="border-mira-primary/10 bg-mira-lavender-light/20 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Повторяется перед месячными</p>
            {topPrePeriodSignals.length > 0 ? (
              <>
                <p className="mt-2 text-sm font-bold leading-relaxed text-mira-text">
                  Чаще всего: {topPrePeriodSignals.map(([signal]) => signal).join(", ")}.
                </p>
                <p className="mt-1 text-xs leading-relaxed text-mira-muted">
                  Это не диагноз, а твой повторяющийся паттерн. Его можно использовать, чтобы заранее снизить нагрузку и подготовить аптечку.
                </p>
                <div className="mt-3 space-y-2">
                  {topPrePeriodSignals.map(([signal, count]) => (
                    <div key={signal} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                      <span className="text-xs font-semibold text-mira-text">{signal}</span>
                      <Badge className="bg-mira-lavender-light text-[10px] text-mira-primary shadow-none">{count}x</Badge>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-2 text-xs leading-relaxed text-mira-muted">
                Отмечай лог симптомов несколько дней перед месячными: аппетит, сладкое, тревогу, либидо и лекарства. Через 2-3 цикла Mira покажет устойчивый повтор.
              </p>
            )}
          </Card>

          <Card className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Лог симптомов</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <MiniStat label="Аппетит" value={`${symptomLogEntries.filter(c => c.symptomLog?.appetite).length}`} note={shortList(symptomLogEntries.flatMap(c => c.symptomLog?.appetite ? [appetiteLabels[c.symptomLog.appetite]] : []), "нет данных")} />
              <MiniStat label="Сладкое" value={`${symptomLogEntries.filter(c => c.symptomLog?.sweetCraving).length}`} note="дней с тягой" />
              <MiniStat label="Тревога" value={`${symptomLogEntries.filter(c => c.symptomLog?.anxiety).length}`} note="отдельных отметок" />
              <MiniStat label="Либидо" value={`${symptomLogEntries.filter(c => c.symptomLog?.libido).length}`} note={shortList(symptomLogEntries.flatMap(c => c.symptomLog?.libido ? [libidoLabels[c.symptomLog.libido]] : []), "нет данных")} />
              <MiniStat label="Лекарства" value={`${symptomLogEntries.filter(c => c.symptomLog?.medications?.length).length}`} note="дней с отметкой" />
            </div>
          </Card>
        </div>
      )}

      {detailTab === "state" && (
        <div className="mb-5 space-y-3">
          <Card className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Сон</p>
            <div className="mt-3">
              {renderDistribution(
                countBy(sleepEntries.map(c => c.sleep!.quality), v => v),
                sleepLabels,
                sleepEntries.length || 1,
                "bg-[#7E8EC4]",
              )}
            </div>
          </Card>

          <Card className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Энергия</p>
            <div className="mt-3">
              {renderDistribution(
                countBy(energyEntries.map(c => c.energy!.value), v => v),
                energyLabels,
                energyEntries.length || 1,
                "bg-[#C4B07E]",
              )}
            </div>
          </Card>

          <Card className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Настроение</p>
            <div className="mt-3">
              {renderDistribution(
                countBy(moodEntries.map(c => c.mood!.value), v => v),
                moodLabels,
                moodEntries.length || 1,
                "bg-mira-primary",
              )}
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Питание" value={`${mealDays}`} note="дней с едой" />
            <MiniStat label="Вода" value={`${waterDays}`} note="дней с водой" />
            <MiniStat label="Ходьба" value={`${walkingDays}`} note="дней с шагами" />
            <MiniStat label="Среднее" value={avgSteps ? `${avgSteps}` : "—"} note="шагов в день" />
          </div>
        </div>
      )}

      {detailTab === "safety" && (
        <div className="mb-5 space-y-3">
          {redFlags.length > 0 ? (
            redFlags.map(flag => (
              <Card key={flag.title} className="border-mira-cycle/20 bg-[#F8E8EE]/45 p-4">
                <p className="text-sm font-bold text-mira-text">{flag.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-mira-muted">{flag.body}</p>
              </Card>
            ))
          ) : (
            <Card className="border-mira-success/15 bg-[#E0F5E8]/25 p-4">
              <p className="text-sm font-bold text-mira-text">Срочных сигналов нет</p>
              <p className="mt-1 text-xs leading-relaxed text-mira-muted">
                Это не заменяет врача, но по текущим отметкам нет повторяющихся красных флагов.
              </p>
            </Card>
          )}

          <Card className="p-4">
            <p className="text-sm font-bold text-mira-text">Когда стоит обратиться к врачу</p>
            <ul className="mt-3 space-y-2">
              {[
                "Очень сильная или резкая боль",
                "Очень обильное кровотечение или месячные дольше 7 дней",
                "Кровь между месячными или кровь после секса",
                "Боль во время секса, обморок, сильная слабость или частые задержки",
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-mira-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mira-lavender" />
                  {item}
                </li>
              ))}
            </ul>
            <Button className="mt-4 w-full" variant="outline" onClick={() => navigate("report")}>
              <FileText className="h-4 w-4" /> Собрать отчёт
            </Button>
          </Card>
        </div>
      )}

      <Card className="mb-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-mira-text">Нужна точнее аналитика?</p>
            <p className="mt-1 text-xs leading-relaxed text-mira-muted">
              Самое ценное сейчас: {weakestNeed.label.toLowerCase()} и сегодняшняя отметка.
            </p>
          </div>
          <button
            onClick={() => onCheckIn?.()}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-mira-primary px-3 py-2 text-xs font-bold text-white transition active:scale-[0.98]"
          >
            Добавить <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </Card>
    </div>
  );
}
