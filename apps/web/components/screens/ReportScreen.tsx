"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Calendar,
  ClipboardList,
  Copy,
  Download,
  Droplets,
  FileText,
  FlaskConical,
  Footprints,
  HeartHandshake,
  MessageSquare,
  Moon,
  Pill,
  Printer,
  Scale,
  Shield,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDoctorScript, getPhaseCorrelations } from "@/lib/alerts";
import { getCycleAnalytics } from "@/lib/cycleAnalytics";
import { getCorrelations } from "@/lib/correlations";
import { getCycleNorm } from "@/lib/cycleEngine";
import { evaluateLab, getLabRange } from "@/lib/labs";
import type { DailyCheckIn, MiraLocalData } from "@/lib/types";
import type { ScreenProps } from "./types";

const periods = [
  { label: "1 цикл", months: 1 },
  { label: "3 месяца", months: 3 },
  { label: "6 месяцев", months: 6 },
  { label: "12 месяцев", months: 12 },
];

type ReportSectionId =
  | "periodDates"
  | "delays"
  | "painSymptoms"
  | "moodEnergy"
  | "sleep"
  | "labs"
  | "doctorQuestions"
  | "privateNotes"
  | "sex";

const reportSectionLabels: Array<{ id: ReportSectionId; label: string; sensitive?: boolean }> = [
  { id: "periodDates", label: "Даты месячных" },
  { id: "delays", label: "Задержки" },
  { id: "painSymptoms", label: "Боль и симптомы" },
  { id: "moodEnergy", label: "Настроение и энергия" },
  { id: "sleep", label: "Сон" },
  { id: "labs", label: "Анализы" },
  { id: "doctorQuestions", label: "Вопросы врачу" },
  { id: "privateNotes", label: "Личные заметки", sensitive: true },
  { id: "sex", label: "Секс и контрацепция", sensitive: true },
];

const defaultReportSections: Record<ReportSectionId, boolean> = {
  periodDates: true,
  delays: true,
  painSymptoms: true,
  moodEnergy: true,
  sleep: true,
  labs: true,
  doctorQuestions: true,
  privateNotes: false,
  sex: false,
};

const urgentHelpItems = [
  "резкая или очень сильная боль;",
  "обморок;",
  "очень обильное кровотечение;",
  "кровь после секса;",
  "положительный тест и боль;",
  "сильная слабость;",
  "задержка больше обычного и есть тревожные симптомы.",
];

const painLabels: Record<string, string> = {
  cramps: "спазмы",
  lower_abdomen: "низ живота",
  headache: "голова",
  breast: "грудь",
  back: "спина",
  ovulatory: "овуляторная",
  none: "нет",
};

const moodLabels: Record<string, string> = {
  normal: "ровное",
  joy: "хорошее",
  sadness: "грусть",
  anger: "раздражение",
  anxiety: "тревога",
  swings: "перепады",
};

const energyLabels: Record<string, string> = {
  exhausted: "нет сил",
  low: "низкая",
  normal: "нормальная",
  high: "высокая",
};

const sleepLabels: Record<string, string> = {
  good: "хороший",
  normal: "нормальный",
  bad: "плохой",
  little: "мало сна",
  insomnia: "бессонница",
};

const flowLabels: Record<string, string> = {
  light: "скудные",
  moderate: "обычные",
  heavy: "обильные",
  very_heavy: "очень обильные",
};

const protectionLabels: Record<string, string> = {
  protected: "защищённый",
  unprotected: "незащищённый",
  interrupted: "прерванный",
  masturbation: "мастурбация",
  toy: "игрушка",
};

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

function countBy(items: string[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {});
}

function cycleDayFor(date: string, profile: MiraLocalData["profile"]) {
  const config = profile?.cycleConfig;
  if (!config?.periodStart) return null;
  const start = new Date(`${config.periodStart}T00:00:00`);
  const current = new Date(`${date}T00:00:00`);
  const diff = Math.floor((current.getTime() - start.getTime()) / 86400000);
  const length = getCycleNorm(profile).cycleLength;
  return ((diff % length) + length) % length + 1;
}

function hasPain(checkIn: DailyCheckIn) {
  return Boolean(checkIn.pain?.kinds.some(kind => kind !== "none"));
}

function hasUnusualSymptoms(checkIn: DailyCheckIn) {
  return Boolean(
    checkIn.badEpisodes?.length ||
    checkIn.delayChecks?.length ||
    checkIn.period?.intensity === "very_heavy" ||
    checkIn.intimacy?.bleedingAfter ||
    checkIn.intimacy?.feeling === "pain" ||
    checkIn.energy?.value === "exhausted"
  );
}

function summarizeCareData(data: MiraLocalData, cutoffStr: string) {
  const waterEntries = Object.values(data.waterLog ?? {}).filter(entry => entry.date >= cutoffStr);
  const walkingEntries = Object.values(data.walkingLog ?? {}).filter(entry => entry.date >= cutoffStr);
  const weightEntries = Object.values(data.weightLog ?? {}).filter(entry => entry.date >= cutoffStr).sort((a, b) => a.date.localeCompare(b.date));
  const workouts = data.workouts.filter(workout => workout.date >= cutoffStr);
  const mealDays = Object.values(data.checkIns).filter(checkIn => checkIn.date >= cutoffStr && checkIn.meals?.length).length;
  const lowWaterDays = waterEntries.filter(entry => entry.glasses < 4).length;
  const walkingGoodDays = walkingEntries.filter(entry => entry.steps >= Math.min(entry.goal, 5000)).length;
  const completedWorkouts = workouts.filter(workout => workout.status === "completed").length;
  const latestWeight = weightEntries[weightEntries.length - 1];
  const firstWeight = weightEntries[0];
  const weightDelta = latestWeight && firstWeight && latestWeight.date !== firstWeight.date
    ? Math.round((latestWeight.weight - firstWeight.weight) * 10) / 10
    : null;

  return {
    waterEntries,
    walkingEntries,
    weightEntries,
    workouts,
    mealDays,
    lowWaterDays,
    walkingGoodDays,
    completedWorkouts,
    latestWeight,
    weightDelta,
  };
}

export function ReportScreen({ data, navigate, onCheckIn }: ScreenProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(3);
  const [showFullReport, setShowFullReport] = useState(true);
  const [includedSections, setIncludedSections] = useState<Record<ReportSectionId, boolean>>(defaultReportSections);

  const report = useMemo(() => {
    const profile = data.profile;
    const cycleLength = getCycleNorm(profile).cycleLength;
    const periodLength = profile?.cycleConfig.periodLength ?? 5;
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - selectedPeriod);
    const cutoffStr = cutoffDate.toISOString().slice(0, 10);

    const entries = Object.values(data.checkIns)
      .filter(checkIn => checkIn.date >= cutoffStr)
      .sort((a, b) => a.date.localeCompare(b.date));

    const periodEntries = entries.filter(checkIn => checkIn.period);
    const painEntries = entries.filter(hasPain);
    const strongPainEntries = painEntries.filter(checkIn => checkIn.pain?.level === "strong");
    const heavyFlowEntries = periodEntries.filter(checkIn => checkIn.period?.intensity === "heavy" || checkIn.period?.intensity === "very_heavy");
    const delayChecks = entries.flatMap(checkIn => (checkIn.delayChecks ?? []).map(delay => ({ date: checkIn.date, delay })));
    const intimacyEntries = entries.filter(checkIn => checkIn.intimacy?.happened);
    const intimacyRiskEntries = intimacyEntries.filter(checkIn =>
      checkIn.intimacy?.protection === "unprotected" ||
      checkIn.intimacy?.protection === "interrupted" ||
      checkIn.intimacy?.feeling === "pain" ||
      checkIn.intimacy?.bleedingAfter
    );
    const medicationEntries = entries.filter(checkIn => checkIn.symptomLog?.medications?.length);
    const unusualEntries = entries.filter(hasUnusualSymptoms);
    const badSleepEntries = entries.filter(checkIn => checkIn.sleep?.quality === "bad" || checkIn.sleep?.quality === "insomnia" || checkIn.sleep?.quality === "little");
    const lowEnergyEntries = entries.filter(checkIn => checkIn.energy?.value === "low" || checkIn.energy?.value === "exhausted");
    const moodEntries = entries.filter(checkIn => checkIn.mood);
    const care = summarizeCareData(data, cutoffStr);
    const cycleAnalytics = getCycleAnalytics(data);
    const correlations = getCorrelations(data);
    const phaseCorrelations = getPhaseCorrelations(data);

    const symptomCounts = Object.entries(countBy(entries.flatMap(checkIn => [
      ...(checkIn.pms?.symptoms ?? []),
      ...(checkIn.symptomLog?.sweetCraving ? ["тяга к сладкому"] : []),
      ...(checkIn.symptomLog?.anxiety ? ["тревога"] : []),
      ...(checkIn.discharge ? ["выделения"] : []),
      ...(checkIn.period?.type === "clots" ? ["сгустки"] : []),
      ...(checkIn.period?.type === "spotting" ? ["мажущие выделения"] : []),
    ]))).sort((a, b) => b[1] - a[1]).slice(0, 6);

    const focusItems = [
      strongPainEntries.length >= 2 ? "Повторяющаяся сильная боль" : null,
      heavyFlowEntries.length >= 2 ? "Обильные месячные повторяются" : null,
      delayChecks.length > 0 ? "Были задержки" : null,
      intimacyRiskEntries.some(checkIn => checkIn.intimacy?.feeling === "pain" || checkIn.intimacy?.bleedingAfter) ? "Боль или кровь после секса" : null,
      lowEnergyEntries.length >= Math.max(2, Math.round(entries.length * 0.25)) ? "Частая слабость / низкая энергия" : null,
      badSleepEntries.length >= Math.max(2, Math.round(entries.length * 0.25)) ? "Сон часто ухудшается" : null,
    ].filter(Boolean) as string[];

    const doctorHighlights = [
      strongPainEntries.length >= 2 ? `Сильная боль отмечена ${strongPainEntries.length} раза за выбранный период.` : null,
      heavyFlowEntries.length >= 2 ? `Обильные/очень обильные месячные отмечены ${heavyFlowEntries.length} раза.` : null,
      delayChecks.length > 0 ? `Есть ${delayChecks.length} разбор(ов) задержки с возможными причинами.` : null,
      lowEnergyEntries.length >= 2 ? `Низкая энергия или сильная слабость отмечены ${lowEnergyEntries.length} дня.` : null,
      badSleepEntries.length >= 2 ? `Сон ухудшался ${badSleepEntries.length} дня, это может усиливать боль и усталость.` : null,
      care.weightDelta !== null && Math.abs(care.weightDelta) >= 1 ? `Вес изменился на ${care.weightDelta > 0 ? "+" : ""}${care.weightDelta.toFixed(1)} кг за период отметок.` : null,
      intimacyRiskEntries.some(checkIn => checkIn.intimacy?.feeling === "pain" || checkIn.intimacy?.bleedingAfter) ? "Есть отметки боли или крови после секса." : null,
    ].filter(Boolean) as string[];

    const analyticsFindings = [
      cycleAnalytics ? cycleAnalytics.insight : null,
      ...correlations.slice(0, 3).map(item => item.body),
      ...phaseCorrelations.slice(0, 2).map(item => item.explanation),
      care.lowWaterDays >= 2 ? `В ${care.lowWaterDays} дня воды было меньше 1 л. Это стоит сравнить со вздутием, слабостью и головной болью.` : null,
      care.walkingEntries.length >= 3 ? `Ходьба отмечена ${care.walkingEntries.length} дня. Врач может видеть контекст активности в дни боли и усталости.` : null,
      care.completedWorkouts >= 2 ? `Выполнено ${care.completedWorkouts} тренировок. Это помогает оценить нагрузку рядом с ухудшением самочувствия.` : null,
      care.weightDelta !== null ? `Вес: ${care.latestWeight?.weight.toFixed(1)} кг, изменение ${care.weightDelta > 0 ? "+" : ""}${care.weightDelta.toFixed(1)} кг за период отметок.` : null,
    ].filter(Boolean).slice(0, 7) as string[];

    const questions = [
      strongPainEntries.length >= 2 ? "Почему сильная боль повторяется и какие обследования стоит обсудить?" : null,
      heavyFlowEntries.length >= 2 ? "Нормальна ли такая обильность и нужно ли проверить ферритин/гемоглобин?" : null,
      delayChecks.length > 0 ? "Какие причины задержки вероятны в моём случае и когда делать тест?" : null,
      intimacyRiskEntries.some(checkIn => checkIn.intimacy?.feeling === "pain" || checkIn.intimacy?.bleedingAfter) ? "С чем может быть связана боль или кровь после секса?" : null,
      medicationEntries.length > 0 ? "Могут ли лекарства из списка влиять на цикл или симптомы?" : null,
      care.lowWaterDays >= 2 ? "Может ли слабость/головная боль/вздутие усиливаться из-за недостатка воды или других факторов?" : null,
      care.weightDelta !== null && Math.abs(care.weightDelta) >= 1 ? "Может ли изменение веса быть связано с фазой цикла, задержкой жидкости или гормональными причинами?" : null,
      "Какие красные флаги в моих записях требуют очного осмотра?",
    ].filter(Boolean) as string[];

    const tableRows = entries
      .filter(checkIn => checkIn.period || hasPain(checkIn) || checkIn.mood || checkIn.energy || checkIn.sleep || checkIn.symptomLog || checkIn.badEpisodes?.length || checkIn.delayChecks?.length || checkIn.intimacy?.happened)
      .slice(-18)
      .reverse();

    return {
      profile,
      cycleLength,
      periodLength,
      cutoffDate,
      entries,
      periodEntries,
      painEntries,
      strongPainEntries,
      heavyFlowEntries,
      delayChecks,
      intimacyEntries,
      intimacyRiskEntries,
      medicationEntries,
      unusualEntries,
      badSleepEntries,
      lowEnergyEntries,
      moodEntries,
      care,
      cycleAnalytics,
      correlations,
      phaseCorrelations,
      doctorHighlights,
      analyticsFindings,
      symptomCounts,
      focusItems,
      questions,
      tableRows,
    };
  }, [data, selectedPeriod]);

  function generateTextReport(): string {
    const now = new Date().toLocaleDateString("ru-RU");
    const from = report.cutoffDate.toLocaleDateString("ru-RU");
    const lines = [
      "ОТЧЁТ ДЛЯ ВРАЧА — Mira",
      `Период: ${from} — ${now}`,
      `Дней с данными: ${report.entries.length}`,
      "",
      "КРАТКО",
      `Цикл по профилю: ${report.cycleLength} дней, месячные: ${report.periodLength} дней`,
      includedSections.periodDates ? `Даты месячных с отметками: ${report.periodEntries.map(entry => entry.date).join(", ") || "нет данных"}` : null,
      includedSections.painSymptoms ? `Боль: ${report.painEntries.length} дней, сильная боль: ${report.strongPainEntries.length} дней` : null,
      includedSections.painSymptoms ? `Обильность: ${report.heavyFlowEntries.length} дней с обильными/очень обильными отметками` : null,
      includedSections.delays ? `Задержки: ${report.delayChecks.length ? report.delayChecks.map(item => `${item.date}: ${item.delay.delayDays} дн.`).join("; ") : "нет отметок"}` : null,
      includedSections.moodEnergy ? `Настроение отмечено: ${report.moodEntries.length} дней` : null,
      includedSections.sleep ? `Сон ухудшался: ${report.badSleepEntries.length} дней` : null,
      `Лекарства: ${report.medicationEntries.map(entry => `${entry.date}: ${entry.symptomLog?.medications?.join(", ")}`).join("; ") || "нет отметок"}`,
      "",
      "ГЛАВНОЕ ДЛЯ ВРАЧА",
      ...(getVisiblePersonalItems(report.doctorHighlights).length ? getVisiblePersonalItems(report.doctorHighlights).map(item => `— ${item}`) : ["— Повторяющихся тревожных сигналов пока мало"]),
      "",
      "ЗАКОНОМЕРНОСТИ ИЗ АНАЛИТИКИ",
      ...(report.analyticsFindings.length ? report.analyticsFindings.map(item => `— ${item}`) : ["— Данных пока недостаточно для личных закономерностей"]),
      "",
      "ФАКТОРЫ ЗАБОТЫ",
      `— Вода: ${report.care.waterEntries.length} дней с отметками, мало воды: ${report.care.lowWaterDays} дней`,
      `— Питание: ${report.care.mealDays} дней с отметками`,
      `— Ходьба: ${report.care.walkingEntries.length} дней, достаточно шагов: ${report.care.walkingGoodDays} дней`,
      `— Тренировки: ${report.care.workouts.length} записей, выполнено: ${report.care.completedWorkouts}`,
      `— Вес: ${report.care.weightEntries.length} замеров${report.care.latestWeight ? `, последний ${report.care.latestWeight.weight.toFixed(1)} кг` : ""}`,
      "",
      "ЧТО ОБСУДИТЬ",
      ...(getVisiblePersonalItems(report.focusItems).length ? getVisiblePersonalItems(report.focusItems).map(item => `— ${item}`) : ["— Явных повторяющихся сигналов в выбранном периоде мало"]),
      "",
      "ЧАСТЫЕ СИМПТОМЫ",
      ...(includedSections.painSymptoms
        ? (report.symptomCounts.length ? report.symptomCounts.map(([symptom, count]) => `— ${symptom}: ${count}`) : ["— нет частых симптомов"])
        : ["— скрыто пользователем"]),
      "",
      includedSections.sex ? "СЕКС И СВЯЗАННЫЕ СИМПТОМЫ" : "СЕКС И СВЯЗАННЫЕ СИМПТОМЫ: скрыто пользователем",
      ...(includedSections.sex
        ? [
          `Дней с отметкой: ${report.intimacyEntries.length}`,
          `Риски/дискомфорт: ${report.intimacyRiskEntries.map(entry => `${entry.date}: ${[
            entry.intimacy?.protection ? protectionLabels[entry.intimacy.protection] : null,
            entry.intimacy?.feeling === "pain" ? "боль" : null,
            entry.intimacy?.bleedingAfter ? "кровь после" : null,
          ].filter(Boolean).join(", ")}`).join("; ") || "нет"}`,
        ]
        : []),
      "",
      "ВОПРОСЫ ВРАЧУ",
      ...(includedSections.doctorQuestions ? report.questions.map((question, index) => `${index + 1}. ${question}`) : ["скрыто пользователем"]),
      "",
      "ДЕТАЛИ ПО ДНЯМ",
      ...(report.tableRows.length ? report.tableRows.map(row => {
        const parts = [
          includedSections.periodDates && row.period ? `месячные: ${flowLabels[row.period.intensity] ?? row.period.intensity}` : null,
          includedSections.painSymptoms && hasPain(row) ? `боль: ${row.pain?.level ?? "есть"} (${row.pain?.kinds.map(kind => painLabels[kind] ?? kind).join(", ")})` : null,
          includedSections.moodEnergy && row.mood ? `настроение: ${moodLabels[row.mood.value] ?? row.mood.value}` : null,
          includedSections.moodEnergy && row.energy ? `энергия: ${energyLabels[row.energy.value] ?? row.energy.value}` : null,
          includedSections.sleep && row.sleep ? `сон: ${sleepLabels[row.sleep.quality] ?? row.sleep.quality}` : null,
          row.symptomLog?.medications?.length ? `лекарства: ${row.symptomLog.medications.join(", ")}` : null,
          includedSections.painSymptoms && row.badEpisodes?.length ? `мне плохо: ${row.badEpisodes.map(ep => ep.summary).join("; ")}` : null,
          includedSections.delays && row.delayChecks?.length ? `задержка: ${row.delayChecks.map(delay => `${delay.delayDays} дн.`).join(", ")}` : null,
          includedSections.privateNotes && row.note?.text ? `личная заметка: ${row.note.text}` : null,
        ].filter(Boolean);
        return `— ${row.date}: ${parts.join("; ")}`;
      }) : ["— нет детальных записей"]),
      "",
      "Отчёт не является диагнозом и не заменяет консультацию врача. Он помогает структурировать наблюдения.",
    ];

    return lines.join("\n");
  }

  function toggleSection(id: ReportSectionId) {
    setIncludedSections(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function handleCopyQuestions() {
    const text = report.questions.map((question, index) => `${index + 1}. ${question}`).join("\n");
    void navigator.clipboard?.writeText(text);
  }

  function getVisiblePersonalItems(items: string[]) {
    return items.filter(item => {
      const text = item.toLowerCase();
      if (!includedSections.sex && (text.includes("секс") || text.includes("контрацеп") || text.includes("кровь после"))) return false;
      if (!includedSections.painSymptoms && (text.includes("боль") || text.includes("обильн") || text.includes("кровотеч"))) return false;
      if (!includedSections.delays && text.includes("задерж")) return false;
      if (!includedSections.sleep && text.includes("сон")) return false;
      if (!includedSections.moodEnergy && (text.includes("энерг") || text.includes("слаб"))) return false;
      return true;
    });
  }

  function handleExportText() {
    const blob = new Blob([generateTextReport()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mira-doctor-report-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handlePrintPdf() {
    setShowFullReport(true);
    window.setTimeout(() => window.print(), 50);
  }

  const doctorScript = getDoctorScript(data);
  const labs = data.labs ?? [];
  const abnormalLabs = labs.filter((lab) => {
    const result = evaluateLab(lab.testId, lab.value);
    return result && result.status !== "ok";
  });
  const visibleDoctorHighlights = getVisiblePersonalItems(report.doctorHighlights);
  const visibleFocusItems = getVisiblePersonalItems(report.focusItems);
  const hasCycleData = Boolean(data.profile?.cycleConfig.periodStart);
  const reportIsAlmostEmpty = report.entries.length < 2 && labs.length === 0;

  if (!hasCycleData) {
    return (
      <div>
        <div className="mb-6 print:hidden">
          <h1 className="text-2xl font-bold text-mira-text">Отчёт врачу</h1>
          <p className="mt-1 text-sm text-mira-muted">Симптомы, даты и закономерности, чтобы не вспоминать всё на приёме</p>
        </div>
        <ReportEmptyState
          title="Mira пока не знает твой цикл"
          body="Добавь дату последних месячных, чтобы получить прогноз и основу для отчёта врачу."
          onProfile={() => navigate("profile")}
        />
      </div>
    );
  }

  if (reportIsAlmostEmpty) {
    return (
      <div>
        <div className="mb-6 print:hidden">
          <h1 className="text-2xl font-bold text-mira-text">Отчёт врачу</h1>
          <p className="mt-1 text-sm text-mira-muted">Симптомы, даты и закономерности, чтобы не вспоминать всё на приёме</p>
        </div>
        <ReportEmptyState
          title="Пока отчёт почти пустой"
          body="Добавь месячные, симптомы, боль или заметки — и Mira соберёт факты для приёма."
          onCheckIn={onCheckIn}
          onPeriod={onCheckIn}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 print:hidden">
        <h1 className="text-2xl font-bold text-mira-text">Отчёт врачу</h1>
        <p className="mt-1 text-sm text-mira-muted">Симптомы, даты и закономерности, чтобы не вспоминать всё на приёме</p>
      </div>

      <Card className="mb-5 border-mira-primary/15 bg-white p-5 print:hidden">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Краткое резюме</p>
            <h2 className="mt-1 text-lg font-bold text-mira-text">
              {visibleFocusItems.length > 0 ? "Есть факты для обсуждения" : "Собрана история наблюдений"}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-mira-muted">
              Даты, симптомы, повторы, анализы и вопросы врачу. Без диагнозов и лишнего объяснения.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handlePrintPdf}>
              <Printer className="h-4 w-4" /> Скачать PDF
            </Button>
            <Button variant="outline" onClick={handleExportText}>
              <Download className="h-4 w-4" /> Скачать TXT
            </Button>
            <Button variant="outline" onClick={handleCopyQuestions}>
              <Copy className="h-4 w-4" /> Вопросы
            </Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <MiniStat label="Дней с данными" value={`${report.entries.length}`} note={`за ${selectedPeriod} мес.`} />
          <MiniStat label="Симптомы" value={`${report.painEntries.length + report.unusualEntries.length}`} note="боль и сигналы" />
          <MiniStat label="Анализы" value={`${labs.length}`} note={`вне реф.: ${abnormalLabs.length}`} />
          <MiniStat label="Вопросы" value={`${report.questions.length}`} note="для приёма" />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-mira-lavender/20 bg-mira-bg p-3">
            <p className="text-sm font-medium text-mira-text">Период отчёта</p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {periods.map(period => (
                <button
                  key={period.months}
                  onClick={() => setSelectedPeriod(period.months)}
                  className={`rounded-xl px-2 py-2.5 text-xs font-semibold transition ${
                    selectedPeriod === period.months ? "bg-mira-primary text-white shadow-glow" : "bg-white text-mira-muted"
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-mira-lavender/20 bg-mira-bg p-3">
            <p className="text-sm font-medium text-mira-text">Что включить в отчёт?</p>
            <p className="mt-1 text-[11px] leading-relaxed text-mira-muted">
              Ты сама выбираешь, какие данные попадут в отчёт. Личные заметки не включаются по умолчанию.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {reportSectionLabels.map(section => (
                <ReportCheckbox
                  key={section.id}
                  checked={includedSections[section.id]}
                  label={section.label}
                  sensitive={section.sensitive}
                  onClick={() => toggleSection(section.id)}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {[
            ["Зачем", "Не вспоминать симптомы на приёме по памяти."],
            ["Что сделать", "Выбрать период, проверить приватность и скачать PDF/TXT."],
            ["Что получишь", "Факты, даты, повторы, анализы и вопросы врачу."],
          ].map(([label, text]) => (
            <div key={label} className="rounded-2xl bg-mira-bg px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">{label}</p>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-mira-text">{text}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mb-5 border-mira-cycle/20 bg-mira-rose-light/20 p-5 print:hidden">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-mira-cycle" />
          <p className="text-sm font-bold text-mira-text">Когда лучше обратиться за помощью срочно</p>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {urgentHelpItems.map(item => (
            <div key={item} className="rounded-2xl bg-white/80 px-3 py-2 text-sm leading-relaxed text-mira-text">
              {item}
            </div>
          ))}
        </div>
      </Card>

      <Card className="mb-5 border-mira-primary/15 p-5 print:hidden">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-mira-cycle" />
          <p className="text-sm font-semibold text-mira-text">Главное для врача</p>
        </div>
        <div className="space-y-2">
          {(visibleDoctorHighlights.length ? visibleDoctorHighlights : ["Повторяющихся тревожных сигналов пока мало. Отчёт всё равно полезен как история наблюдений."]).slice(0, 5).map((item, index) => (
            <DoctorPoint key={item} index={index + 1} text={item} />
          ))}
        </div>
      </Card>

      <Card className="mb-5 p-5 print:hidden">
        <div className="mb-4 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-mira-primary" />
          <p className="text-sm font-semibold text-mira-text">Что попадёт в отчёт</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <InfoRow label="Цикл" value={`${report.periodEntries.length} дней месячных, цикл ${report.cycleLength} дн.`} />
          {includedSections.painSymptoms && <InfoRow label="Симптомы" value={`${report.painEntries.length} дней с болью, ${report.unusualEntries.length} необычных сигналов`} />}
          {includedSections.moodEnergy && <InfoRow label="Состояние" value={`${report.moodEntries.length} настроений, ${report.lowEnergyEntries.length} дней низкой энергии`} />}
          {includedSections.delays && <InfoRow label="Лекарства и задержки" value={`${report.medicationEntries.length} лекарств, ${report.delayChecks.length} разборов задержки`} />}
          <InfoRow label="Забота" value={`${report.care.waterEntries.length} воды, ${report.care.walkingEntries.length} ходьбы, ${report.care.weightEntries.length} веса`} />
          {includedSections.labs && <InfoRow label="Анализы" value={`${labs.length} результатов, вне референса: ${abnormalLabs.length}`} />}
          <InfoRow label="Закономерности" value={`${report.analyticsFindings.length} выводов из аналитики`} />
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-mira-success/15 bg-[#E0F5E8]/25 p-3">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-mira-success" />
          <p className="text-xs leading-relaxed text-mira-muted">
            Это предварительный отчёт для тебя. Личные заметки, секс и контрацепция скрыты по умолчанию и попадут в файл только после твоего выбора.
          </p>
        </div>
      </Card>

      <Card className="mb-5 border-mira-primary/15 p-5 print:hidden">
        <div className="mb-4 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-mira-primary" />
          <p className="text-sm font-semibold text-mira-text">На приёме сказать главное</p>
        </div>
        <p className="rounded-2xl bg-mira-lavender-light/25 p-3 text-sm italic leading-relaxed text-mira-text">"{doctorScript.intro}"</p>
        {visibleFocusItems.length > 0 && (
          <div className="mt-3 rounded-2xl border border-mira-cycle/15 bg-mira-rose-light/20 p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Не забыть обсудить</p>
            <p className="mt-1 text-sm leading-relaxed text-mira-text">{visibleFocusItems.join(" · ")}</p>
          </div>
        )}
      </Card>

      {includedSections.labs && (
      <Card className="mb-5 p-5 print:hidden">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-mira-primary" />
          <p className="text-sm font-semibold text-mira-text">Закономерности из аналитики</p>
        </div>
        <div className="space-y-2">
          {(report.analyticsFindings.length ? report.analyticsFindings : ["Mira пока собирает данные. После нескольких отметок здесь появятся личные закономерности."]).slice(0, 6).map(item => (
            <InfoRow key={item} label="Вывод" value={item} />
          ))}
        </div>
      </Card>
      )}

      <Card className="mb-5 p-5 print:hidden">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-mira-primary" />
          <p className="text-sm font-semibold text-mira-text">Что может влиять на самочувствие</p>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          <CareFactor icon={<Droplets className="h-4 w-4" />} label="Вода" value={`${report.care.waterEntries.length}`} note={`мало: ${report.care.lowWaterDays}`} />
          <CareFactor icon={<Sparkles className="h-4 w-4" />} label="Питание" value={`${report.care.mealDays}`} note="дней" />
          <CareFactor icon={<Footprints className="h-4 w-4" />} label="Ходьба" value={`${report.care.walkingEntries.length}`} note={`активно: ${report.care.walkingGoodDays}`} />
          <CareFactor icon={<Activity className="h-4 w-4" />} label="Тренировки" value={`${report.care.workouts.length}`} note={`выполнено: ${report.care.completedWorkouts}`} />
          <CareFactor icon={<Scale className="h-4 w-4" />} label="Вес" value={`${report.care.weightEntries.length}`} note={report.care.latestWeight ? `${report.care.latestWeight.weight.toFixed(1)} кг` : "нет"} />
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-mira-muted">
          Эти данные не ставят диагноз, но дают врачу контекст: нагрузка, вода, вес и питание рядом с симптомами.
        </p>
      </Card>

      <Card className="mb-5 p-5 print:hidden">
        <div className="mb-4 flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-mira-primary" />
          <p className="text-sm font-semibold text-mira-text">Анализы в отчёте</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <MiniStat label="Сохранено" value={`${labs.length}`} note="результатов" />
          <MiniStat label="Вне референса" value={`${abnormalLabs.length}`} note="обсудить с врачом" />
          <MiniStat label="Для врача" value={labs.length > 0 ? "есть" : "нет"} note="факты без диагноза" />
        </div>
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-mira-lavender/20 bg-mira-bg p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-mira-muted">
            Добавлять и смотреть все результаты удобнее на отдельной странице. Врач увидит их в полном отчёте.
          </p>
          <Button variant="outline" onClick={() => navigate("labs")}>
            <FlaskConical className="h-4 w-4" /> Открыть анализы
          </Button>
        </div>
      </Card>

      <div className="space-y-5 print:space-y-3">
        {showFullReport && (
          <>
        <Card className="border-mira-primary/15 bg-white p-5 print:border-none print:shadow-none">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Mira</p>
              <h2 className="mt-1 text-xl font-bold text-mira-text">Отчёт для врача</h2>
              <p className="mt-1 text-xs text-mira-muted">
                {report.cutoffDate.toLocaleDateString("ru-RU")} — {new Date().toLocaleDateString("ru-RU")}
              </p>
            </div>
            <Badge>{report.entries.length} дней данных</Badge>
          </div>

          <div className="mt-4 rounded-2xl border border-mira-lavender/20 bg-mira-bg p-4">
            <p className="text-sm font-semibold text-mira-text">
              {visibleFocusItems.length > 0 ? "Есть темы, которые стоит обсудить на приёме" : "В выбранном периоде мало повторяющихся тревожных сигналов"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-mira-muted">
              Отчёт показывает наблюдения пользователя и не ставит диагноз. Данные могут быть неполными, если дни не заполнялись.
            </p>
          </div>
        </Card>

        <Card className="p-5 print:hidden">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-mira-primary" />
            <p className="text-sm font-semibold text-mira-text">Краткое резюме</p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MiniStat label="Данные" value={`${report.entries.length}`} note={`за ${selectedPeriod} мес.`} />
            <MiniStat label="Боль" value={`${report.painEntries.length}`} note={`сильная: ${report.strongPainEntries.length}`} />
            <MiniStat label="Месячные" value={`${report.periodEntries.length}`} note={`профиль: ${report.periodLength} дн.`} />
            <MiniStat label="Задержки" value={`${report.delayChecks.length}`} note="разборов" />
          </div>
          {visibleFocusItems.length > 0 && (
            <div className="mt-3 rounded-2xl border border-mira-cycle/15 bg-mira-rose-light/20 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Вынести в разговор</p>
              <p className="mt-1 text-sm text-mira-text">{visibleFocusItems.join(" · ")}</p>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-mira-cycle" />
            <p className="text-sm font-semibold text-mira-text">Главное для врача</p>
          </div>
          <div className="space-y-2">
            {(visibleDoctorHighlights.length ? visibleDoctorHighlights : ["Повторяющихся тревожных сигналов пока мало. Отчёт полезен как история наблюдений."]).slice(0, 6).map((item, index) => (
              <DoctorPoint key={item} index={index + 1} text={item} />
            ))}
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          {includedSections.periodDates && (
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-mira-primary" />
              <p className="text-sm font-semibold text-mira-text">Закономерности из аналитики</p>
            </div>
            <div className="space-y-2">
              {(report.analyticsFindings.length ? report.analyticsFindings : ["Данных пока недостаточно для личных закономерностей."]).slice(0, 6).map(item => (
                <InfoRow key={item} label="Вывод" value={item} />
              ))}
            </div>
          </Card>
          )}

          {includedSections.painSymptoms && (
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-mira-primary" />
              <p className="text-sm font-semibold text-mira-text">Что может влиять на самочувствие</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Вода" value={`${report.care.waterEntries.length}`} note={`мало: ${report.care.lowWaterDays}`} />
              <MiniStat label="Питание" value={`${report.care.mealDays}`} note="дней" />
              <MiniStat label="Ходьба" value={`${report.care.walkingEntries.length}`} note={`активно: ${report.care.walkingGoodDays}`} />
              <MiniStat label="Вес" value={`${report.care.weightEntries.length}`} note={report.care.latestWeight ? `${report.care.latestWeight.weight.toFixed(1)} кг` : "нет"} />
            </div>
          </Card>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {(includedSections.moodEnergy || includedSections.sleep) && (
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-mira-primary" />
              <p className="text-sm font-semibold text-mira-text">Цикл и месячные</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Длина цикла" value={`${report.cycleLength} дн.`} note="по профилю" />
              <MiniStat label="Длительность" value={`${report.periodLength} дн.`} note="по профилю" />
              <MiniStat label="Обильные дни" value={`${report.heavyFlowEntries.length}`} note="heavy / very heavy" />
              <MiniStat label="Даты месячных" value={`${report.periodEntries.length}`} note="дней с отметкой" />
            </div>
            <DatePills dates={report.periodEntries.map(entry => entry.date)} empty="Нет отметок месячных за период" />
          </Card>
          )}

          {includedSections.delays && (
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-mira-cycle" />
              <p className="text-sm font-semibold text-mira-text">Боль и необычные симптомы</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Дней с болью" value={`${report.painEntries.length}`} note="любая боль" />
              <MiniStat label="Сильная боль" value={`${report.strongPainEntries.length}`} note="отмечено strong" />
              <MiniStat label="Необычные" value={`${report.unusualEntries.length}`} note="красные сигналы" />
              <MiniStat label="Нет сил" value={`${report.lowEnergyEntries.length}`} note="низкая энергия" />
            </div>
            {report.unusualEntries.length > 0 && (
              <div className="mt-3 flex items-start gap-2 rounded-2xl border border-mira-cycle/15 bg-mira-rose-light/20 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-mira-cycle" />
                <p className="text-xs leading-relaxed text-mira-text">
                  В отчёте есть дни с сильной болью, очень обильными месячными, задержкой, кровью после секса или сильной слабостью.
                </p>
              </div>
            )}
          </Card>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#A07EC4]" />
              <p className="text-sm font-semibold text-mira-text">Настроение, энергия, сон</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="Настроение" value={`${report.moodEntries.length}`} note="дней" />
              <MiniStat label="Сон хуже" value={`${report.badSleepEntries.length}`} note="дней" />
              <MiniStat label="Энергия ниже" value={`${report.lowEnergyEntries.length}`} note="дней" />
            </div>
            {report.symptomCounts.length > 0 && (
              <div className="mt-3 space-y-2">
                {report.symptomCounts.map(([symptom, count]) => (
                  <div key={symptom} className="flex items-center justify-between rounded-xl bg-mira-bg px-3 py-2">
                    <span className="text-sm text-mira-text">{symptom}</span>
                    <span className="text-xs text-mira-muted">{count} раз</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Pill className="h-4 w-4 text-mira-primary" />
              <p className="text-sm font-semibold text-mira-text">Лекарства и задержки</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Лекарства" value={`${report.medicationEntries.length}`} note="дней с отметкой" />
              <MiniStat label="Задержки" value={`${report.delayChecks.length}`} note="разборов Mira" />
            </div>
            <div className="mt-3 space-y-2">
              {report.medicationEntries.slice(-4).map(entry => (
                <InfoRow key={entry.date} label={formatDate(entry.date)} value={entry.symptomLog?.medications?.join(", ") ?? ""} />
              ))}
              {report.delayChecks.slice(-4).map(item => (
                <InfoRow key={item.delay.id} label={formatDate(item.date)} value={`задержка ${item.delay.delayDays} дн.: ${item.delay.summary}`} />
              ))}
              {report.medicationEntries.length === 0 && report.delayChecks.length === 0 && (
                <p className="rounded-xl bg-mira-bg p-3 text-xs text-mira-muted">Нет отметок лекарств или задержек за выбранный период.</p>
              )}
            </div>
          </Card>
        </div>

        {includedSections.sex && (
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-mira-primary" />
              <p className="text-sm font-semibold text-mira-text">Секс и связанные симптомы</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <MiniStat label="Отметки" value={`${report.intimacyEntries.length}`} note="дней" />
              <MiniStat label="Риск/дискомфорт" value={`${report.intimacyRiskEntries.length}`} note="дней" />
              <MiniStat label="Кровь после" value={`${report.intimacyEntries.filter(entry => entry.intimacy?.bleedingAfter).length}`} note="дней" />
              <MiniStat label="Боль" value={`${report.intimacyEntries.filter(entry => entry.intimacy?.feeling === "pain").length}`} note="дней" />
            </div>
            <div className="mt-3 space-y-2">
              {report.intimacyRiskEntries.slice(-6).map(entry => (
                <InfoRow
                  key={entry.date}
                  label={formatDate(entry.date)}
                  value={[
                    entry.intimacy?.protection ? protectionLabels[entry.intimacy.protection] : null,
                    entry.intimacy?.feeling === "pain" ? "боль" : null,
                    entry.intimacy?.feeling === "discomfort" ? "дискомфорт" : null,
                    entry.intimacy?.bleedingAfter ? "кровь после" : null,
                  ].filter(Boolean).join(", ")}
                />
              ))}
              {report.intimacyRiskEntries.length === 0 && (
                <p className="rounded-xl bg-mira-bg p-3 text-xs text-mira-muted">Нет отметок боли, крови после секса или незащищённого секса за выбранный период.</p>
              )}
            </div>
          </Card>
        )}

        {includedSections.labs && labs.length > 0 && (
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Moon className="h-4 w-4 text-[#7E8EC4]" />
              <p className="text-sm font-semibold text-mira-text">Анализы</p>
            </div>
            <div className="space-y-2">
              {labs.map(lab => {
                const range = getLabRange(lab.testId);
                const evaluation = evaluateLab(lab.testId, lab.value);
                return (
                  <InfoRow
                    key={lab.id}
                    label={range?.name ?? lab.testId}
                    value={`${lab.value} ${lab.unit}, ${formatDate(lab.date)}${evaluation && evaluation.status !== "ok" ? ` · ${evaluation.label}` : ""}`}
                  />
                );
              })}
            </div>
          </Card>
        )}

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-mira-primary" />
            <p className="text-sm font-semibold text-mira-text">Детали по дням</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-mira-lavender/20">
            <div className="grid grid-cols-[72px_54px_1fr] bg-mira-lavender-light/40 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-mira-muted">
              <span>Дата</span>
              <span>ДЦ</span>
              <span>Наблюдения</span>
            </div>
            {report.tableRows.length > 0 ? report.tableRows.map(row => (
              <div key={row.date} className="grid grid-cols-[72px_54px_1fr] border-t border-mira-lavender/15 px-3 py-3 text-xs">
                <span className="font-semibold text-mira-text">{formatDate(row.date)}</span>
                <span className="text-mira-muted">{cycleDayFor(row.date, report.profile) ?? "—"}</span>
                <span className="leading-relaxed text-mira-text">{describeRow(row, includedSections)}</span>
              </div>
            )) : (
              <p className="p-3 text-xs text-mira-muted">Нет детальных записей за выбранный период.</p>
            )}
          </div>
        </Card>

        {includedSections.doctorQuestions && (
        <Card className="border-mira-primary/15 p-5">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-mira-primary" />
            <p className="text-sm font-semibold text-mira-text">Вопросы врачу</p>
          </div>
          <ol className="space-y-2">
            {report.questions.map((question, index) => (
              <li key={question} className="flex items-start gap-2 text-sm text-mira-text">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mira-lavender-light text-[10px] font-bold text-mira-primary">
                  {index + 1}
                </span>
                {question}
              </li>
            ))}
          </ol>
        </Card>
        )}

        <Card className="border-mira-primary/15 bg-mira-lavender-light/20 p-5">
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-mira-primary" />
            <p className="text-sm font-semibold text-mira-text">Как начать разговор</p>
          </div>
          <p className="mb-3 text-xs italic leading-relaxed text-mira-muted">"{doctorScript.intro}"</p>
          {doctorScript.dataPoints.length > 0 && (
            <div className="mb-3 space-y-1 rounded-xl bg-white p-3">
              {doctorScript.dataPoints.map((point, index) => (
                <p key={index} className="text-xs text-mira-text">• {point}</p>
              ))}
            </div>
          )}
        </Card>

        <Card className="border-mira-success/15 bg-[#E0F5E8]/20 p-4">
          <div className="flex items-start gap-2">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-mira-success" />
            <p className="text-xs leading-relaxed text-mira-success">
              Отчёт не является диагнозом и не заменяет консультацию врача. Если есть резкая боль, обморок, очень обильное кровотечение или кровь после секса, лучше обратиться за медицинской помощью.
            </p>
          </div>
        </Card>
          </>
        )}

        <div className="flex gap-3 print:hidden">
          <Button className="flex-1" onClick={handlePrintPdf}>
            <Printer className="h-4 w-4" /> Скачать PDF
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleExportText}>
            <Download className="h-4 w-4" /> Скачать TXT
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleCopyQuestions}>
            <Copy className="h-4 w-4" /> Скопировать вопросы врачу
          </Button>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl bg-mira-bg p-3">
      <p className="text-xs text-mira-muted">{label}</p>
      <p className="mt-1 text-xl font-bold text-mira-text">{value}</p>
      <p className="mt-0.5 text-[10px] text-mira-muted">{note}</p>
    </div>
  );
}

function ReportEmptyState({
  title,
  body,
  onCheckIn,
  onPeriod,
  onProfile,
}: {
  title: string;
  body: string;
  onCheckIn?: () => void;
  onPeriod?: () => void;
  onProfile?: () => void;
}) {
  return (
    <Card className="border-mira-primary/10 bg-white p-6 shadow-[0_12px_32px_rgba(45,38,64,0.05)]">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-mira-lavender-light text-mira-primary">
          <FileText className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-black text-mira-text">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-mira-muted">{body}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {onCheckIn && <Button onClick={onCheckIn}>Добавить состояние</Button>}
            {onPeriod && <Button variant="outline" onClick={onPeriod}>Отметить месячные</Button>}
            {onProfile && <Button onClick={onProfile}>Добавить дату</Button>}
          </div>
        </div>
      </div>
    </Card>
  );
}

function ReportCheckbox({ checked, label, sensitive, onClick }: { checked: boolean; label: string; sensitive?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-11 items-center gap-2 rounded-2xl border px-3 py-2 text-left text-xs font-bold transition active:scale-[0.98] ${
        checked ? "border-mira-primary/35 bg-white text-mira-text" : "border-mira-lavender/20 bg-white/60 text-mira-muted"
      }`}
    >
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
        checked ? "border-mira-primary bg-mira-primary text-white" : "border-mira-lavender/40 bg-white"
      }`}>
        {checked && <CheckMark />}
      </span>
      <span className="min-w-0">
        {label}
        {sensitive && <span className="ml-1 font-semibold text-mira-muted">личное</span>}
      </span>
    </button>
  );
}

function CheckMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path d="M3.5 8.2 6.4 11 12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DoctorPoint({ index, text }: { index: number; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-mira-bg p-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mira-lavender-light text-xs font-bold text-mira-primary">
        {index}
      </span>
      <p className="text-sm leading-relaxed text-mira-text">{text}</p>
    </div>
  );
}

function CareFactor({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl bg-mira-bg p-3">
      <div className="mb-2 flex items-center gap-2 text-mira-primary">
        {icon}
        <p className="text-xs font-bold text-mira-text">{label}</p>
      </div>
      <p className="text-xl font-bold text-mira-text">{value}</p>
      <p className="mt-0.5 text-[10px] text-mira-muted">{note}</p>
    </div>
  );
}

function DatePills({ dates, empty }: { dates: string[]; empty: string }) {
  if (dates.length === 0) {
    return <p className="mt-3 rounded-xl bg-mira-bg p-3 text-xs text-mira-muted">{empty}</p>;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {dates.slice(-10).map(date => (
        <span key={date} className="rounded-full bg-mira-lavender-light px-3 py-1 text-xs font-semibold text-mira-primary">
          {formatDate(date)}
        </span>
      ))}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-mira-bg px-3 py-2">
      <span className="shrink-0 text-xs font-semibold text-mira-text">{label}</span>
      <span className="text-right text-xs leading-relaxed text-mira-muted">{value}</span>
    </div>
  );
}

function describeRow(row: DailyCheckIn, includedSections: Record<ReportSectionId, boolean>) {
  const parts = [
    includedSections.periodDates && row.period ? `месячные: ${flowLabels[row.period.intensity] ?? row.period.intensity}` : null,
    includedSections.painSymptoms && hasPain(row) ? `боль: ${row.pain?.level ?? "есть"} (${row.pain?.kinds.map(kind => painLabels[kind] ?? kind).join(", ")})` : null,
    includedSections.moodEnergy && row.mood ? `настроение: ${moodLabels[row.mood.value] ?? row.mood.value}` : null,
    includedSections.moodEnergy && row.energy ? `энергия: ${energyLabels[row.energy.value] ?? row.energy.value}` : null,
    includedSections.sleep && row.sleep ? `сон: ${sleepLabels[row.sleep.quality] ?? row.sleep.quality}` : null,
    includedSections.painSymptoms && row.symptomLog?.appetite ? `аппетит: ${row.symptomLog.appetite}` : null,
    includedSections.painSymptoms && row.symptomLog?.sweetCraving ? "тяга к сладкому" : null,
    includedSections.moodEnergy && row.symptomLog?.anxiety ? "тревога" : null,
    row.symptomLog?.medications?.length ? `лекарства: ${row.symptomLog.medications.join(", ")}` : null,
    includedSections.delays && row.delayChecks?.length ? `задержка: ${row.delayChecks.map(delay => `${delay.delayDays} дн.`).join(", ")}` : null,
    includedSections.painSymptoms && row.badEpisodes?.length ? `мне плохо: ${row.badEpisodes.map(ep => ep.summary).join("; ")}` : null,
    includedSections.privateNotes && row.note?.text ? `личная заметка: ${row.note.text}` : null,
    includedSections.sex && row.intimacy?.happened ? `секс: ${[
      row.intimacy.protection ? protectionLabels[row.intimacy.protection] : null,
      row.intimacy.feeling === "pain" ? "боль" : null,
      row.intimacy.feeling === "discomfort" ? "дискомфорт" : null,
      row.intimacy.bleedingAfter ? "кровь после" : null,
    ].filter(Boolean).join(", ") || "отмечен"}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join("; ") : "запись без симптомов";
}
