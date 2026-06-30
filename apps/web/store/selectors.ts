import type { DailyLog, MiraState } from "./types";

export type SkinHistoryPoint = {
  cycleDay: number;
  acneCount: number;
  drynessCount: number;
  oilinessCount: number;
  hairLossCount: number;
  total: number;
};

export const selectCurrentCycle = (state: MiraState) => {
  return state.cycle.cycles.at(-1);
};

export const selectCycleStats = (state: MiraState) => {
  const lengths = state.cycle.cycles.map((cycle) => cycle.length);
  if (lengths.length === 0) {
    return { averageLength: state.cycle.averageLength, min: state.cycle.averageLength, max: state.cycle.averageLength, spread: 0 };
  }
  const min = Math.min(...lengths);
  const max = Math.max(...lengths);
  const averageLength = Math.round(lengths.reduce((sum, item) => sum + item, 0) / lengths.length);
  return { averageLength, min, max, spread: max - min };
};

export const selectMostCommonSymptoms = (state: MiraState) => {
  const counts = new Map<string, number>();
  const add = (name: string, active: boolean) => {
    if (active) counts.set(name, (counts.get(name) ?? 0) + 1);
  };

  state.logs.dailyLogs.forEach((log) => {
    add("Обильность", log.symptoms.bleeding.amount >= 2);
    add("Боль", log.symptoms.pain.level >= 1);
    add("Тревога", log.symptoms.mood === "anxious");
    add("Низкая энергия", log.symptoms.energy === "low" || log.symptoms.energy === "exhausted");
    add("Акне", log.symptoms.skin.acne);
  });

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
};

export const selectSkinHistory = (state: MiraState) => {
  const minCycleDay = Math.max(1, state.cycle.currentDay - state.cycle.averageLength * 3);
  const skinLogs = state.logs.dailyLogs.filter((log) => {
    const hasSkinData = log.symptoms.skin.acne || log.symptoms.skin.dryness || log.symptoms.skin.oiliness || log.symptoms.skin.hairLoss;
    return hasSkinData && log.cycleDay >= minCycleDay;
  });

  const grouped = new Map<number, SkinHistoryPoint>();

  skinLogs.forEach((log) => {
    const current = grouped.get(log.cycleDay) ?? {
      cycleDay: log.cycleDay,
      acneCount: 0,
      drynessCount: 0,
      oilinessCount: 0,
      hairLossCount: 0,
      total: 0,
    };

    if (log.symptoms.skin.acne) current.acneCount += log.symptoms.skin.acneCount ?? 1;
    if (log.symptoms.skin.dryness) current.drynessCount += 1;
    if (log.symptoms.skin.oiliness) current.oilinessCount += 1;
    if (log.symptoms.skin.hairLoss) current.hairLossCount += 1;
    current.total += 1;
    grouped.set(log.cycleDay, current);
  });

  const points = Array.from(grouped.values()).sort((a, b) => b.acneCount - a.acneCount || a.cycleDay - b.cycleDay);
  const hasHormonalPattern = points.some((point) => point.cycleDay >= state.cycle.averageLength - 3 && point.acneCount > 0);
  const hasDoctorPattern = points.some((point) => point.acneCount > 0 && point.hairLossCount > 0);

  return {
    points,
    totalMarks: skinLogs.length,
    hasEnoughData: skinLogs.length >= 3,
    hasHormonalPattern,
    hasDoctorPattern,
  };
};

export const selectRedFlags = (state: MiraState) => {
  const flags = new Set<string>();

  state.logs.dailyLogs.forEach((log: DailyLog) => {
    if (log.symptoms.bleeding.amount === 3 || log.symptoms.bleeding.pads >= 7) flags.add("Очень обильное кровотечение");
    if (log.symptoms.bleeding.clots === "large") flags.add("Крупные сгустки");
    if (log.symptoms.pain.level >= 4) flags.add("Сильная боль");
    if (log.symptoms.pain.type === "sharp" || log.symptoms.pain.type === "cutting") flags.add("Острая или режущая боль");
    if (log.symptoms.pain.affectedLife === "bedridden") flags.add("Боль мешает встать с кровати");
    if (log.symptoms.energy === "exhausted") flags.add("Сильная слабость");
  });

  if (state.cycle.currentDay > state.cycle.averageLength + 7) flags.add("Задержка больше обычного");

  return Array.from(flags);
};
