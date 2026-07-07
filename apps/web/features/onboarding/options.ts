import type { TrackerPreference } from "../../types/health";
import type {
  CycleRegularity,
  InitialCheckIn,
  OnboardingFactor,
  OnboardingGoal,
  OnboardingOption,
  PeriodStartMode,
} from "./types";

export const onboardingCopy = {
  welcomeTitle: "Mira",
  welcomeSubtitle: "Понимай себя.",
  welcomeBody: "Понимай, что происходит с твоим телом — спокойно, без лишних слов и тревоги.",
};

export const goalOptions: OnboardingOption<OnboardingGoal>[] = [
  { id: "understand_cycle", label: "Понимать цикл" },
  { id: "prepare_period", label: "Подготовиться к месячным" },
  { id: "track_wellbeing", label: "Отслеживать самочувствие" },
  { id: "understand_symptoms", label: "Разобраться с симптомами" },
  { id: "try", label: "Просто попробовать" },
];

export const periodStartOptions: OnboardingOption<PeriodStartMode>[] = [
  { id: "date", label: "Указать дату первого дня" },
  { id: "unknown", label: "Не помню" },
  { id: "current", label: "Месячные сейчас" },
  { id: "irregular", label: "Нерегулярный цикл" },
];

export const regularityOptions: OnboardingOption<CycleRegularity>[] = [
  { id: "regular", label: "Обычно регулярный" },
  { id: "sometimes_changes", label: "Иногда меняется" },
  { id: "unpredictable", label: "Непредсказуемый" },
  { id: "unknown", label: "Не знаю" },
];

export const factorOptions: OnboardingOption<OnboardingFactor>[] = [
  { id: "hormonal_contraception", label: "Гормональная контрацепция" },
  { id: "changed_contraception", label: "Недавно изменила контрацепцию" },
  { id: "postpartum", label: "После родов" },
  { id: "no_period", label: "Нет месячных" },
  { id: "none", label: "Ничего из этого" },
  { id: "prefer_not", label: "Не хочу отвечать" },
];

export const defaultTrackers: TrackerPreference[] = ["cycle", "wellbeing", "mood", "energy", "water"];

export const optionalTrackerOptions: OnboardingOption<TrackerPreference>[] = [
  { id: "sleep", label: "Сон" },
  { id: "pain", label: "Боль" },
  { id: "symptoms", label: "Симптомы" },
  { id: "basal_temperature", label: "Базальная температура" },
  { id: "discharge", label: "Выделения" },
  { id: "activity", label: "Активность" },
  { id: "food", label: "Питание" },
  { id: "calories", label: "Калории" },
];

export const trackerLabels: Record<TrackerPreference, string> = {
  cycle: "Цикл",
  wellbeing: "Самочувствие",
  mood: "Настроение",
  energy: "Энергия",
  water: "Вода",
  sleep: "Сон",
  pain: "Боль",
  symptoms: "Симптомы",
  basal_temperature: "Базальная температура",
  discharge: "Выделения",
  activity: "Активность",
  food: "Питание",
  calories: "Калории",
};

export const checkInOptions: OnboardingOption<InitialCheckIn>[] = [
  { id: "good", label: "Хорошо" },
  { id: "normal", label: "Обычно" },
  { id: "not_great", label: "Не очень" },
  { id: "hard", label: "Тяжело" },
];
