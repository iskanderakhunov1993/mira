import type { MiraLocalData, LabResult } from "./types";
import { getCycleNorm } from "./cycleEngine";
import { getHealthSummary } from "./healthScore";

/* ──────────────────────────────────────────────
   Анализы — рекомендации и референсные диапазоны.

   ВАЖНО (см. AGENTS.md): это НЕ диагноз и НЕ назначение.
   Любая эскалация формулируется как «обсудите с врачом».
   Референсы — общие для взрослых женщин; реальные диапазоны
   отличаются между лабораториями — ориентир на бланк лаборатории.
   ────────────────────────────────────────────── */

export type LabStatus = "low" | "ok" | "borderline" | "high";

export type LabRange = {
  id: string;
  name: string;
  unit: string;
  low: number;   // нижняя граница референса
  high: number;  // верхняя граница референса
  group: string;
  aboutLow?: string;
  aboutHigh?: string;
};

// Каталог самых релевантных для женского цикла показателей.
export const labCatalog: LabRange[] = [
  { id: "ferritin", name: "Ферритин", unit: "нг/мл", low: 15, high: 150, group: "Железо",
    aboutLow: "Низкий ферритин часто связан с дефицитом железа (запасы истощены).",
    aboutHigh: "Высокий ферритин бывает при воспалении — значение нужно смотреть в контексте." },
  { id: "hemoglobin", name: "Гемоглобин", unit: "г/л", low: 120, high: 150, group: "Кровь",
    aboutLow: "Низкий гемоглобин может говорить об анемии." },
  { id: "iron", name: "Железо сыворотки", unit: "мкмоль/л", low: 6.6, high: 26, group: "Железо" },
  { id: "tsh", name: "ТТГ", unit: "мЕд/л", low: 0.4, high: 4.0, group: "Щитовидная железа",
    aboutLow: "Низкий ТТГ — повод обсудить функцию щитовидной железы.",
    aboutHigh: "Высокий ТТГ — повод обсудить функцию щитовидной железы." },
  { id: "prolactin", name: "Пролактин", unit: "нг/мл", low: 4.8, high: 23.3, group: "Гормоны",
    aboutHigh: "Повышенный пролактин иногда влияет на регулярность цикла." },
  { id: "estradiol", name: "Эстрадиол", unit: "пг/мл", low: 20, high: 350, group: "Гормоны 45+",
    aboutLow: "Эстрадиол сильно зависит от дня цикла и возраста; один результат не подтверждает менопаузу.",
    aboutHigh: "Эстрадиол сильно колеблется по циклу; значение стоит обсуждать вместе с симптомами и днём цикла." },
  { id: "progesterone", name: "Прогестерон", unit: "нг/мл", low: 1.8, high: 24, group: "Гормоны 45+",
    aboutLow: "Прогестерон информативнее примерно за 7 дней до ожидаемых месячных; день сдачи важен.",
    aboutHigh: "Прогестерон оценивают с учётом дня цикла, овуляции, лекарств и беременности." },
  { id: "vitaminD", name: "Витамин D (25-OH)", unit: "нг/мл", low: 30, high: 100, group: "Витамины",
    aboutLow: "Низкий витамин D очень распространён; обсудите коррекцию с врачом." },
  { id: "b12", name: "Витамин B12", unit: "пг/мл", low: 200, high: 900, group: "Витамины",
    aboutLow: "Низкий B12 может влиять на энергию и самочувствие." },
  { id: "glucose", name: "Глюкоза натощак", unit: "ммоль/л", low: 3.9, high: 5.5, group: "Обмен веществ",
    aboutHigh: "Повышенная глюкоза натощак — повод обсудить с врачом." },
];

export function getLabRange(id: string): LabRange | undefined {
  return labCatalog.find((l) => l.id === id);
}

export const labStatusMeta: Record<LabStatus, { color: string; bg: string; label: string }> = {
  ok:         { color: "#5BAE7E", bg: "#E8F5EC", label: "В референсе" },
  borderline: { color: "#C99A3E", bg: "#F8F0DC", label: "У границы" },
  low:        { color: "#C9607E", bg: "#F8E0E8", label: "Ниже референса" },
  high:       { color: "#C9607E", bg: "#F8E0E8", label: "Выше референса" },
};

export type LabEvaluation = {
  status: LabStatus;
  label: string;
  message: string; // что это значит — без диагноза, с «обсудите с врачом»
};

// Оценка одного значения относительно референса.
export function evaluateLab(testId: string, value: number): LabEvaluation | null {
  const r = getLabRange(testId);
  if (!r) return null;

  const margin = (r.high - r.low) * 0.05; // 5% от ширины диапазона = «у границы»
  let status: LabStatus;
  if (value < r.low) status = "low";
  else if (value > r.high) status = "high";
  else if (value <= r.low + margin || value >= r.high - margin) status = "borderline";
  else status = "ok";

  let message: string;
  if (status === "low") message = `${r.aboutLow ?? "Значение ниже референсного диапазона."} Обсудите с врачом.`;
  else if (status === "high") message = `${r.aboutHigh ?? "Значение выше референсного диапазона."} Обсудите с врачом.`;
  else if (status === "borderline") message = "Значение у границы референса — стоит понаблюдать и при желании обсудить с врачом.";
  else message = "Значение в пределах референса.";

  return { status, label: labStatusMeta[status].label, message };
}

export type LabRecommendation = {
  id: string;
  title: string;       // «Обсудить проверку железа»
  why: string;         // почему — на основе данных
  testIds: string[];   // какие показатели обсудить (пусто = не лаб., а консультация)
  action?: string;     // если не анализ, а действие («консультация гинеколога»)
};

export function getHormoneCheckup45(data: MiraLocalData): {
  show: boolean;
  progesteroneDay: number;
  title: string;
  body: string;
  doctorQuestions: string[];
} {
  const profile = data.profile;
  const age = profile?.age;
  const cycleLength = profile?.cycleConfig.cycleLength ?? 28;
  const progesteroneDay = Math.max(1, cycleLength - 7);
  const checkIns = Object.values(data.checkIns);
  const hasPeriSignals = checkIns.some((checkIn) =>
    checkIn.sleep?.quality === "insomnia" ||
    checkIn.mood?.value === "swings" ||
    checkIn.energy?.value === "exhausted" ||
    checkIn.period?.intensity === "very_heavy"
  );
  const show = Boolean(age && age >= 45) || hasPeriSignals;

  return {
    show,
    progesteroneDay,
    title: "Чекап 45+ / перименопауза",
    body: "После 45 цикл может меняться: задержки, обильность, приливы, потливость, бессонница и перепады настроения. Mira не назначает анализы, но помогает подготовить вопросы врачу.",
    doctorQuestions: [
      "Нужны ли мне гормональные анализы или достаточно оценки симптомов?",
      `Если врач назначит прогестерон, подойдёт ли примерно ${progesteroneDay}-й день моего цикла?`,
      "Есть ли смысл проверить эстрадиол, ТТГ, ферритин, гемоглобин и витамин D?",
      "Какие симптомы после 45 нельзя списывать только на перименопаузу?",
    ],
  };
}

/*
 * Часть 1 — какие анализы/обследования стоит ОБСУДИТЬ с врачом,
 * исходя из повторений в логах. Это рекомендация, не назначение.
 */
export function getLabRecommendations(data: MiraLocalData): LabRecommendation[] {
  const recs: LabRecommendation[] = [];
  const checkIns = Object.values(data.checkIns);
  const profile = data.profile;
  const norm = getCycleNorm(profile);
  const health = getHealthSummary(data);

  // Обильные/длинные месячные → риск дефицита железа.
  const heavyDays = checkIns.filter(
    (c) => c.period && (c.period.intensity === "heavy" || c.period.intensity === "very_heavy")
  ).length;
  const longPeriod = (profile?.cycleConfig.periodLength ?? 0) > 7;
  if (heavyDays >= 2 || longPeriod) {
    recs.push({
      id: "iron-anemia",
      title: "Обсудить проверку железа",
      why: longPeriod
        ? "Месячные длятся дольше 7 дней — при обильной кровопотере иногда снижается железо."
        : "Несколько дней с обильными месячными — при обильной кровопотере иногда снижается железо.",
      testIds: ["ferritin", "hemoglobin"],
    });
  }

  // Нерегулярный цикл → щитовидка / пролактин.
  if (norm.observedCycles >= 2 && !norm.isRegular) {
    recs.push({
      id: "irregular-cycle",
      title: "Обсудить причины нерегулярного цикла",
      why: `Разброс длины цикла ${norm.minLength}–${norm.maxLength} дней. На регулярность влияют разные факторы, в т.ч. гормональные.`,
      testIds: ["tsh", "prolactin"],
    });
  }

  // Хроническая низкая энергия → железо / витамин D / щитовидка.
  const energy = health.metrics.find((m) => m.id === "energy");
  if (energy && (energy.status === "watch" || energy.status === "concern")) {
    recs.push({
      id: "low-energy",
      title: "Обсудить причины низкой энергии",
      why: "Энергия часто снижена. Иногда за этим стоят дефициты или функция щитовидной железы.",
      testIds: ["ferritin", "vitaminD", "tsh", "b12"],
    });
  }

  // Частая сильная боль → консультация (не анализ).
  const strongPain = checkIns.filter((c) => c.pain?.level === "strong").length;
  if (strongPain >= 2) {
    recs.push({
      id: "strong-pain",
      title: "Обсудить сильную боль с гинекологом",
      why: `Сильная боль отмечена ${strongPain} раз. Регулярную сильную боль стоит обсудить с врачом.`,
      testIds: [],
      action: "Консультация гинеколога (возможно УЗИ)",
    });
  }

  const checkup45 = getHormoneCheckup45(data);
  if (checkup45.show) {
    recs.push({
      id: "hormone-checkup-45",
      title: "Чекап 45+: обсудить гормоны и дефициты",
      why: `Если врач назначит прогестерон, для цикла ${profile?.cycleConfig.cycleLength ?? 28} дн. ориентир — около ${checkup45.progesteroneDay}-го дня, а не строго 21-й для всех.`,
      testIds: ["estradiol", "progesterone", "tsh", "ferritin", "hemoglobin", "vitaminD"],
    });
  }

  return recs;
}

// Хелперы для CRUD результатов (часть 2).
export function addLabResult(data: MiraLocalData, result: Omit<LabResult, "id">): MiraLocalData {
  const entry: LabResult = { ...result, id: `lab-${Date.now()}` };
  return { ...data, labs: [entry, ...(data.labs ?? [])] };
}

export function removeLabResult(data: MiraLocalData, id: string): MiraLocalData {
  return { ...data, labs: (data.labs ?? []).filter((l) => l.id !== id) };
}
