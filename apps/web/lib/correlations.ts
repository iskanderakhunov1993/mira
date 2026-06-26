import type { MiraLocalData, DailyCheckIn } from "./types";
import { getCycleNorm } from "./cycleEngine";

/* ──────────────────────────────────────────────
   Связи «что на меня влияет» — из уже собираемых данных.
   Не диагноз, а наблюдение паттернов: «у тебя чаще».
   Каждая связь требует минимум данных, иначе молчим.
   ────────────────────────────────────────────── */

export type Correlation = {
  id: string;
  emoji: string;
  title: string;
  body: string;
  strength: "strong" | "emerging"; // насколько уверенно
};

const MS_DAY = 86_400_000;

function prevKey(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// ── Сон вчера → энергия сегодня ──
function sleepEnergyLink(data: MiraLocalData): Correlation | null {
  const checkIns = data.checkIns;
  let badSleepLowEnergy = 0, badSleepTotal = 0;
  for (const [date, c] of Object.entries(checkIns)) {
    const sleep = c.sleep;
    if (!sleep) continue;
    const poor = sleep.quality === "bad" || sleep.quality === "insomnia" || (sleep.hours !== undefined && sleep.hours < 6);
    if (!poor) continue;
    const next = checkIns[nextKey(date)];
    if (!next?.energy) continue;
    badSleepTotal++;
    if (next.energy.value === "low" || next.energy.value === "exhausted") badSleepLowEnergy++;
  }
  if (badSleepTotal < 3) return null;
  const ratio = badSleepLowEnergy / badSleepTotal;
  if (ratio < 0.5) return null;
  return {
    id: "sleep-energy", emoji: "😴", title: "Сон влияет на твою энергию",
    body: `Когда ты плохо спишь, на следующий день энергия падает в ${Math.round(ratio * 100)}% случаев. Это твой паттерн — береги сон.`,
    strength: ratio > 0.7 ? "strong" : "emerging",
  };
}

function nextKey(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

// ── Стресс → длина цикла ──
function stressCycleLink(data: MiraLocalData): Correlation | null {
  const profile = data.profile;
  const starts = (profile?.cycleConfig.periodStarts ?? []).slice().sort();
  if (starts.length < 3) return null;

  // для каждого завершённого цикла: была ли высокая стресс-отметка внутри
  const lengths: { len: number; stressed: boolean }[] = [];
  for (let i = 1; i < starts.length; i++) {
    const len = Math.round((new Date(starts[i]).getTime() - new Date(starts[i - 1]).getTime()) / MS_DAY);
    if (len < 15 || len > 60) continue;
    let stressed = false;
    for (const [date, c] of Object.entries(data.checkIns)) {
      if (date >= starts[i - 1] && date < starts[i] && (c.stress === "Высокий" || c.stress === "высокий")) {
        stressed = true; break;
      }
    }
    lengths.push({ len, stressed });
  }
  const stressedCycles = lengths.filter(l => l.stressed);
  const calmCycles = lengths.filter(l => !l.stressed);
  if (stressedCycles.length < 1 || calmCycles.length < 1) return null;

  const avg = (arr: { len: number }[]) => arr.reduce((s, x) => s + x.len, 0) / arr.length;
  const diff = Math.round(avg(stressedCycles) - avg(calmCycles));
  if (Math.abs(diff) < 2) return null;

  return {
    id: "stress-cycle", emoji: "🌀", title: "Стресс сдвигает твой цикл",
    body: diff > 0
      ? `В месяцы с высоким стрессом твой цикл длиннее примерно на ${diff} дн. Это нормальная реакция тела — не пугайся задержки.`
      : `В стрессовые месяцы цикл короче на ${Math.abs(diff)} дн. Тело реагирует на нагрузку.`,
    strength: stressedCycles.length >= 2 ? "strong" : "emerging",
  };
}

// ── Вода → вздутие/ПМС ──
function waterBloatLink(data: MiraLocalData): Correlation | null {
  const water = data.waterLog ?? {};
  let lowWaterBloat = 0, lowWaterTotal = 0;
  for (const [date, c] of Object.entries(data.checkIns)) {
    const hasBloat = c.pms?.symptoms.some(s => s.toLowerCase().includes("вздут"));
    const w = water[date];
    if (w === undefined) continue;
    if (w.glasses < 4) {
      lowWaterTotal++;
      if (hasBloat) lowWaterBloat++;
    }
  }
  if (lowWaterTotal < 3) return null;
  const ratio = lowWaterBloat / lowWaterTotal;
  if (ratio < 0.4) return null;
  return {
    id: "water-bloat", emoji: "💧", title: "Вода и вздутие связаны",
    body: `Когда пьёшь мало воды (<1 л), вздутие появляется чаще. Парадокс: больше воды — меньше задержка жидкости.`,
    strength: ratio > 0.6 ? "strong" : "emerging",
  };
}

// ── Прогноз ПМС (за сколько дней до месячных начинается) ──
function pmsForecast(data: MiraLocalData): Correlation | null {
  const profile = data.profile;
  if (!profile) return null;
  const norm = getCycleNorm(profile);
  if (norm.observedCycles < 1) return null;

  const cycleLength = norm.cycleLength;
  const start = new Date(norm.lastPeriodStart);
  const daysBefore: number[] = [];
  for (const [date, c] of Object.entries(data.checkIns)) {
    if (!c.pms || c.pms.symptoms.length === 0) continue;
    const diff = Math.floor((new Date(date).getTime() - start.getTime()) / MS_DAY);
    const cd = ((diff % cycleLength) + cycleLength) % cycleLength + 1;
    const before = cycleLength - cd;
    if (before >= 0 && before <= 14) daysBefore.push(before);
  }
  if (daysBefore.length < 3) return null;
  const avg = Math.round(daysBefore.reduce((a, b) => a + b, 0) / daysBefore.length);
  return {
    id: "pms-forecast", emoji: "🔮", title: `Твой ПМС начинается за ~${avg} дней`,
    body: `Симптомы ПМС у тебя появляются примерно за ${avg} дн. до месячных. Мы предупредим заранее, чтобы ты подготовилась.`,
    strength: daysBefore.length >= 6 ? "strong" : "emerging",
  };
}

export function getCorrelations(data: MiraLocalData): Correlation[] {
  return [
    pmsForecast(data),
    sleepEnergyLink(data),
    stressCycleLink(data),
    waterBloatLink(data),
  ].filter((c): c is Correlation => c !== null);
}
