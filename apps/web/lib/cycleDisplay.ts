import { getCycleNorm, getPeriodForecast } from "./cycleEngine";
import { getCyclePhase, getPhaseLabel } from "./store";
import type { UserProfile } from "./types";

export function getCycleDisplay(profile: UserProfile | undefined) {
  const norm = getCycleNorm(profile);
  const periodLength = profile?.cycleConfig.periodLength ?? 5;
  const displayCycleDay = norm.isDelayed ? norm.cycleLength : norm.cycleDay;
  const phase = getCyclePhase(displayCycleDay, periodLength, norm.cycleLength);
  const forecast = getPeriodForecast(profile);

  return {
    norm,
    cycleDay: norm.cycleDay,
    cycleLength: norm.cycleLength,
    periodLength,
    displayCycleDay,
    phase,
    phaseLabel: getPhaseLabel(phase),
    isDelayed: norm.isDelayed,
    delayDays: norm.delayDays,
    daysUntilPeriod: norm.daysUntilPeriod,
    statusLabel: norm.isDelayed ? `Задержка ${norm.delayDays} дн.` : `${norm.cycleDay}-й день цикла`,
    shortStatus: norm.isDelayed ? `${norm.delayDays} дн. задержки` : `${norm.cycleDay} из ${norm.cycleLength}`,
    forecastText: forecast.text,
  };
}
