import type { MiraLocalData, DailyCheckIn, CyclePhase } from "./types";
import { getCycleDay, getCyclePhase } from "./store";
import { getCycleNorm } from "./cycleEngine";

export type Insight = {
  type: "observation" | "connection" | "action";
  icon: "pain" | "sleep" | "mood" | "energy" | "pms" | "cycle" | "norm" | "positive";
  title: string;
  body: string;
};

export type NormCategory = {
  id: string;
  label: string;
  percent: number;
  status: "empty" | "building" | "preliminary" | "stable";
  description: string;
};

export type DayPrediction = {
  energy: string | null;
  sleep: string | null;
  mood: string | null;
  pain: boolean;
  pms: string[];
  summary: string;
};

export type CycleSummary = {
  cycleNumber: number;
  totalDays: number;
  loggedDays: number;
  painDays: number;
  strongPainDays: number;
  avgSleep: string;
  topMood: string;
  topPms: string[];
  deviations: string[];
  highlight: string;
};

// ── Helpers ──

function getCheckInsInRange(data: MiraLocalData, daysBack: number): DailyCheckIn[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return Object.values(data.checkIns).filter(c => c.date >= cutoffStr);
}

function getCycleDayForDate(date: string, periodStart: string, cycleLength: number): number {
  const start = new Date(periodStart);
  const d = new Date(date);
  const days = Math.max(0, Math.floor((d.getTime() - start.getTime()) / 86_400_000));
  return (days % cycleLength) + 1;
}

function groupByCycleDay(checkIns: DailyCheckIn[], periodStart: string, cycleLength: number): Map<number, DailyCheckIn[]> {
  const map = new Map<number, DailyCheckIn[]>();
  for (const c of checkIns) {
    const day = getCycleDayForDate(c.date, periodStart, cycleLength);
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(c);
  }
  return map;
}

// ── Micro-insights (after log) ──

export function getMicroInsight(data: MiraLocalData, checkIn: DailyCheckIn): Insight {
  const allCheckIns = Object.values(data.checkIns);
  const profile = data.profile;
  const cycleLength = profile?.cycleConfig.cycleLength ?? 28;
  const periodLength = profile?.cycleConfig.periodLength ?? 5;
  const cycleDay = getCycleDay(profile);
  const phase = getCyclePhase(cycleDay, periodLength, cycleLength);

  // Strong pain repeating
  if (checkIn.pain?.level === "strong") {
    const strongPainDays = allCheckIns.filter(c => c.pain?.level === "strong");
    if (strongPainDays.length >= 3) {
      return {
        type: "action",
        icon: "pain",
        title: "Сильная боль повторяется",
        body: `Сильная боль отмечена ${strongPainDays.length} раз. Если она мешает обычной жизни, стоит обсудить это с врачом.`,
      };
    }
    if (strongPainDays.length >= 2) {
      return {
        type: "observation",
        icon: "pain",
        title: "Боль замечена повторно",
        body: "Мы отслеживаем паттерн. Ещё несколько отметок — и станет видно, в какие дни цикла она появляется.",
      };
    }
  }

  // Sleep pattern in luteal phase
  if (checkIn.sleep?.quality === "bad" || checkIn.sleep?.quality === "insomnia") {
    const badSleepInLuteal = allCheckIns.filter(c => {
      if (c.sleep?.quality !== "bad" && c.sleep?.quality !== "insomnia") return false;
      const d = getCycleDayForDate(c.date, profile?.cycleConfig.periodStart ?? "", cycleLength);
      return getCyclePhase(d, periodLength, cycleLength) === "luteal";
    });
    if (badSleepInLuteal.length >= 2 && phase === "luteal") {
      return {
        type: "connection",
        icon: "sleep",
        title: "Сон и лютеиновая фаза",
        body: `Плохой сон в этой фазе отмечен ${badSleepInLuteal.length} раз. Прогестерон повышает температуру тела — попробуй прохладную комнату (18-20°C).`,
      };
    }
  }

  // PMS pattern
  if (checkIn.pms && checkIn.pms.symptoms.length > 0) {
    const pmsDays = allCheckIns.filter(c => c.pms && c.pms.symptoms.length > 0);
    if (pmsDays.length >= 3) {
      const allSymptoms: Record<string, number> = {};
      for (const c of pmsDays) {
        for (const s of c.pms!.symptoms) allSymptoms[s] = (allSymptoms[s] ?? 0) + 1;
      }
      const top = Object.entries(allSymptoms).sort((a, b) => b[1] - a[1])[0];
      if (top) {
        return {
          type: "connection",
          icon: "pms",
          title: "ПМС-паттерн формируется",
          body: `«${top[0]}» — твой самый частый симптом (${top[1]} раз). Обычно появляется за несколько дней до месячных.`,
        };
      }
    }
  }

  // Mood + phase connection
  if (checkIn.mood?.value === "anxiety" || checkIn.mood?.value === "sadness") {
    const sameMoodInPhase = allCheckIns.filter(c => {
      if (c.mood?.value !== checkIn.mood?.value) return false;
      const d = getCycleDayForDate(c.date, profile?.cycleConfig.periodStart ?? "", cycleLength);
      return getCyclePhase(d, periodLength, cycleLength) === phase;
    });
    if (sameMoodInPhase.length >= 2) {
      const moodName = checkIn.mood?.value === "anxiety" ? "тревога" : "грусть";
      const phaseLabel = phase === "luteal" ? "лютеиновой" : phase === "menstruation" ? "менструальной" : "этой";
      return {
        type: "connection",
        icon: "mood",
        title: "Настроение и фаза цикла",
        body: `${moodName.charAt(0).toUpperCase() + moodName.slice(1)} в ${phaseLabel} фазе отмечена ${sameMoodInPhase.length} раз. Это не ты — это гормоны. Это нормально.`,
      };
    }
  }

  // Energy low
  if (checkIn.energy?.value === "exhausted" || checkIn.energy?.value === "low") {
    const lowEnergyDays = allCheckIns.filter(c => c.energy?.value === "exhausted" || c.energy?.value === "low");
    const periodDays = allCheckIns.filter(c => c.period);
    if (lowEnergyDays.length >= 3 && periodDays.length >= 2) {
      return {
        type: "connection",
        icon: "energy",
        title: "Энергия и цикл",
        body: "Низкая энергия может быть связана с потерей железа во время месячных. Гречка, шпинат и красное мясо помогут восполнить запасы.",
      };
    }
  }

  // Positive feedback — has enough data
  if (allCheckIns.length >= 28) {
    return {
      type: "observation",
      icon: "positive",
      title: "Личная норма формируется",
      body: `У тебя уже ${allCheckIns.length} дней данных. Аналитика становится точнее с каждой отметкой.`,
    };
  }

  // Default — encouraging
  const remaining = Math.max(0, 28 - allCheckIns.length);
  return {
    type: "observation",
    icon: "norm",
    title: "Данные сохранены",
    body: remaining > 0
      ? `Ещё ${remaining} отметок до первых выводов о твоей норме. Каждый день важен.`
      : "Чем больше данных, тем точнее будет твоя личная норма.",
  };
}

// ── Norm Map ──

export function getNormMap(data: MiraLocalData): NormCategory[] {
  const checkIns = Object.values(data.checkIns);
  const total = checkIns.length;

  function calcStatus(count: number): NormCategory["status"] {
    if (count === 0) return "empty";
    if (count < 14) return "building";
    if (count < 56) return "preliminary";
    return "stable";
  }

  function calcPercent(count: number): number {
    return Math.min(Math.round((count / 84) * 100), 100);
  }

  const painCount = checkIns.filter(c => c.pain).length;
  const sleepCount = checkIns.filter(c => c.sleep).length;
  const moodCount = checkIns.filter(c => c.mood).length;
  const energyCount = checkIns.filter(c => c.energy).length;
  const pmsCount = checkIns.filter(c => c.pms && c.pms.symptoms.length > 0).length;

  const statusLabels: Record<NormCategory["status"], string> = {
    empty: "Начни отслеживать",
    building: "Собираем данные...",
    preliminary: "Предварительная норма",
    stable: "Норма сформирована",
  };

  // Цикл: прогресс по РЕАЛЬНО наблюдённым циклам (нужно ~3 для стабильной нормы),
  // а не по числу галочек.
  const norm = getCycleNorm(data.profile);
  const cycleStatus: NormCategory["status"] =
    norm.observedCycles === 0 ? "empty" :
    norm.observedCycles === 1 ? "building" :
    norm.observedCycles < 3 ? "preliminary" : "stable";
  const cyclePercent = Math.min(100, Math.round((norm.observedCycles / 3) * 100));
  const cycleDesc =
    norm.observedCycles === 0 ? "Отметь начало месячных" :
    norm.observedCycles === 1 ? "1 цикл — нужно ещё" :
    norm.observedCycles < 3 ? `${norm.observedCycles} цикла · уточняется` : "Норма сформирована";

  return [
    { id: "cycle", label: "Цикл", percent: cyclePercent, status: cycleStatus, description: cycleDesc },
    { id: "pain", label: "Боль", percent: calcPercent(painCount), status: calcStatus(painCount), description: statusLabels[calcStatus(painCount)] },
    { id: "sleep", label: "Сон", percent: calcPercent(sleepCount), status: calcStatus(sleepCount), description: statusLabels[calcStatus(sleepCount)] },
    { id: "mood", label: "Настроение", percent: calcPercent(moodCount), status: calcStatus(moodCount), description: statusLabels[calcStatus(moodCount)] },
    { id: "energy", label: "Энергия", percent: calcPercent(energyCount), status: calcStatus(energyCount), description: statusLabels[calcStatus(energyCount)] },
  ];
}

export function getNormOverallPercent(data: MiraLocalData): number {
  const map = getNormMap(data);
  return Math.round(map.reduce((sum, c) => sum + c.percent, 0) / map.length);
}

// ── Day Prediction ──

export function getDayPrediction(data: MiraLocalData, targetCycleDay: number): DayPrediction | null {
  const profile = data.profile;
  if (!profile) return null;

  const cycleLength = profile.cycleConfig.cycleLength;
  const periodLength = profile.cycleConfig.periodLength;
  const allCheckIns = Object.values(data.checkIns);

  if (allCheckIns.length < 14) return null;

  const byCycleDay = groupByCycleDay(allCheckIns, profile.cycleConfig.periodStart, cycleLength);
  const dayData = byCycleDay.get(targetCycleDay);
  if (!dayData || dayData.length < 2) return null;

  // Energy prediction
  const energyValues = dayData.filter(c => c.energy).map(c => c.energy!.value);
  const energyCounts: Record<string, number> = {};
  for (const v of energyValues) energyCounts[v] = (energyCounts[v] ?? 0) + 1;
  const topEnergy = Object.entries(energyCounts).sort((a, b) => b[1] - a[1])[0];
  const energyLabels: Record<string, string> = { exhausted: "истощение", low: "низкая энергия", normal: "нормальная энергия", high: "высокая энергия" };

  // Sleep prediction
  const sleepValues = dayData.filter(c => c.sleep).map(c => c.sleep!.quality);
  const sleepCounts: Record<string, number> = {};
  for (const v of sleepValues) sleepCounts[v] = (sleepCounts[v] ?? 0) + 1;
  const topSleep = Object.entries(sleepCounts).sort((a, b) => b[1] - a[1])[0];
  const sleepLabels: Record<string, string> = { good: "хороший сон", normal: "нормальный сон", bad: "плохой сон", little: "мало сна", insomnia: "бессонница" };

  // Mood prediction
  const moodValues = dayData.filter(c => c.mood).map(c => c.mood!.value);
  const moodCounts: Record<string, number> = {};
  for (const v of moodValues) moodCounts[v] = (moodCounts[v] ?? 0) + 1;
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
  const moodLabels: Record<string, string> = { normal: "спокойное настроение", joy: "радость", sadness: "грусть", anger: "раздражение", anxiety: "тревога", swings: "перепады" };

  // Pain
  const hasPain = dayData.some(c => c.pain && c.pain.kinds.some(k => k !== "none"));

  // PMS
  const pmsSymptoms = dayData.filter(c => c.pms).flatMap(c => c.pms!.symptoms);
  const pmsCounts: Record<string, number> = {};
  for (const s of pmsSymptoms) pmsCounts[s] = (pmsCounts[s] ?? 0) + 1;
  const topPms = Object.entries(pmsCounts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([s]) => s);

  const parts: string[] = [];
  const phase = getCyclePhase(targetCycleDay, periodLength, cycleLength);
  const phaseLabels: Record<CyclePhase, string> = {
    menstruation: "менструация",
    follicular: "фолликулярная фаза",
    ovulation: "овуляция",
    luteal: "лютеиновая фаза",
  };
  parts.push(`${targetCycleDay}-й день цикла, ${phaseLabels[phase]}.`);

  if (topEnergy && topEnergy[1] >= 2 && topEnergy[0] !== "normal") {
    parts.push(`Обычно в этот день ${energyLabels[topEnergy[0]] ?? topEnergy[0]}.`);
  }
  if (topSleep && topSleep[1] >= 2 && topSleep[0] !== "normal" && topSleep[0] !== "good") {
    parts.push(`Сон может быть хуже обычного.`);
  }
  if (hasPain) parts.push("Возможна боль.");
  if (topPms.length > 0) parts.push(`Возможны ПМС-симптомы: ${topPms.join(", ").toLowerCase()}.`);

  return {
    energy: topEnergy ? (energyLabels[topEnergy[0]] ?? null) : null,
    sleep: topSleep ? (sleepLabels[topSleep[0]] ?? null) : null,
    mood: topMood ? (moodLabels[topMood[0]] ?? null) : null,
    pain: hasPain,
    pms: topPms,
    summary: parts.join(" "),
  };
}

// ── Cycle Summary ──

export function getCycleSummary(data: MiraLocalData): CycleSummary | null {
  const profile = data.profile;
  if (!profile) return null;

  const cycleLength = profile.cycleConfig.cycleLength;
  const checkIns = getCheckInsInRange(data, cycleLength);
  if (checkIns.length < 7) return null;

  const painDays = checkIns.filter(c => c.pain && c.pain.kinds.some(k => k !== "none"));
  const strongPainDays = painDays.filter(c => c.pain?.level === "strong");

  // Avg sleep
  const sleepHours = checkIns.filter(c => c.sleep?.hours).map(c => c.sleep!.hours!);
  const avgSleep = sleepHours.length > 0
    ? `${(sleepHours.reduce((a, b) => a + b, 0) / sleepHours.length).toFixed(1)} ч`
    : "—";

  // Top mood
  const moodCounts: Record<string, number> = {};
  for (const c of checkIns) {
    if (c.mood) moodCounts[c.mood.value] = (moodCounts[c.mood.value] ?? 0) + 1;
  }
  const moodLabels: Record<string, string> = { normal: "спокойно", joy: "радость", sadness: "грусть", anger: "раздражение", anxiety: "тревога", swings: "перепады" };
  const topMoodEntry = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
  const topMood = topMoodEntry ? (moodLabels[topMoodEntry[0]] ?? topMoodEntry[0]) : "—";

  // Top PMS
  const allPms = checkIns.filter(c => c.pms).flatMap(c => c.pms!.symptoms);
  const pmsCounts: Record<string, number> = {};
  for (const s of allPms) pmsCounts[s] = (pmsCounts[s] ?? 0) + 1;
  const topPms = Object.entries(pmsCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([s]) => s);

  // Deviations
  const deviations: string[] = [];
  if (strongPainDays.length >= 2) deviations.push(`Сильная боль: ${strongPainDays.length} дней`);
  const badSleep = checkIns.filter(c => c.sleep?.quality === "bad" || c.sleep?.quality === "insomnia");
  if (badSleep.length > checkIns.length * 0.3) deviations.push(`Плохой сон: ${badSleep.length} из ${checkIns.length} дней`);
  const lowEnergy = checkIns.filter(c => c.energy?.value === "exhausted" || c.energy?.value === "low");
  if (lowEnergy.length > checkIns.length * 0.3) deviations.push(`Низкая энергия: ${lowEnergy.length} дней`);

  // Highlight
  let highlight = "Продолжай отслеживать — каждая отметка делает норму точнее.";
  if (deviations.length === 0 && checkIns.length >= 14) {
    highlight = "Этот цикл в пределах твоей нормы. Всё хорошо.";
  } else if (deviations.length > 0) {
    highlight = "Есть отклонения — обрати внимание на аналитику.";
  }

  const totalCheckIns = Object.values(data.checkIns).length;
  const cycleNumber = Math.max(1, Math.ceil(totalCheckIns / cycleLength));

  return {
    cycleNumber,
    totalDays: cycleLength,
    loggedDays: checkIns.length,
    painDays: painDays.length,
    strongPainDays: strongPainDays.length,
    avgSleep,
    topMood,
    topPms,
    deviations,
    highlight,
  };
}

// ── Smart insights for analytics page ──

export function getSmartInsights(data: MiraLocalData): Insight[] {
  const insights: Insight[] = [];
  const profile = data.profile;
  if (!profile) return insights;

  const checkIns = Object.values(data.checkIns);
  const cycleLength = profile.cycleConfig.cycleLength;
  const periodLength = profile.cycleConfig.periodLength;

  if (checkIns.length < 7) return insights;

  // Pain pattern
  const painDays = checkIns.filter(c => c.pain && c.pain.kinds.some(k => k !== "none"));
  if (painDays.length >= 3) {
    const painCycleDays = painDays.map(c =>
      getCycleDayForDate(c.date, profile.cycleConfig.periodStart, cycleLength)
    );
    const inFirstTwo = painCycleDays.filter(d => d <= 2).length;
    if (inFirstTwo > painCycleDays.length * 0.5) {
      insights.push({
        type: "connection",
        icon: "pain",
        title: "Боль чаще в начале месячных",
        body: `Боль чаще всего появляется в 1-2 день месячных (${inFirstTwo} из ${painDays.length} раз). Это типичная дисменорея.`,
      });
    }
  }

  // PMS timing
  const pmsDays = checkIns.filter(c => c.pms && c.pms.symptoms.length > 0);
  if (pmsDays.length >= 3) {
    const pmsCycleDays = pmsDays.map(c =>
      getCycleDayForDate(c.date, profile.cycleConfig.periodStart, cycleLength)
    );
    const daysBeforePeriod = pmsCycleDays.map(d => cycleLength - d);
    const avgDaysBefore = Math.round(daysBeforePeriod.reduce((a, b) => a + b, 0) / daysBeforePeriod.length);
    insights.push({
      type: "connection",
      icon: "pms",
      title: `ПМС начинается за ~${avgDaysBefore} дней`,
      body: `Твои ПМС-симптомы чаще появляются за ${avgDaysBefore} дней до месячных. Это твой паттерн.`,
    });
  }

  // Sleep in luteal
  const badSleepLuteal = checkIns.filter(c => {
    if (c.sleep?.quality !== "bad" && c.sleep?.quality !== "insomnia") return false;
    const d = getCycleDayForDate(c.date, profile.cycleConfig.periodStart, cycleLength);
    return getCyclePhase(d, periodLength, cycleLength) === "luteal";
  });
  if (badSleepLuteal.length >= 3) {
    insights.push({
      type: "connection",
      icon: "sleep",
      title: "Сон ухудшается во второй половине цикла",
      body: `Плохой сон в лютеиновой фазе отмечен ${badSleepLuteal.length} раз. Это связано с прогестероном — прохладная комната и магний могут помочь.`,
    });
  }

  // Overall positive
  if (checkIns.length >= 56 && insights.length === 0) {
    insights.push({
      type: "observation",
      icon: "positive",
      title: "Всё в пределах твоей нормы",
      body: "За последние циклы серьёзных отклонений не замечено. Продолжай отслеживать.",
    });
  }

  return insights;
}
