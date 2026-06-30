import type { MiraLocalData, DailyCheckIn } from "./types";
import { getCycleNorm } from "./cycleEngine";

/* ──────────────────────────────────────────────
   Связи «что на меня влияет» — из уже собираемых данных.
   Не диагноз, а наблюдение повторений: «у тебя чаще».
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
    body: `Похоже, плохой сон часто совпадает с низкой энергией на следующий день. Mira заметила это в ${Math.round(ratio * 100)}% похожих отметок.`,
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

// ── Питание → энергия ──
// Сравниваем энергию в дни с белком/овощами на завтрак vs дни со сладким/фастфудом.
function foodEnergyLink(data: MiraLocalData): Correlation | null {
  const energyScore: Record<string, number> = { exhausted: 1, low: 2, normal: 3, high: 4 };
  let goodSum = 0, goodN = 0, poorSum = 0, poorN = 0;

  for (const c of Object.values(data.checkIns)) {
    if (!c.energy || !c.meals || c.meals.length === 0) continue;
    const comps = c.meals.flatMap(m => m.components);
    const hasProtein = comps.includes("protein") || comps.includes("vegetables");
    const hasJunk = comps.includes("sweets") || comps.includes("fastfood");
    const score = energyScore[c.energy.value];
    // «хороший» день: есть белок/овощи и нет джанка; «слабый»: есть джанк
    if (hasProtein && !hasJunk) { goodSum += score; goodN++; }
    else if (hasJunk) { poorSum += score; poorN++; }
  }
  if (goodN < 2 || poorN < 2) return null;
  const goodAvg = goodSum / goodN, poorAvg = poorSum / poorN;
  if (goodAvg - poorAvg < 0.4) return null;

  return {
    id: "food-energy", emoji: "🥗", title: "Еда влияет на твою энергию",
    body: "В дни с белком и овощами твоя энергия выше, чем в дни со сладким и фастфудом. Тело это чувствует.",
    strength: goodN + poorN >= 8 ? "strong" : "emerging",
  };
}

// ── Тренировки → самочувствие (сон/настроение на следующий день) ──
function workoutWellbeingLink(data: MiraLocalData): Correlation | null {
  const completed = data.workouts.filter(w => w.status === "completed");
  if (completed.length < 3) return null;

  let goodSleepAfter = 0, total = 0;
  for (const w of completed) {
    const next = data.checkIns[nextKey(w.date)];
    if (!next?.sleep) continue;
    total++;
    if (next.sleep.quality === "good" || next.sleep.quality === "normal") goodSleepAfter++;
  }
  if (total < 3) return null;
  const ratio = goodSleepAfter / total;
  if (ratio < 0.55) return null;

  return {
    id: "workout-sleep", emoji: "🏋️", title: "Тренировки улучшают твой сон",
    body: `После тренировки ты лучше спишь в ${Math.round(ratio * 100)}% случаев. Движение работает на тебя.`,
    strength: ratio > 0.75 ? "strong" : "emerging",
  };
}

export function getCorrelations(data: MiraLocalData): Correlation[] {
  return [
    pmsForecast(data),
    sleepEnergyLink(data),
    foodEnergyLink(data),
    workoutWellbeingLink(data),
    stressCycleLink(data),
    waterBloatLink(data),
  ].filter((c): c is Correlation => c !== null);
}
