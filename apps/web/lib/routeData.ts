import type { TodayData } from "@/components/screens/TodayPage";
import type { CareState, CyclePhase, CycleState, DailyLog } from "@/store";

export type RouteCareData = {
  date: string;
  cycleDay: number;
  calories: {
    current: number;
    target: number;
  };
  nutrients: {
    protein: number;
    fats: number;
    carbs: number;
  };
  water: {
    current: number;
    target: number;
  };
  activity: {
    walking: "почти нет" | "немного" | "нормально" | "много";
    workout: "нет" | "лёгкая" | "средняя" | "тяжёлая";
  };
  weight?: number;
};

const phaseLabels: Record<CyclePhase, string> = {
  menstrual: "Менструальная",
  follicular: "Фолликулярная",
  ovulatory: "Овуляторная",
  luteal: "Лютеиновая",
};

function formatTodayDate(date = new Date()) {
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function buildMonthCalendar(today = new Date(), todayLog?: DailyLog): TodayData["calendar"] {
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const days: TodayData["calendar"]["days"] = [
    ...Array.from({ length: mondayOffset }, () => ({ date: null, type: "empty" as const })),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const date = index + 1;
      if (todayLog && date === today.getDate()) return { date, type: "note" as const };
      return { date, type: "normal" as const };
    }),
  ];

  while (days.length < 42) days.push({ date: null, type: "empty" });

  return {
    month: today.toLocaleDateString("ru-RU", { month: "long", year: "numeric" }),
    days,
    note: todayLog?.symptoms.note ? `${formatTodayDate(today)}: "${todayLog.symptoms.note}"` : undefined,
  };
}

export function buildTodayDataFromStore(cycle: CycleState, logs: DailyLog[]): TodayData {
  const today = new Date();
  const log = logs.find((item) => item.date === todayKey(today));
  const cycleDay = log?.cycleDay ?? cycle.currentDay;
  const daysUntilPeriod = cycleDay > cycle.averageLength ? cycle.averageLength - cycleDay : cycle.daysUntilPeriod;
  const symptoms: TodayData["symptoms"] = [];

  if ((log?.symptoms.pain.level ?? 0) > 0) {
    symptoms.push({
      type: "pain",
      label: `Боль ${log?.symptoms.pain.level}/5`,
      color: (log?.symptoms.pain.level ?? 0) >= 4 ? "red" : "yellow",
    });
  }
  if (log?.symptoms.energy && ["low", "exhausted"].includes(log.symptoms.energy)) {
    symptoms.push({ type: "energy", label: "Низкая энергия", color: "blue" });
  }
  if (log?.symptoms.mood && ["anxious", "irritable", "low"].includes(log.symptoms.mood)) {
    symptoms.push({ type: "mood", label: "Настроение требует внимания", color: "yellow" });
  }

  return {
    date: formatTodayDate(today),
    cycleDay,
    phase: phaseLabels[cycle.phase],
    daysUntilPeriod,
    symptoms,
    advice: symptoms.length > 0
      ? "Сохрани факты через «Отслеживать», чтобы Mira увидела повторения."
      : "Сегодня можно коротко отметить состояние, если есть что добавить.",
    recommendations: symptoms.length > 0
      ? ["Отметить симптомы", "Сохранить факт", "При сильных симптомах открыть «Мне плохо»"]
      : ["Отметить месячные", "Добавить симптом", "Открыть отчёт врачу"],
    calendar: buildMonthCalendar(today, log),
  };
}

function mapWalking(value: CareState["activity"]["walking"]): RouteCareData["activity"]["walking"] {
  if (value === "little") return "немного";
  if (value === "normal") return "нормально";
  if (value === "much") return "много";
  return "почти нет";
}

function mapWorkout(value: CareState["activity"]["workout"]): RouteCareData["activity"]["workout"] {
  if (value === "light") return "лёгкая";
  if (value === "medium") return "средняя";
  if (value === "heavy") return "тяжёлая";
  return "нет";
}

export function buildCareDataFromStore(cycle: CycleState, care: CareState, logs: DailyLog[]): RouteCareData {
  const today = todayKey();
  const log = logs.find((item) => item.date === today);

  return {
    date: formatTodayDate(),
    cycleDay: log?.cycleDay ?? cycle.currentDay,
    calories: {
      current: log?.selfCare.calories ?? 0,
      target: 2150,
    },
    nutrients: {
      protein: log?.selfCare.protein ?? 0,
      fats: log?.selfCare.fats ?? 0,
      carbs: log?.selfCare.carbs ?? 0,
    },
    water: {
      current: care.water.current,
      target: care.water.target,
    },
    activity: {
      walking: mapWalking(care.activity.walking),
      workout: mapWorkout(care.activity.workout),
    },
    weight: care.weight.current ?? undefined,
  };
}
