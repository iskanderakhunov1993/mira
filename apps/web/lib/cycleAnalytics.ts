import { getCycleNorm } from "./cycleEngine";
import type { DailyCheckIn, MiraLocalData } from "./types";

const MS_DAY = 86_400_000;

export type CycleAnalyticsPoint = {
  label: string;
  start: string;
  length: number;
  painDays: number;
  strongPainDays: number;
  lowEnergyDays: number;
  negativeMoodDays: number;
  heavyFlowDays: number;
  pmsDays: number;
  delayDays: number;
};

export type CycleAnalyticsSummary = {
  cycles: CycleAnalyticsPoint[];
  headline: string;
  insight: string;
  doctorNote?: string;
  links: Array<{ label: string; value: string; note: string }>;
};

function daysBetween(a: string, b: string) {
  return Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / MS_DAY);
}

function cycleDayFor(date: string, start: string, length: number) {
  const diff = daysBetween(start, date);
  return ((diff % length) + length) % length + 1;
}

function isNegativeMood(checkIn: DailyCheckIn) {
  return checkIn.mood?.value === "sadness" || checkIn.mood?.value === "anger" || checkIn.mood?.value === "anxiety" || checkIn.mood?.value === "swings";
}

export function getCycleAnalytics(data: MiraLocalData): CycleAnalyticsSummary | null {
  const profile = data.profile;
  if (!profile) return null;

  const norm = getCycleNorm(profile);
  const starts = Array.from(new Set([profile.cycleConfig.periodStart, ...(profile.cycleConfig.periodStarts ?? [])]))
    .filter(Boolean)
    .sort();
  const checkIns = Object.values(data.checkIns).sort((a, b) => a.date.localeCompare(b.date));

  const points: CycleAnalyticsPoint[] = [];
  const effectiveStarts = starts.length > 0 ? starts : [norm.lastPeriodStart];

  for (let i = 0; i < effectiveStarts.length; i++) {
    const start = effectiveStarts[i];
    const nextStart = effectiveStarts[i + 1];
    const length = nextStart ? daysBetween(start, nextStart) : norm.cycleLength;
    if (length < 15 || length > 60) continue;

    const entries = checkIns.filter(checkIn => {
      if (nextStart) return checkIn.date >= start && checkIn.date < nextStart;
      const day = cycleDayFor(checkIn.date, start, length);
      return checkIn.date >= start && day <= length;
    });

    points.push({
      label: `Цикл ${points.length + 1}`,
      start,
      length,
      painDays: entries.filter(c => c.pain?.kinds.some(kind => kind !== "none")).length,
      strongPainDays: entries.filter(c => c.pain?.level === "strong").length,
      lowEnergyDays: entries.filter(c => c.energy?.value === "low" || c.energy?.value === "exhausted").length,
      negativeMoodDays: entries.filter(isNegativeMood).length,
      heavyFlowDays: entries.filter(c => c.period?.intensity === "heavy" || c.period?.intensity === "very_heavy").length,
      pmsDays: entries.filter(c => c.pms && c.pms.symptoms.length > 0).length,
      delayDays: Math.max(0, length - norm.cycleLength),
    });
  }

  const cycles = points.slice(-3);
  if (cycles.length === 0) return null;

  const strongPainTotal = cycles.reduce((sum, c) => sum + c.strongPainDays, 0);
  const pmsTotal = cycles.reduce((sum, c) => sum + c.pmsDays, 0);
  const moodTotal = cycles.reduce((sum, c) => sum + c.negativeMoodDays, 0);
  const lowEnergyTotal = cycles.reduce((sum, c) => sum + c.lowEnergyDays, 0);
  const heavyFlowTotal = cycles.reduce((sum, c) => sum + c.heavyFlowDays, 0);
  const delayTotal = cycles.reduce((sum, c) => sum + c.delayDays, 0);

  let headline = "Картина цикла формируется";
  let insight = "Mira сравнивает последние циклы и ищет повторы по боли, настроению, энергии, ПМС и обильности.";
  let doctorNote: string | undefined;

  if (strongPainTotal >= 2) {
    headline = "Сильная боль повторяется";
    insight = `За последние ${cycles.length} цикла сильная боль отмечена ${strongPainTotal} раз. Похоже, это повторяется и за этим стоит понаблюдать.`;
    doctorNote = "Если сильная боль мешает обычной жизни или повторяется в первые дни месячных, стоит обсудить это с врачом.";
  } else if (pmsTotal >= 3 || moodTotal >= 3) {
    headline = "ПМС и настроение имеют повтор";
    insight = `ПМС/эмоциональные симптомы отмечены ${pmsTotal + moodTotal} раз за последние циклы. Лучше заранее снижать нагрузку и отмечать триггеры.`;
  } else if (lowEnergyTotal >= 3) {
    headline = "Энергия заметно проседает";
    insight = `Низкая энергия отмечена ${lowEnergyTotal} раз. Проверь связь со сном, питанием, нагрузкой и фазой цикла.`;
  } else if (heavyFlowTotal >= 2 || delayTotal > 0) {
    headline = "Есть цикл-сигналы для внимания";
    insight = heavyFlowTotal >= 2
      ? `Обильность повторяется ${heavyFlowTotal} раз. Это полезно показать врачу, если есть слабость или усталость.`
      : `Задержки суммарно ${delayTotal} дн. Mira поможет собрать возможные причины без паники.`;
  }

  return {
    cycles,
    headline,
    insight,
    doctorNote,
    links: [
      { label: "Сон → энергия", value: `${lowEnergyTotal}`, note: "дней низкой энергии" },
      { label: "ПМС → настроение", value: `${pmsTotal + moodTotal}`, note: "эмоциональных отметок" },
      { label: "Еда/тренировки", value: `${checkIns.filter(c => c.meals?.length || data.workouts.some(w => w.date === c.date)).length}`, note: "дней для связей" },
    ],
  };
}
