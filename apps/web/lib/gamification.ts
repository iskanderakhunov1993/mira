import type { MiraLocalData } from "./types";
import { dateKey } from "./store";
import { getCycleNorm } from "./cycleEngine";

/* ──────────────────────────────────────────────
   Геймификация «Сад здоровья» — мягкая, без вины.
   Не «не потеряй streak!», а «ты узнаёшь себя».
   ────────────────────────────────────────────── */

export type Streak = {
  current: number;       // дней подряд с отметкой
  longest: number;
  loggedToday: boolean;
  alive: boolean;        // серия ещё активна (отметилась вчера или сегодня)
  freezeUsed: boolean;   // использована ли «заморозка» (1 пропуск прощается)
};

export type GardenStage = {
  level: number;         // 0..6
  emoji: string;
  title: string;
  nextAt: number | null; // сколько всего дней до следующей стадии
  totalDays: number;
};

export type Achievement = {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  unlocked: boolean;
};

export type DailyRitual = {
  done: boolean;
  title: string;
  subtitle: string;
};

function loggedDates(data: MiraLocalData): Set<string> {
  return new Set(Object.keys(data.checkIns));
}

// ── Streak (мягкий, с 1 заморозкой) ──

export function getStreak(data: MiraLocalData): Streak {
  const dates = loggedDates(data);
  const todayK = dateKey();
  const yKey = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return dateKey(d); })();

  const loggedToday = dates.has(todayK);
  const loggedYesterday = dates.has(yKey);
  const alive = loggedToday || loggedYesterday;

  // считаем серию назад от сегодня; разрешаем ОДИН пропущенный день (заморозка)
  let current = 0;
  let freezeUsed = false;
  const cursor = new Date();
  // если сегодня ещё не отмечено — начинаем со вчера, не обнуляя
  if (!loggedToday) cursor.setDate(cursor.getDate() - 1);

  for (let i = 0; i < 400; i++) {
    const k = dateKey(cursor);
    if (dates.has(k)) {
      current++;
    } else {
      if (!freezeUsed && current > 0) {
        freezeUsed = true; // прощаем один пропуск
      } else {
        break;
      }
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  // longest — простой проход по всем датам
  const sorted = Array.from(dates).sort();
  let longest = 0, run = 0;
  let prev: Date | null = null;
  for (const d of sorted) {
    const cur = new Date(d);
    if (prev && Math.round((cur.getTime() - prev.getTime()) / 86_400_000) === 1) run++;
    else run = 1;
    longest = Math.max(longest, run);
    prev = cur;
  }

  return { current, longest: Math.max(longest, current), loggedToday, alive, freezeUsed };
}

// ── Сад (стадии роста по числу дней с данными) ──

const stages = [
  { at: 0, emoji: "🌰", title: "Семечко" },
  { at: 1, emoji: "🌱", title: "Росток" },
  { at: 3, emoji: "🌿", title: "Листочки" },
  { at: 7, emoji: "🌷", title: "Бутон" },
  { at: 14, emoji: "🌸", title: "Цветок" },
  { at: 30, emoji: "🌺", title: "Цветёт" },
  { at: 60, emoji: "🌻", title: "Сад здоровья" },
];

export function getGarden(data: MiraLocalData): GardenStage {
  const totalDays = Object.keys(data.checkIns).length;
  let level = 0;
  for (let i = 0; i < stages.length; i++) {
    if (totalDays >= stages[i].at) level = i;
  }
  const next = stages[level + 1] ?? null;
  return {
    level,
    emoji: stages[level].emoji,
    title: stages[level].title,
    nextAt: next ? next.at : null,
    totalDays,
  };
}

// ── Дневной ритуал ──

export function getDailyRitual(data: MiraLocalData): DailyRitual {
  const done = !!data.checkIns[dateKey()];
  return done
    ? { done: true, title: "Сегодня отмечено ✓", subtitle: "Спасибо, что заботишься о себе" }
    : { done: false, title: "Отметься за 10 секунд", subtitle: "Один тап — и сад подрастёт" };
}

// ── Достижения ──

export function getAchievements(data: MiraLocalData): Achievement[] {
  const total = Object.keys(data.checkIns).length;
  const streak = getStreak(data);
  const norm = getCycleNorm(data.profile);
  const checkIns = Object.values(data.checkIns);
  const hasPms = checkIns.some(c => c.pms && c.pms.symptoms.length > 0);

  return [
    { id: "first", emoji: "🌱", title: "Первый шаг", desc: "Первая отметка", unlocked: total >= 1 },
    { id: "week", emoji: "🌿", title: "Неделя с собой", desc: "7 дней данных", unlocked: total >= 7 },
    { id: "streak3", emoji: "🔥", title: "Три дня подряд", desc: "Серия 3 дня", unlocked: streak.longest >= 3 },
    { id: "cycle1", emoji: "🌸", title: "Первый цикл", desc: "Отмечен 1 цикл", unlocked: norm.observedCycles >= 1 },
    { id: "pms", emoji: "🧠", title: "Знаю симптомы перед месячными", desc: "Mira заметила повторение", unlocked: hasPms },
    { id: "norm", emoji: "🏆", title: "Знаю свою норму", desc: "3 цикла данных", unlocked: norm.observedCycles >= 3 },
    { id: "month", emoji: "💮", title: "Месяц заботы", desc: "30 дней данных", unlocked: total >= 30 },
  ];
}

export function getUnlockedCount(data: MiraLocalData): { unlocked: number; total: number } {
  const a = getAchievements(data);
  return { unlocked: a.filter(x => x.unlocked).length, total: a.length };
}
