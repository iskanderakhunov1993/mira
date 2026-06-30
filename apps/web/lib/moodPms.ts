import type { CyclePhase, DailyCheckIn } from "./types";

export type MoodPmsCard = {
  tone: "calm" | "sensitive" | "alert";
  label: string;
  title: string;
  body: string;
  pmsForecast: string;
  practice: {
    title: string;
    steps: string[];
  };
  journalPrompt: string;
  partnerTip: string;
  heavyWarning?: string;
};

const phaseForecast: Record<CyclePhase, string> = {
  menstruation: "Эмоции могут быть тише из-за боли, усталости или снижения энергии.",
  follicular: "Обычно настроение становится стабильнее, а энергии постепенно больше.",
  ovulation: "Часто больше уверенности и желания общаться, но чувствительность тоже возможна.",
  luteal: "Перед месячными чаще появляются раздражительность, тревога, плаксивость или тяга к сладкому.",
};

export function getMoodPmsCard(phase: CyclePhase, daysUntilPeriod: number, checkIn?: DailyCheckIn): MoodPmsCard {
  const mood = checkIn?.mood?.value;
  const hasPms = Boolean(checkIn?.pms?.symptoms.length);
  const hasAnxiety = mood === "anxiety" || checkIn?.symptomLog?.anxiety;
  const hasIrritation = mood === "anger" || checkIn?.pms?.symptoms.some(symptom => symptom.toLowerCase().includes("разд"));
  const hasCrying = mood === "sadness" || checkIn?.pms?.symptoms.some(symptom => symptom.toLowerCase().includes("плач"));
  const isPmsWindow = phase === "luteal" || daysUntilPeriod <= 7 || hasPms;

  if (hasAnxiety || hasIrritation || hasCrying || hasPms) {
    const title = hasAnxiety
      ? "Тревога может быть связана с циклом"
      : hasIrritation
        ? "Раздражительность не делает тебя плохой"
        : hasCrying
          ? "Плаксивость не значит, что с тобой что-то не так"
          : "ПМС-сигналы стоит заметить мягко";

    return {
      tone: "sensitive",
      label: "ПМС рядом",
      title,
      body: "Это не отменяет реальные причины эмоций, но цикл может усиливать реакцию. Сегодня лучше снизить нагрузку и не принимать резких решений.",
      pmsForecast: isPmsWindow
        ? `До месячных примерно ${Math.max(0, daysUntilPeriod)} дн. — эмоциональная чувствительность может быть выше.`
        : phaseForecast[phase],
      practice: {
        title: "Дыхание 4–6",
        steps: ["Вдох 4 секунды", "Выдох 6 секунд", "Повтори 5 раз"],
      },
      journalPrompt: "Что я чувствую, что стало триггером и какая одна мягкая просьба ко мне сейчас?",
      partnerTip: "Скажи коротко: «Я сейчас чувствительнее обычного. Мне важны спокойный тон и немного времени».",
      heavyWarning: hasAnxiety && checkIn?.energy?.value === "exhausted"
        ? "Если тревога, плаксивость или ощущение безысходности сильные и мешают жить — лучше обратиться за поддержкой к специалисту."
        : undefined,
    };
  }

  if (isPmsWindow) {
    return {
      tone: "sensitive",
      label: "Возможные симптомы перед месячными",
      title: "Возможна повышенная чувствительность",
      body: "Это не значит, что с тобой что-то не так. Полезно оставить больше воздуха в календаре и быть мягче к себе.",
      pmsForecast: `До месячных примерно ${Math.max(0, daysUntilPeriod)} дн. — отслеживай настроение, сон и тягу к сладкому.`,
      practice: {
        title: "Пауза перед реакцией",
        steps: ["Назови эмоцию", "Сделай 3 медленных выдоха", "Ответь через 10 минут"],
      },
      journalPrompt: "Какая эмоция сильнее всего сегодня и чего она пытается попросить?",
      partnerTip: "Предупреди заранее: «Сегодня я могу быть резче. Давай сложные темы обсудим спокойнее или позже».",
    };
  }

  return {
    tone: "calm",
    label: "Настроение",
    title: "Эмоциональный фон выглядит спокойнее",
    body: "Хороший день, чтобы заметить, что поддерживает тебя: сон, движение, еда, люди или тишина.",
    pmsForecast: phaseForecast[phase],
    practice: {
      title: "Мини-чек-ин",
      steps: ["Что я чувствую?", "Где это в теле?", "Что поможет на 5%?"],
    },
    journalPrompt: "Что сегодня поддержало моё настроение и энергию?",
    partnerTip: "Можно сказать: «Сегодня я в ресурсе, давай обсудим важное, пока есть энергия».",
  };
}
