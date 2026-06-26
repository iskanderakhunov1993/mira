import type { MiraLocalData } from "./types";
import { getCycleNorm } from "./cycleEngine";

/* ──────────────────────────────────────────────
   Health Score — «светофор», а не таблица.
   Каждая метрика → статус (ok/watch/concern) + вердикт
   словами + значение. Пользователь смотрит на цвет и
   сразу понимает, всё ли в порядке.
   ────────────────────────────────────────────── */

export type MetricStatus = "ok" | "watch" | "concern" | "nodata";

export type HealthMetric = {
  id: string;
  emoji: string;
  label: string;
  status: MetricStatus;
  verdict: string;        // одно-два слова: «В норме», «Следи», «К врачу»
  detail: string;         // одна фраза-объяснение
  value: string;          // короткое значение для показа (напр. «28 дн.»)
  spark: number[];        // данные для мини-графика (0..100), последние точки
};

export type HealthSummary = {
  overall: MetricStatus;
  headline: string;       // «Всё в норме» / «Обрати внимание на сон»
  subtext: string;
  metrics: HealthMetric[];
};

export const statusMeta: Record<MetricStatus, { color: string; ring: string; bg: string; label: string }> = {
  ok:      { color: "#5BAE7E", ring: "#7BC99A", bg: "#E8F5EC", label: "В норме" },
  watch:   { color: "#C99A3E", ring: "#E0C060", bg: "#F8F0DC", label: "Следи" },
  concern: { color: "#C9607E", ring: "#E08AA0", bg: "#F8E0E8", label: "К врачу" },
  nodata:  { color: "#9B95A8", ring: "#C8C2D4", bg: "#F0EDF5", label: "Нет данных" },
};

const order: Record<MetricStatus, number> = { concern: 0, watch: 1, ok: 2, nodata: 3 };

// последние N значений по дням → спарклайн
function sparkFromCheckIns(
  data: MiraLocalData,
  scorer: (c: MiraLocalData["checkIns"][string] | undefined) => number | null,
  days = 14,
): number[] {
  const out: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const v = scorer(data.checkIns[key]);
    out.push(v ?? 0);
  }
  return out;
}

export function getHealthSummary(data: MiraLocalData): HealthSummary {
  const profile = data.profile;
  const checkIns = Object.values(data.checkIns);
  const norm = getCycleNorm(profile);
  const metrics: HealthMetric[] = [];

  // ── Цикл ──
  if (norm.observedCycles >= 2) {
    const status: MetricStatus = norm.isRegular
      ? "ok"
      : norm.spread > 9 ? "concern" : "watch";
    metrics.push({
      id: "cycle", emoji: "🔄", label: "Цикл",
      status,
      verdict: status === "ok" ? "Регулярный" : status === "watch" ? "Колеблется" : "Нерегулярный",
      detail: status === "ok"
        ? `Стабильно ${norm.cycleLength} дней`
        : `Разброс ${norm.minLength}–${norm.maxLength} дн.${status === "concern" ? " — стоит обсудить с врачом" : ""}`,
      value: `${norm.cycleLength} дн.`,
      spark: [],
    });
  } else {
    metrics.push({
      id: "cycle", emoji: "🔄", label: "Цикл", status: "nodata",
      verdict: "Изучаю", detail: "Нужно 2+ цикла для оценки", value: `~${norm.cycleLength} дн.`, spark: [],
    });
  }

  // ── Боль ──
  const painDays = checkIns.filter(c => c.pain && c.pain.kinds.some(k => k !== "none"));
  const strongPain = painDays.filter(c => c.pain?.level === "strong");
  if (painDays.length === 0 && checkIns.length < 5) {
    metrics.push({ id: "pain", emoji: "🌸", label: "Боль", status: "nodata", verdict: "Нет данных", detail: "Отмечай, чтобы видеть паттерн", value: "—", spark: [] });
  } else {
    const status: MetricStatus = strongPain.length >= 3 ? "concern" : strongPain.length >= 1 || painDays.length > checkIns.length * 0.3 ? "watch" : "ok";
    metrics.push({
      id: "pain", emoji: "🌸", label: "Боль",
      status,
      verdict: status === "ok" ? "В норме" : status === "watch" ? "Бывает" : "Частая",
      detail: status === "ok" ? "Боль редкая или лёгкая"
        : status === "watch" ? `Боль в ${painDays.length} днях`
        : `Сильная боль ${strongPain.length} раз — повод к врачу`,
      value: `${painDays.length} дн.`,
      spark: sparkFromCheckIns(data, c => c?.pain ? (c.pain.level === "strong" ? 90 : c.pain.level === "medium" ? 55 : 25) : 0),
    });
  }

  // ── Сон ──
  const sleepDays = checkIns.filter(c => c.sleep);
  if (sleepDays.length < 3) {
    metrics.push({ id: "sleep", emoji: "😴", label: "Сон", status: "nodata", verdict: "Нет данных", detail: "Отмечай сон несколько дней", value: "—", spark: [] });
  } else {
    const bad = sleepDays.filter(c => c.sleep!.quality === "bad" || c.sleep!.quality === "insomnia").length;
    const ratio = bad / sleepDays.length;
    const status: MetricStatus = ratio > 0.4 ? "concern" : ratio > 0.2 ? "watch" : "ok";
    const hours = sleepDays.filter(c => c.sleep?.hours).map(c => c.sleep!.hours!);
    const avg = hours.length ? (hours.reduce((a, b) => a + b, 0) / hours.length).toFixed(1) : "—";
    metrics.push({
      id: "sleep", emoji: "😴", label: "Сон",
      status,
      verdict: status === "ok" ? "Хороший" : status === "watch" ? "Так себе" : "Плохой",
      detail: status === "ok" ? "Сон в основном хороший" : `Плохой сон в ${Math.round(ratio * 100)}% дней`,
      value: avg !== "—" ? `${avg} ч` : `${sleepDays.length} дн.`,
      spark: sparkFromCheckIns(data, c => c?.sleep ? (c.sleep.quality === "good" ? 90 : c.sleep.quality === "normal" ? 60 : 25) : 0),
    });
  }

  // ── Энергия ──
  const energyDays = checkIns.filter(c => c.energy);
  if (energyDays.length < 3) {
    metrics.push({ id: "energy", emoji: "⚡", label: "Энергия", status: "nodata", verdict: "Нет данных", detail: "Отмечай энергию", value: "—", spark: [] });
  } else {
    const low = energyDays.filter(c => c.energy!.value === "low" || c.energy!.value === "exhausted").length;
    const ratio = low / energyDays.length;
    const status: MetricStatus = ratio > 0.5 ? "concern" : ratio > 0.3 ? "watch" : "ok";
    metrics.push({
      id: "energy", emoji: "⚡", label: "Энергия",
      status,
      verdict: status === "ok" ? "Хорошая" : status === "watch" ? "Снижена" : "Низкая",
      detail: status === "ok" ? "Энергии в основном хватает" : `Низкая энергия в ${Math.round(ratio * 100)}% дней${status === "concern" ? " — проверь железо" : ""}`,
      value: `${energyDays.length} дн.`,
      spark: sparkFromCheckIns(data, c => c?.energy ? (c.energy.value === "high" ? 90 : c.energy.value === "normal" ? 60 : c.energy.value === "low" ? 30 : 10) : 0),
    });
  }

  // ── Настроение ──
  const moodDays = checkIns.filter(c => c.mood);
  if (moodDays.length < 3) {
    metrics.push({ id: "mood", emoji: "🙂", label: "Настроение", status: "nodata", verdict: "Нет данных", detail: "Отмечай настроение", value: "—", spark: [] });
  } else {
    const negative = moodDays.filter(c => ["sadness", "anxiety", "anger"].includes(c.mood!.value)).length;
    const ratio = negative / moodDays.length;
    const status: MetricStatus = ratio > 0.5 ? "concern" : ratio > 0.3 ? "watch" : "ok";
    metrics.push({
      id: "mood", emoji: "🙂", label: "Настроение",
      status,
      verdict: status === "ok" ? "Стабильное" : status === "watch" ? "Колеблется" : "Тяжёлое",
      detail: status === "ok" ? "Настроение в основном ровное" : `Тревога/грусть в ${Math.round(ratio * 100)}% дней`,
      value: `${moodDays.length} дн.`,
      spark: sparkFromCheckIns(data, c => c?.mood ? (["joy", "normal"].includes(c.mood.value) ? 85 : c.mood.value === "swings" ? 45 : 20) : 0),
    });
  }

  // ── Overall ──
  const real = metrics.filter(m => m.status !== "nodata");
  const worst = real.length
    ? real.reduce((acc, m) => (order[m.status] < order[acc.status] ? m : acc))
    : null;

  let overall: MetricStatus = "nodata";
  let headline = "Начни отслеживать";
  let subtext = "Отмечай состояние — и я покажу, всё ли в норме";

  if (worst) {
    overall = worst.status;
    if (overall === "ok") {
      headline = "Всё в норме";
      subtext = "Твои показатели в пределах нормы. Так держать!";
    } else if (overall === "watch") {
      const watchers = real.filter(m => m.status === "watch").map(m => m.label.toLowerCase());
      headline = "Почти всё хорошо";
      subtext = `Обрати внимание на: ${watchers.join(", ")}`;
    } else {
      const concerns = real.filter(m => m.status === "concern").map(m => m.label.toLowerCase());
      headline = "Стоит обратить внимание";
      subtext = `${concerns.join(", ")} — возможно, стоит обсудить с врачом`;
    }
  }

  return { overall, headline, subtext, metrics };
}
