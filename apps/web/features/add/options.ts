import { Activity, Bed, Droplets, HeartPulse, Moon, Smile, Sparkles, Stethoscope, Zap } from "lucide-react";
import type { AddAction, EnergyValue, MoodValue, PeriodAction, SleepQuality, WaterAmount, WellbeingValue } from "./types";

export const addActions: Array<{ id: AddAction; label: string; icon: typeof HeartPulse }> = [
  { id: "period", label: "Месячные", icon: HeartPulse },
  { id: "wellbeing", label: "Самочувствие", icon: Smile },
  { id: "water", label: "Вода", icon: Droplets },
  { id: "energy", label: "Энергия", icon: Zap },
  { id: "sleep", label: "Сон", icon: Bed },
  { id: "pain", label: "Боль", icon: Stethoscope },
  { id: "mood", label: "Настроение", icon: Moon },
  { id: "symptom", label: "Симптом", icon: Activity },
  { id: "other", label: "Другое", icon: Sparkles },
];

export const periodOptions: Array<{ id: PeriodAction; label: string }> = [
  { id: "started", label: "Начались сегодня" },
  { id: "continued", label: "Продолжаются" },
  { id: "ended", label: "Закончились" },
  { id: "spotting", label: "Мазня" },
  { id: "unusual_bleeding", label: "Необычное кровотечение" },
];

export const wellbeingOptions: Array<{ id: WellbeingValue; label: string }> = [
  { id: "good", label: "Хорошо" },
  { id: "normal", label: "Обычно" },
  { id: "not_great", label: "Не очень" },
  { id: "hard", label: "Тяжело" },
];

export const waterOptions: Array<{ id: WaterAmount; label: string }> = [
  { id: 250, label: "+250 мл" },
  { id: 500, label: "+500 мл" },
  { id: 750, label: "+750 мл" },
  { id: "custom", label: "Свой объём" },
];

export const energyOptions: Array<{ id: EnergyValue; label: string }> = [
  { id: "low", label: "Низкая" },
  { id: "normal", label: "Обычная" },
  { id: "high", label: "Высокая" },
];

export const sleepOptions: Array<{ id: SleepQuality; label: string }> = [
  { id: "good", label: "Хорошо" },
  { id: "normal", label: "Обычно" },
  { id: "poor", label: "Плохо" },
];

export const moodOptions: Array<{ id: MoodValue; label: string }> = [
  { id: "calm", label: "Спокойно" },
  { id: "good", label: "Хорошо" },
  { id: "sensitive", label: "Чувствительно" },
  { id: "irritated", label: "Раздражённо" },
  { id: "anxious", label: "Тревожно" },
  { id: "sad", label: "Грустно" },
  { id: "angry", label: "Зло" },
];

export const symptomOptions = ["головная боль", "тошнота", "вздутие", "акне", "усталость", "тяга к сладкому", "другое"];

export const contextOptions = ["стресс", "болезнь", "поездка", "алкоголь", "интенсивная тренировка", "новый препарат", "изменение контрацепции"];
