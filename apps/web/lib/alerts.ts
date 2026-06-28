import type { MiraLocalData, CyclePhase, DailyCheckIn, BadSymptom } from "./types";
import { getCycleDay, getCyclePhase, getPhaseLabel, getDaysUntilPeriod, dateKey } from "./store";

// ── #1 Smart Reminders ──

export type SmartReminder = {
  type: "prepare" | "restock" | "period_start" | "delay" | "clothing" | "firstaid";
  title: string;
  body: string;
  items?: string[];
};

export function getSmartReminders(data: MiraLocalData): SmartReminder[] {
  const profile = data.profile;
  if (!profile) return [];

  const daysUntil = getDaysUntilPeriod(profile);
  const cycleDay = getCycleDay(profile);
  const cycleLength = profile.cycleConfig.cycleLength;
  const reminders: SmartReminder[] = [];

  if (daysUntil >= 2 && daysUntil <= 4) {
    reminders.push({
      type: "prepare",
      title: `Месячные через ${daysUntil} дня`,
      body: "Проверь, всё ли есть дома и в сумке",
      items: [
        "Прокладки / тампоны / менструальная чаша",
        "Средство от боли, если оно тебе подходит",
        "Грелка",
        "Перекус и вода на работу/учёбу",
      ],
    });

    reminders.push({
      type: "clothing",
      title: "👗 Одежда на ближайшие дни",
      body: "Пока месячные не начались — подготовь удобную одежду",
      items: [
        "Тёмное нижнее бельё (не новое, не светлое)",
        "Удобные штаны/юбка — без давления на живот",
        "Запасное бельё в сумку — на всякий случай",
        "Если на работу/учёбу — тёмный низ безопаснее",
      ],
    });

    reminders.push({
      type: "firstaid",
      title: "💊 Мини-аптечка в сумку",
      body: "Собери на случай если начнётся вне дома",
      items: [
        "2-3 прокладки/тампона в косметичку",
        "Средство от боли, если оно тебе подходит и уже согласовано",
        "Влажные салфетки",
        "Маленькая бутылка воды",
        "Пакетик для использованных средств",
      ],
    });
  }

  if (daysUntil === 1) {
    reminders.push({
      type: "period_start",
      title: "Месячные ожидаются завтра",
      body: "Положи средства гигиены в сумку. Надень тёмное бельё на ночь.",
    });
  }

  if (cycleDay > cycleLength + 3) {
    reminders.push({
      type: "delay",
      title: `Задержка ${cycleDay - cycleLength} дней`,
      body: `Цикл обычно длится ${cycleLength} дней. Сейчас ${cycleDay}-й день. Это может быть вариантом нормы, но если задержка продолжится — стоит обратить внимание.`,
    });
  }

  return reminders;
}

export type SexCycleInsight = {
  tone: "neutral" | "watch" | "alert";
  title: string;
  body: string;
  riskLabel: string;
  nextStep: string;
};

function getCycleDayForCheckIn(checkIn: DailyCheckIn, profile: MiraLocalData["profile"]): number {
  const start = new Date(profile!.cycleConfig.periodStart);
  const date = new Date(checkIn.date);
  const diff = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return ((diff % profile!.cycleConfig.cycleLength) + profile!.cycleConfig.cycleLength) % profile!.cycleConfig.cycleLength + 1;
}

function getFertileWindow(profile: NonNullable<MiraLocalData["profile"]>) {
  const { cycleLength, periodLength } = profile.cycleConfig;
  const ovulationDay = Math.max(periodLength + 2, Math.round(cycleLength - 14));
  return {
    start: Math.max(periodLength + 1, ovulationDay - 5),
    end: Math.min(cycleLength, ovulationDay + 1),
  };
}

export function getSexCycleInsight(data: MiraLocalData): SexCycleInsight | null {
  const profile = data.profile;
  if (!profile) return null;

  const intimacyEntries = Object.values(data.checkIns)
    .filter((checkIn) => checkIn.intimacy?.happened)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (intimacyEntries.length === 0) return null;

  const latest = intimacyEntries[0];
  const intimacy = latest.intimacy!;
  const cycleDay = getCycleDayForCheckIn(latest, profile);
  const window = getFertileWindow(profile);
  const inFertileWindow = cycleDay >= window.start && cycleDay <= window.end;
  const daysSinceSex = Math.max(0, Math.floor((new Date(dateKey()).getTime() - new Date(latest.date).getTime()) / 86_400_000));
  const delayDays = getCycleDay(profile) - profile.cycleConfig.cycleLength;

  const hadUnprotectedRisk = intimacy.protection === "unprotected" || intimacy.protection === "interrupted";
  const hasPain = intimacy.feeling === "pain" || intimacy.feeling === "discomfort";
  const hasBleeding = intimacy.bleedingAfter === true;

  if (hasBleeding || hasPain) {
    return {
      tone: hasBleeding ? "alert" : "watch",
      title: hasBleeding ? "После секса была кровь" : "После секса был дискомфорт",
      body: hasBleeding
        ? "Если кровь после секса повторяется, сопровождается болью или её больше, чем пару следов, лучше обсудить это с врачом."
        : "Если боль или дискомфорт повторяются, это не стоит терпеть молча — лучше обсудить это с врачом.",
      riskLabel: hadUnprotectedRisk ? (inFertileWindow ? "Риск беременности выше" : "Риск беременности есть") : "Риск беременности ниже",
      nextStep: hasBleeding ? "Следи, повторяется ли кровь после секса." : "Отметь, был ли дискомфорт снова в следующий раз.",
    };
  }

  if (hadUnprotectedRisk) {
    const riskLabel = inFertileWindow ? "Высокий риск беременности" : "Риск беременности есть";
    const nextStep = delayDays >= 1 || daysSinceSex >= 14
      ? "Если месячные не пришли, тест уже уместен."
      : daysSinceSex >= 10
        ? "Тест обычно информативнее через 10-14 дней после секса."
        : "Поставь себе напоминание о тесте через несколько дней.";
    return {
      tone: inFertileWindow ? "alert" : "watch",
      title: intimacy.protection === "interrupted" ? "Был прерванный половой акт" : "Был незащищённый секс",
      body: inFertileWindow
        ? "Это совпало с окном, где вероятность беременности выше. Mira не ставит диагноз, но лучше заранее понимать следующий шаг."
        : "Беременность возможна даже вне предполагаемой овуляции, поэтому лучше ориентироваться на дату секса и задержку.",
      riskLabel,
      nextStep,
    };
  }

  return {
    tone: "neutral",
    title: "Секс отмечен",
    body: "Если после секса появятся боль, кровь или задержка, Mira подскажет, что отслеживать дальше.",
    riskLabel: "Защита отмечена",
    nextStep: "Если цикл задержится, ориентируйся на дату последнего секса и тест.",
  };
}

// ── #2 Red Flags ──

export type RedFlag = {
  severity: "warning" | "alert";
  title: string;
  body: string;
  action: string;
};

export function getRedFlags(data: MiraLocalData): RedFlag[] {
  const profile = data.profile;
  if (!profile) return [];

  const checkIns = Object.values(data.checkIns);

  const flags: RedFlag[] = [];
  const cycleLength = profile.cycleConfig.cycleLength;
  const periodLength = profile.cycleConfig.periodLength;
  const currentDelayDays = Math.max(0, getCycleDay(profile) - cycleLength);
  const badEpisodes = checkIns.flatMap(c => c.badEpisodes ?? []);
  const countBadSymptom = (symptom: BadSymptom) => badEpisodes.filter(episode => episode.symptoms.includes(symptom)).length;
  const intimacyPain = checkIns.filter(c => c.intimacy?.feeling === "pain" || c.intimacy?.feeling === "discomfort");
  const intimacyBleeding = checkIns.filter(c => c.intimacy?.bleedingAfter);
  const delayChecks = checkIns.flatMap(c => c.delayChecks ?? []);
  const exhaustedDays = checkIns.filter(c => c.energy?.value === "exhausted");

  function pushUnique(flag: RedFlag) {
    if (!flags.some(existing => existing.title === flag.title)) flags.push(flag);
  }

  // Strong pain 3+ cycles
  const strongPainDays = checkIns.filter(c => c.pain?.level === "strong");
  if (strongPainDays.length >= 2 || countBadSymptom("sharp_pain") > 0) {
    const impactDays = strongPainDays.length;
    pushUnique({
      severity: "alert",
      title: impactDays >= 2 ? `Сильная боль повторяется (${impactDays} дней)` : "Резкая боль отмечена",
      body: impactDays >= 2
        ? "Симптом повторяется. Лучше обсудить такую боль с гинекологом и показать даты в отчёте."
        : "Резкую необычную боль лучше не списывать на обычные месячные, особенно если она усиливается или появилась внезапно.",
      action: "Создать отчёт для врача",
    });
  }

  // Very heavy periods
  const heavyPeriods = checkIns.filter(c => c.period?.intensity === "very_heavy");
  const heavyBleedingEpisodes = countBadSymptom("heavy_bleeding");
  if (heavyPeriods.length >= 1 || heavyBleedingEpisodes > 0) {
    pushUnique({
      severity: "alert",
      title: heavyPeriods.length + heavyBleedingEpisodes >= 2 ? "Очень обильное кровотечение повторяется" : "Очень обильное кровотечение",
      body: "Если прокладка полностью промокает примерно за час, есть большие сгустки, слабость или головокружение, лучше обратиться за медицинской помощью.",
      action: "Обратить внимание на железо",
    });
  }

  // Period >7 days
  if (periodLength > 7) {
    pushUnique({
      severity: "warning",
      title: "Месячные длятся дольше 7 дней",
      body: "Нормальная длительность — 3-7 дней. Если кровотечение регулярно дольше, стоит обсудить с врачом.",
      action: "Обсудить с врачом",
    });
  }

  // Cycle too short or too long
  if (cycleLength < 21) {
    pushUnique({
      severity: "warning",
      title: "Цикл короче 21 дня",
      body: "Это может указывать на гормональные изменения. Стоит обсудить с гинекологом.",
      action: "Обсудить с врачом",
    });
  }
  if (cycleLength > 35) {
    pushUnique({
      severity: "warning",
      title: "Цикл длиннее 35 дней",
      body: "Нерегулярные длинные циклы могут иметь разные причины. Лучше обсудить это с гинекологом.",
      action: "Обсудить с врачом",
    });
  }

  // Bad sleep >40% of days
  const sleepDays = checkIns.filter(c => c.sleep);
  const badSleep = sleepDays.filter(c => c.sleep!.quality === "bad" || c.sleep!.quality === "insomnia");
  if (sleepDays.length >= 14 && badSleep.length > sleepDays.length * 0.4) {
    pushUnique({
      severity: "warning",
      title: "Хронически плохой сон",
      body: "Плохой сон отмечен в 40%+ дней. Это может быть связано с фазой цикла, стрессом или нагрузкой; хронические проблемы лучше обсудить со специалистом.",
      action: "Обсудить с врачом",
    });
  }

  const midCycleBleeding = countBadSymptom("mid_cycle_bleeding");
  if (midCycleBleeding > 0) {
    pushUnique({
      severity: midCycleBleeding >= 2 ? "alert" : "warning",
      title: midCycleBleeding >= 2 ? "Кровь между месячными повторяется" : "Кровь между месячными",
      body: "Если кровь появляется между месячными, особенно с болью или повтором, лучше обсудить это с врачом.",
      action: "Обсудить с врачом",
    });
  }

  if (intimacyPain.length > 0) {
    pushUnique({
      severity: intimacyPain.length >= 2 ? "alert" : "warning",
      title: intimacyPain.length >= 2 ? "Боль во время секса повторяется" : "Боль во время секса",
      body: "Боль или дискомфорт во время секса не стоит терпеть. Если это повторяется, лучше обсудить с врачом.",
      action: "Обсудить с врачом",
    });
  }

  if (intimacyBleeding.length > 0) {
    pushUnique({
      severity: intimacyBleeding.length >= 2 ? "alert" : "warning",
      title: intimacyBleeding.length >= 2 ? "Кровь после секса повторяется" : "Кровь после секса",
      body: "Кровь после секса лучше не списывать на цикл, особенно если симптом повторяется или сопровождается болью.",
      action: "Обсудить с врачом",
    });
  }

  const faintingOrDizzy = countBadSymptom("fainting") + countBadSymptom("dizziness");
  if (faintingOrDizzy > 0) {
    pushUnique({
      severity: countBadSymptom("fainting") > 0 ? "alert" : "warning",
      title: countBadSymptom("fainting") > 0 ? "Обморок отмечен" : "Головокружение при кровотечении",
      body: "Обморок, потемнение в глазах или сильное головокружение во время кровотечения лучше не игнорировать.",
      action: "Обратиться за помощью",
    });
  }

  const weaknessSignals = countBadSymptom("no_energy") + exhaustedDays.length;
  if (weaknessSignals >= 2) {
    pushUnique({
      severity: "warning",
      title: "Сильная слабость повторяется",
      body: "Сильная слабость на фоне месячных может быть связана с кровопотерей, сном, питанием или стрессом. Если повторяется, стоит обсудить это с врачом.",
      action: "Проверить повтор",
    });
  }

  if (delayChecks.length >= 2 || currentDelayDays >= 7) {
    pushUnique({
      severity: currentDelayDays >= 14 ? "alert" : "warning",
      title: delayChecks.length >= 2 ? "Задержки повторяются" : `Задержка ${currentDelayDays} дн.`,
      body: currentDelayDays >= 7
        ? "Если был секс, сделай тест. Если задержки повторяются или тест отрицательный, а месячные не приходят, лучше обсудить цикл с врачом."
        : "Повторяющиеся задержки стоит отслеживать вместе с факторами: стресс, болезнь, перелёты, лекарства и защита.",
      action: "Разобраться с задержкой",
    });
  }

  return flags;
}

// ── #4 Symptom-Phase Correlation ──

export type PhaseCorrelation = {
  symptom: string;
  phase: string;
  frequency: number;
  total: number;
  explanation: string;
};

export function getPhaseCorrelations(data: MiraLocalData): PhaseCorrelation[] {
  const profile = data.profile;
  if (!profile) return [];

  const checkIns = Object.values(data.checkIns);
  if (checkIns.length < 14) return [];

  const cycleLength = profile.cycleConfig.cycleLength;
  const periodLength = profile.cycleConfig.periodLength;
  const correlations: PhaseCorrelation[] = [];

  function getPhaseForCheckIn(c: DailyCheckIn): CyclePhase {
    const start = new Date(profile!.cycleConfig.periodStart);
    const d = new Date(c.date);
    const days = Math.max(0, Math.floor((d.getTime() - start.getTime()) / 86_400_000));
    const cycleDay = (days % cycleLength) + 1;
    return getCyclePhase(cycleDay, periodLength, cycleLength);
  }

  // Mood by phase
  const anxietyByPhase: Record<string, number> = {};
  const sadnessByPhase: Record<string, number> = {};
  let totalAnxiety = 0;
  let totalSadness = 0;

  for (const c of checkIns) {
    if (!c.mood) continue;
    const phase = getPhaseForCheckIn(c);
    const pl = getPhaseLabel(phase);
    if (c.mood.value === "anxiety") { anxietyByPhase[pl] = (anxietyByPhase[pl] ?? 0) + 1; totalAnxiety++; }
    if (c.mood.value === "sadness") { sadnessByPhase[pl] = (sadnessByPhase[pl] ?? 0) + 1; totalSadness++; }
  }

  const topAnxiety = Object.entries(anxietyByPhase).sort((a, b) => b[1] - a[1])[0];
  if (topAnxiety && topAnxiety[1] >= 2) {
    correlations.push({
      symptom: "Тревога",
      phase: topAnxiety[0],
      frequency: topAnxiety[1],
      total: totalAnxiety,
      explanation: `Тревога чаще появляется в ${topAnxiety[0].toLowerCase()} фазе (${topAnxiety[1]} из ${totalAnxiety} раз). Это может быть связано с колебаниями цикла, стрессом или сном.`,
    });
  }

  const topSadness = Object.entries(sadnessByPhase).sort((a, b) => b[1] - a[1])[0];
  if (topSadness && topSadness[1] >= 2) {
    correlations.push({
      symptom: "Грусть",
      phase: topSadness[0],
      frequency: topSadness[1],
      total: totalSadness,
      explanation: `Грусть чаще в ${topSadness[0].toLowerCase()} фазе (${topSadness[1]} из ${totalSadness}). Это наблюдение по твоим данным, не диагноз.`,
    });
  }

  // Pain by phase
  const painByPhase: Record<string, number> = {};
  let totalPain = 0;
  for (const c of checkIns) {
    if (!c.pain || c.pain.kinds.every(k => k === "none")) continue;
    const phase = getPhaseForCheckIn(c);
    const pl = getPhaseLabel(phase);
    painByPhase[pl] = (painByPhase[pl] ?? 0) + 1;
    totalPain++;
  }
  const topPain = Object.entries(painByPhase).sort((a, b) => b[1] - a[1])[0];
  if (topPain && topPain[1] >= 2) {
    correlations.push({
      symptom: "Боль",
      phase: topPain[0],
      frequency: topPain[1],
      total: totalPain,
      explanation: `Боль концентрируется в ${topPain[0].toLowerCase()} фазе (${topPain[1]} из ${totalPain}). ${topPain[0] === "Менструация" ? "Тепло и мягкий режим некоторым помогают пережить спазмы." : "Боль вне менструации лучше не игнорировать, особенно если она повторяется."}`,
    });
  }

  // Bad sleep by phase
  const badSleepByPhase: Record<string, number> = {};
  let totalBadSleep = 0;
  for (const c of checkIns) {
    if (c.sleep?.quality !== "bad" && c.sleep?.quality !== "insomnia") continue;
    const phase = getPhaseForCheckIn(c);
    const pl = getPhaseLabel(phase);
    badSleepByPhase[pl] = (badSleepByPhase[pl] ?? 0) + 1;
    totalBadSleep++;
  }
  const topBadSleep = Object.entries(badSleepByPhase).sort((a, b) => b[1] - a[1])[0];
  if (topBadSleep && topBadSleep[1] >= 2) {
    correlations.push({
      symptom: "Плохой сон",
      phase: topBadSleep[0],
      frequency: topBadSleep[1],
      total: totalBadSleep,
      explanation: `Сон ухудшается в ${topBadSleep[0].toLowerCase()} фазе (${topBadSleep[1]} из ${totalBadSleep}). Попробуй отслеживать температуру комнаты, стресс и кофеин вечером.`,
    });
  }

  // Low energy by phase
  const lowEnergyByPhase: Record<string, number> = {};
  let totalLowEnergy = 0;
  for (const c of checkIns) {
    if (c.energy?.value !== "exhausted" && c.energy?.value !== "low") continue;
    const phase = getPhaseForCheckIn(c);
    const pl = getPhaseLabel(phase);
    lowEnergyByPhase[pl] = (lowEnergyByPhase[pl] ?? 0) + 1;
    totalLowEnergy++;
  }
  const topLowEnergy = Object.entries(lowEnergyByPhase).sort((a, b) => b[1] - a[1])[0];
  if (topLowEnergy && topLowEnergy[1] >= 2) {
    correlations.push({
      symptom: "Низкая энергия",
      phase: topLowEnergy[0],
      frequency: topLowEnergy[1],
      total: totalLowEnergy,
      explanation: `Энергия падает в ${topLowEnergy[0].toLowerCase()} фазе (${topLowEnergy[1]} из ${totalLowEnergy}). ${topLowEnergy[0] === "Менструация" ? "Если это повторяется, можно обсудить железо и ферритин с врачом." : "Это может быть связано с циклом, сном или нагрузкой."}`,
    });
  }

  return correlations;
}

// ── #6 Iron Alert ──

export type IronAlert = {
  show: boolean;
  title: string;
  body: string;
  foods: string[];
} | null;

export function getIronAlert(data: MiraLocalData): IronAlert {
  const checkIns = Object.values(data.checkIns);
  const heavyDays = checkIns.filter(c => c.period?.intensity === "heavy" || c.period?.intensity === "very_heavy");

  if (heavyDays.length < 2) return null;

  const lowEnergy = checkIns.filter(c => c.energy?.value === "exhausted" || c.energy?.value === "low");
  const hasLowEnergy = lowEnergy.length >= 3;

  return {
    show: true,
    title: hasLowEnergy
      ? "Обильные месячные + низкая энергия → стоит проверить железо"
      : "Обильные месячные → следи за железом",
    body: hasLowEnergy
      ? "При обильных месячных запасы железа иногда снижаются. Усталость, бледность или выпадение волос — повод обсудить ферритин с врачом."
      : "При обильных месячных организм теряет больше железа. Добавь продукты с железом в рацион.",
    foods: ["Гречка", "Шпинат", "Красное мясо", "Чечевица", "Гранат", "Печень"],
  };
}

// ── #7 Tough Day Mode ──

export function isToughDay(data: MiraLocalData): boolean {
  const checkIn = data.checkIns[dateKey()];
  if (!checkIn) return false;
  return (
    checkIn.pain?.level === "strong" ||
    checkIn.energy?.value === "exhausted" ||
    (checkIn.sleep?.quality === "insomnia" && checkIn.energy?.value === "low") ||
    (checkIn.period?.intensity === "very_heavy")
  );
}

export type ToughDayContent = {
  greeting: string;
  tips: string[];
  avoid: string[];
};

export function getToughDayContent(data: MiraLocalData): ToughDayContent | null {
  if (!isToughDay(data)) return null;
  const checkIn = data.checkIns[dateKey()];
  if (!checkIn) return null;

  const tips: string[] = [];
  const avoid: string[] = [];

  if (checkIn.pain?.level === "strong") {
    tips.push("Грелка на живот — тепло расслабляет мышцы матки");
    tips.push("Поза эмбриона снимает давление");
    tips.push("Медленное глубокое дыхание (4 сек вдох, 6 сек выдох)");
    avoid.push("Интенсивные тренировки");
    avoid.push("Кофе — усиливает спазмы");
  }

  if (checkIn.energy?.value === "exhausted") {
    tips.push("Белковый перекус: орехи, йогурт, яйцо");
    tips.push("15 минут на воздухе — возвращает силы");
    tips.push("Стакан воды — обезвоживание маскируется под усталость");
    avoid.push("Сахарные перекусы — дадут скачок и обвал");
  }

  if (checkIn.period?.intensity === "very_heavy") {
    tips.push("Продукты с железом: гречка, шпинат, гранат");
    tips.push("Пей больше воды");
    tips.push("Отдыхай без вины — тело работает");
  }

  if (tips.length === 0) {
    tips.push("Будь мягче к себе сегодня");
    tips.push("Лёгкая прогулка или просто отдых");
    tips.push("Тёплый чай и тёплая еда");
  }

  return {
    greeting: "Сегодня тяжёлый день. Это пройдёт.",
    tips,
    avoid,
  };
}

// ── #8 Doctor Visit Script ──

export type DoctorScript = {
  intro: string;
  questions: string[];
  dataPoints: string[];
};

export function getDoctorScript(data: MiraLocalData): DoctorScript {
  const profile = data.profile;
  const checkIns = Object.values(data.checkIns);
  const flags = getRedFlags(data);

  const questions: string[] = [
    "Как оценить мои месячные и цикл для моего возраста?",
  ];
  const dataPoints: string[] = [];

  if (profile) {
    dataPoints.push(`Длина цикла: ${profile.cycleConfig.cycleLength} дней`);
    dataPoints.push(`Длительность месячных: ${profile.cycleConfig.periodLength} дней`);
    dataPoints.push(`Данных собрано: ${checkIns.length} дней`);
  }

  const strongPain = checkIns.filter(c => c.pain?.level === "strong");
  if (strongPain.length >= 2) {
    questions.push(`Сильная боль отмечена ${strongPain.length} раз — какие причины стоит исключить?`);
    dataPoints.push(`Сильная боль: ${strongPain.length} дней`);
  }

  const heavy = checkIns.filter(c => c.period?.intensity === "heavy" || c.period?.intensity === "very_heavy");
  if (heavy.length >= 2) {
    questions.push("Нужно ли проверить уровень железа / ферритин?");
    dataPoints.push(`Обильные месячные: ${heavy.length} дней`);
  }

  if (profile && profile.cycleConfig.cycleLength > 35) {
    questions.push("Какие причины длинного цикла стоит проверить?");
  }

  const badSleep = checkIns.filter(c => c.sleep?.quality === "bad" || c.sleep?.quality === "insomnia");
  if (badSleep.length >= 5) {
    questions.push("Может ли плохой сон быть связан с гормонами?");
    dataPoints.push(`Плохой сон: ${badSleep.length} дней`);
  }

  questions.push("Какие обследования вы рекомендуете?");

  for (const flag of flags) {
    if (!questions.some(q => q.includes(flag.title.split(" ")[0]))) {
      questions.push(flag.title + " — что это может значить?");
    }
  }

  return {
    intro: "Я отслеживаю свой цикл и симптомы. Вот данные, которые я собрала:",
    questions,
    dataPoints,
  };
}

// ── #3 Daily Phase Card (enhanced) ──

export type DailyPhaseCard = {
  phase: CyclePhase;
  phaseLabel: string;
  cycleDay: number;
  title: string;
  bodyFacts: string[];
  hormoneStatus: string;
  whatToExpect: string[];
};

export function getDailyPhaseCard(data: MiraLocalData): DailyPhaseCard | null {
  const profile = data.profile;
  if (!profile) return null;

  const cycleDay = getCycleDay(profile);
  const cycleLength = profile.cycleConfig.cycleLength;
  const periodLength = profile.cycleConfig.periodLength;
  const phase = getCyclePhase(cycleDay, periodLength, cycleLength);

  const cards: Record<CyclePhase, Omit<DailyPhaseCard, "phase" | "phaseLabel" | "cycleDay">> = {
    menstruation: {
      title: "Менструальная фаза",
      hormoneStatus: "Эстроген и прогестерон на минимуме",
      bodyFacts: [
        "Матка сокращается, чтобы обновить слизистую",
        "Простагландины вызывают спазмы — это причина боли",
        "Организм теряет 30-80 мл крови (2-5 ст. ложек)",
        "Запасы железа могут снижаться — усталость стоит отслеживать",
      ],
      whatToExpect: [
        "Энергия ниже обычного",
        "Возможна боль и дискомфорт",
        "Хочется тёплого и сладкого",
        "Сон может быть глубже",
      ],
    },
    follicular: {
      title: "Фолликулярная фаза",
      hormoneStatus: "Эстроген растёт → мозг вырабатывает больше серотонина",
      bodyFacts: [
        "Фолликулы созревают в яичниках",
        "Эстроген улучшает память и концентрацию",
        "Кожа выглядит лучше — коллаген активен",
        "Метаболизм ускоряется",
      ],
      whatToExpect: [
        "Энергия и мотивация растут",
        "Настроение улучшается",
        "Лучшее время для новых привычек",
        "Мышцы быстрее восстанавливаются",
      ],
    },
    ovulation: {
      title: "Овуляторная фаза",
      hormoneStatus: "Пик эстрогена + выброс лютеинизирующего гормона (ЛГ)",
      bodyFacts: [
        "Яйцеклетка выходит из яичника",
        "Фертильность максимальна 24-48 часов",
        "Тестостерон даёт уверенность и либидо",
        "Голос немного повышается (исследования)",
      ],
      whatToExpect: [
        "Максимум энергии и уверенности",
        "Повышенное либидо",
        "Лучший день для важных разговоров",
        "Возможна лёгкая боль сбоку (овуляторная)",
      ],
    },
    luteal: {
      title: "Лютеиновая фаза",
      hormoneStatus: "Прогестерон растёт, потом резко падает перед месячными",
      bodyFacts: [
        "Прогестерон повышает температуру тела на 0.3-0.5°C",
        "Настроение может стать чувствительнее",
        "Задержка жидкости → вздутие и вес +1-2 кг",
        "ПМС-сигналы важно отслеживать без самокритики",
      ],
      whatToExpect: [
        "Энергия и настроение могут снизиться",
        "Тяга к сладкому — прогестерон повышает аппетит",
        "Сон может ухудшиться",
        "Раздражительность может быть частью твоего паттерна",
      ],
    },
  };

  return {
    phase,
    phaseLabel: getPhaseLabel(phase),
    cycleDay,
    ...cards[phase],
  };
}
