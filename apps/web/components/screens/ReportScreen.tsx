"use client";

import { useEffect, useMemo, useState } from "react";
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
  | "pain"
  | "symptoms"
  | "moodEnergy"
  | "sleep"
  | "labs"
  | "doctorQuestions"
  | "privateNotes"
  | "sex";

const reportSectionLabels: Array<{ id: ReportSectionId; label: string; sensitive?: boolean }> = [
  { id: "periodDates", label: "Даты месячных" },
  { id: "delays", label: "Задержки" },
  { id: "pain", label: "Боль" },
  { id: "symptoms", label: "Симптомы" },
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
  pain: true,
  symptoms: true,
  moodEnergy: true,
  sleep: true,
  labs: false,
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
  const [includedSections, setIncludedSections] = useState<Record<ReportSectionId, boolean>>(() => ({
    ...defaultReportSections,
    sex: data.profile?.reportSexDefault ?? defaultReportSections.sex,
  }));
  const [textExportUrl, setTextExportUrl] = useState<string | null>(null);
  const [textExportName, setTextExportName] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

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
      intimacyRiskEntries.some(checkIn => checkIn.intimacy?.feeling === "pain" || checkIn.intimacy?.bleedingAfter) ? "Есть отметки боли или крови после секса." : null,
    ].filter(Boolean) as string[];

    const analyticsFindings = [
      cycleAnalytics ? cycleAnalytics.insight : null,
      ...correlations.slice(0, 3).map(item => item.body),
      ...phaseCorrelations.slice(0, 2).map(item => item.explanation),
      care.lowWaterDays >= 2 ? `В ${care.lowWaterDays} дня воды было меньше 1 л. Это стоит сравнить со вздутием, слабостью и головной болью.` : null,
    ].filter(Boolean).slice(0, 7) as string[];

    const questions = [
      strongPainEntries.length >= 2 ? "Почему сильная боль повторяется и какие обследования стоит обсудить?" : null,
      heavyFlowEntries.length >= 2 ? "Нормальна ли такая обильность и нужно ли проверить ферритин/гемоглобин?" : null,
      delayChecks.length > 0 ? "Какие причины задержки вероятны в моём случае и когда делать тест?" : null,
      intimacyRiskEntries.some(checkIn => checkIn.intimacy?.feeling === "pain" || checkIn.intimacy?.bleedingAfter) ? "С чем может быть связана боль или кровь после секса?" : null,
      medicationEntries.length > 0 ? "Могут ли лекарства из списка влиять на цикл или симптомы?" : null,
      care.lowWaterDays >= 2 ? "Может ли слабость/головная боль/вздутие усиливаться из-за недостатка воды или других факторов?" : null,
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
      includedSections.pain ? `Боль: ${report.painEntries.length} дней, сильная боль: ${report.strongPainEntries.length} дней` : null,
      includedSections.symptoms ? `Обильность: ${report.heavyFlowEntries.length} дней с обильными/очень обильными отметками` : null,
      includedSections.delays ? `Задержки: ${report.delayChecks.length ? report.delayChecks.map(item => `${item.date}: ${item.delay.delayDays} дн.`).join("; ") : "нет отметок"}` : null,
      includedSections.moodEnergy ? `Настроение отмечено: ${report.moodEntries.length} дней` : null,
      includedSections.sleep ? `Сон ухудшался: ${report.badSleepEntries.length} дней` : null,
      `Лекарства: ${report.medicationEntries.map(entry => `${entry.date}: ${entry.symptomLog?.medications?.join(", ")}`).join("; ") || "нет отметок"}`,
      "",
      "ГЛАВНОЕ ДЛЯ ВРАЧА",
      ...(getVisiblePersonalItems(report.doctorHighlights).length ? getVisiblePersonalItems(report.doctorHighlights).map(item => `— ${item}`) : ["— Повторяющихся тревожных сигналов пока мало"]),
      "",
      "КОНТЕКСТ",
      `— Вода: ${report.care.waterEntries.length} дней с отметками, мало воды: ${report.care.lowWaterDays} дней`,
      "",
      "ЧТО ОБСУДИТЬ",
      ...(getVisiblePersonalItems(report.focusItems).length ? getVisiblePersonalItems(report.focusItems).map(item => `— ${item}`) : ["— Явных повторяющихся сигналов в выбранном периоде мало"]),
      "",
      "ЧАСТЫЕ СИМПТОМЫ",
      ...(includedSections.symptoms
        ? (report.symptomCounts.length ? report.symptomCounts.map(([symptom, count]) => `— ${symptom}: ${count}`) : ["— нет частых симптомов"])
        : ["— скрыто пользователем"]),
      "",
      ...(includedSections.sex
        ? [
          "",
          "СЕКС И СВЯЗАННЫЕ СИМПТОМЫ",
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
          includedSections.pain && hasPain(row) ? `боль: ${row.pain?.level ?? "есть"} (${row.pain?.kinds.map(kind => painLabels[kind] ?? kind).join(", ")})` : null,
          includedSections.moodEnergy && row.mood ? `настроение: ${moodLabels[row.mood.value] ?? row.mood.value}` : null,
          includedSections.moodEnergy && row.energy ? `энергия: ${energyLabels[row.energy.value] ?? row.energy.value}` : null,
          includedSections.sleep && row.sleep ? `сон: ${sleepLabels[row.sleep.quality] ?? row.sleep.quality}` : null,
          row.symptomLog?.medications?.length ? `лекарства: ${row.symptomLog.medications.join(", ")}` : null,
          includedSections.pain && row.badEpisodes?.length ? `мне плохо: ${row.badEpisodes.map(ep => ep.summary).join("; ")}` : null,
          includedSections.delays && row.delayChecks?.length ? `задержка: ${row.delayChecks.map(delay => `${delay.delayDays} дн.`).join(", ")}` : null,
          includedSections.privateNotes && row.note?.text ? `личная заметка: ${row.note.text}` : null,
          includedSections.sex && row.intimacy?.happened ? `секс: ${[
            row.intimacy.protection ? protectionLabels[row.intimacy.protection] : null,
            row.intimacy.feeling === "pain" ? "боль" : null,
            row.intimacy.bleedingAfter ? "кровь после" : null,
          ].filter(Boolean).join(", ")}` : null,
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

  async function handleCopyQuestions() {
    const text = report.questions.map((question, index) => `${index + 1}. ${question}`).join("\n");
    if (!text) {
      setExportNotice("Вопросов врачу пока нет: Mira добавит их, когда появится больше данных.");
      return;
    }

    try {
      await navigator.clipboard?.writeText(text);
      setExportNotice("Вопросы врачу скопированы.");
    } catch {
      setExportNotice("Не удалось скопировать вопросы в этом браузере. Можно скачать TXT или скопировать весь отчёт ниже.");
    }
  }

  function saveTextExportUrl(url: string, fileName: string) {
    setTextExportUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setTextExportName(fileName);
    setExportNotice("Отчёт подготовлен. Если загрузка не появилась в браузере, открой TXT ниже.");
  }

  function getVisiblePersonalItems(items: string[]) {
    return items.filter(item => {
      const text = item.toLowerCase();
      if (!includedSections.sex && (text.includes("секс") || text.includes("контрацеп") || text.includes("кровь после"))) return false;
      if (!includedSections.pain && text.includes("боль")) return false;
      if (!includedSections.symptoms && (text.includes("обильн") || text.includes("кровотеч"))) return false;
      if (!includedSections.delays && text.includes("задерж")) return false;
      if (!includedSections.sleep && text.includes("сон")) return false;
      if (!includedSections.moodEnergy && (text.includes("энерг") || text.includes("слаб"))) return false;
      return true;
    });
  }

  function handleExportText() {
    const blob = new Blob([generateTextReport()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const fileName = `mira-doctor-report-${new Date().toISOString().slice(0, 10)}.txt`;
    saveTextExportUrl(url, fileName);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function handleOpenTextExport() {
    const url = textExportUrl;
    if (!url) return;
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      window.location.href = url;
    }
  }

  function handleCopyFullReport() {
    void navigator.clipboard?.writeText(generateTextReport());
    setExportNotice("Текст отчёта скопирован. Можно вставить его в заметки или документ.");
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
  const selectedSectionsCount = reportSectionLabels.filter(section => includedSections[section.id]).length;

  useEffect(() => {
    return () => {
      if (textExportUrl) URL.revokeObjectURL(textExportUrl);
    };
  }, [textExportUrl]);

  if (!hasCycleData) {
    return (
      <div>
        <ReportTopHeader entriesCount={0} />
        <ReportEmptyState
          title="Mira пока не знает твой цикл"
          body="Добавь дату последних месячных, чтобы получить прогноз и основу для отчёта врачу."
          onProfile={() => navigate("profile")}
          onExportText={handleExportText}
        />
      </div>
    );
  }

  if (reportIsAlmostEmpty) {
    return (
      <div>
        <ReportTopHeader entriesCount={report.entries.length} />
        <ReportEmptyState
          title="Пока отчёт почти пустой"
          body="Добавь месячные, симптомы, боль или заметки — и Mira соберёт факты для приёма."
          onCheckIn={onCheckIn}
          onPeriod={onCheckIn}
          onExportText={handleExportText}
        />
      </div>
    );
  }

  return (
    <div>
      <ReportTopHeader entriesCount={report.entries.length} />

      <Card className="mb-5 rounded-[24px] border-[#2E2826] bg-[#1D1816] p-5 text-[#F5F0ED] print:hidden">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8D817B]">Перед экспортом</p>
            <h2 className="mt-2 text-2xl font-black text-[#F5F0ED]">Отчёт врачу</h2>
          </div>
          <div className="rounded-2xl bg-[#252318] px-4 py-3 text-sm font-black text-[#84E600]">
            {selectedSectionsCount} разделов
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <MiniStat tone="pink" icon={<Calendar className="h-4 w-4" />} label="Дней" value={`${report.entries.length}`} note={`${selectedPeriod} мес.`} />
          <MiniStat tone="red" icon={<Activity className="h-4 w-4" />} label="Боль" value={`${report.painEntries.length}`} note={`сильная: ${report.strongPainEntries.length}`} />
          <MiniStat tone="yellow" icon={<Moon className="h-4 w-4" />} label="Сон" value={`${report.badSleepEntries.length}`} note="хуже" />
          <MiniStat tone="green" icon={<Droplets className="h-4 w-4" />} label="Вода" value={`${report.care.waterEntries.length}`} note={`мало: ${report.care.lowWaterDays}`} />
        </div>

        <div className="mt-5 rounded-[20px] border border-[#342D2A] bg-[#251F1D] p-4">
          <p className="text-sm font-black text-[#F5F0ED]">Период</p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {periods.map(period => (
              <button
                key={period.months}
                onClick={() => setSelectedPeriod(period.months)}
                className={`rounded-2xl px-2 py-3 text-xs font-black transition ${
                  selectedPeriod === period.months ? "bg-[#84E600] text-[#11100F]" : "bg-[#1D1816] text-[#8D817B]"
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-[20px] border border-[#342D2A] bg-[#251F1D] p-4">
          <p className="text-sm font-black text-[#F5F0ED]">Что включить</p>
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

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Button type="button" variant="outline" onClick={handleExportText} className="rounded-[18px] border-[#342D2A] bg-[#251F1D] font-black text-[#F5F0ED] hover:bg-[#2A2523]">
            <Download className="h-4 w-4" /> Скачать TXT
          </Button>
          <Button type="button" variant="outline" onClick={handleCopyQuestions} className="rounded-[18px] border-[#342D2A] bg-[#251F1D] font-black text-[#F5F0ED] hover:bg-[#2A2523]">
            <Copy className="h-4 w-4" /> Скопировать вопросы
          </Button>
        </div>
        <ExportFallbackPanel
          notice={exportNotice}
          fileName={textExportName}
          onOpen={handleOpenTextExport}
          onCopy={handleCopyFullReport}
        />
      </Card>

      <Card className="mb-5 rounded-[24px] border-[#2E2826] bg-[#1D1816] p-5 text-[#F5F0ED] print:hidden">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8D817B]">Главное</p>
        <div className="mt-4 space-y-2">
          {(visibleDoctorHighlights.length ? visibleDoctorHighlights : ["Повторяющихся тревожных сигналов пока мало."]).slice(0, 4).map((item, index) => (
            <DoctorPoint key={item} index={index + 1} text={item} />
          ))}
        </div>
      </Card>

      <Card className="mb-5 rounded-[24px] border-[#2E2826] bg-[#1D1816] p-5 text-[#F5F0ED] print:hidden">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8D817B]">Факты</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {includedSections.periodDates && <InfoRow label="Месячные" value={`${report.periodEntries.length} дней, цикл ${report.cycleLength} дн.`} />}
          {includedSections.pain && <InfoRow label="Боль" value={`${report.painEntries.length} дней, сильная: ${report.strongPainEntries.length}`} />}
          {includedSections.symptoms && <InfoRow label="Обильность" value={`${report.heavyFlowEntries.length} обильных дней`} />}
          {includedSections.moodEnergy && <InfoRow label="Энергия" value={`${report.lowEnergyEntries.length} дней низкой энергии`} />}
          {includedSections.sleep && <InfoRow label="Сон" value={`${report.badSleepEntries.length} дней хуже`} />}
          {includedSections.delays && <InfoRow label="Задержки" value={`${report.delayChecks.length}`} />}
          <InfoRow label="Вода" value={`${report.care.waterEntries.length} дней, мало: ${report.care.lowWaterDays}`} />
          <InfoRow label="Питание" value={`${report.care.mealDays} дней`} />
        </div>
      </Card>

      <Card className="mb-5 rounded-[24px] border-[#2E2826] bg-[#1D1816] p-5 text-[#F5F0ED] print:hidden">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8D817B]">Вопросы врачу</p>
        <div className="mt-4 space-y-2">
          {(includedSections.doctorQuestions ? report.questions : ["Вопросы скрыты"]).slice(0, 4).map((question, index) => (
            <DoctorPoint key={question} index={index + 1} text={question} />
          ))}
        </div>
      </Card>

      <div className="hidden print:block">
        <pre className="whitespace-pre-wrap text-sm">{generateTextReport()}</pre>
      </div>
    </div>
  );

  return (
    <div>
      <ReportTopHeader entriesCount={report.entries.length} />

      <Card className="mb-5 rounded-[24px] border-[#2E2826] bg-[#1D1816] p-5 print:hidden">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8B6FB3]">Перед экспортом</p>
            <h2 className="mt-1 text-lg font-bold text-[#1A1A1A]">
              Выбери данные для отчёта врачу
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-[#8E8E93]">
              Ты сама контролируешь, что попадёт в TXT. Личные заметки и секс выключены по умолчанию.
            </p>
          </div>
          <div className="rounded-2xl bg-[#F4F0FA] px-4 py-3 text-sm font-black text-[#8B6FB3]">
            {selectedSectionsCount} из {reportSectionLabels.length} разделов
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <MiniStat tone="pink" icon={<Calendar className="h-4 w-4" />} label="Дней с данными" value={`${report.entries.length}`} note={`за ${selectedPeriod} мес.`} />
          <MiniStat tone="red" icon={<Activity className="h-4 w-4" />} label="Симптомы" value={`${report.painEntries.length + report.unusualEntries.length}`} note="боль и сигналы" />
          <MiniStat tone="green" icon={<FlaskConical className="h-4 w-4" />} label="Анализы" value={`${labs.length}`} note={`вне реф.: ${abnormalLabs.length}`} />
          <MiniStat tone="yellow" icon={<MessageSquare className="h-4 w-4" />} label="Вопросы" value={`${report.questions.length}`} note="для приёма" />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-[#DDD2EA]/20 bg-[#FAF8F5] p-3">
            <p className="text-sm font-medium text-[#1A1A1A]">Период отчёта</p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {periods.map(period => (
                <button
                  key={period.months}
                  onClick={() => setSelectedPeriod(period.months)}
                  className={`rounded-xl px-2 py-2.5 text-xs font-semibold transition ${
                    selectedPeriod === period.months ? "bg-[#8B6FB3] text-white shadow-glow" : "bg-white text-[#8E8E93]"
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#DDD2EA]/20 bg-[#FAF8F5] p-3">
            <p className="text-sm font-medium text-[#1A1A1A]">Данные в отчёте</p>
            <p className="mt-1 text-[11px] leading-relaxed text-[#8E8E93]">
              Секс и личные заметки считаются чувствительными и включаются только вручную.
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
        <div className="mt-4 rounded-[24px] border border-[#8B6FB3]/15 bg-[#F4F0FA] p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8B6FB3]">Экспорт выбранных данных</p>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-[#8E8E93]">
                Проверь приватность, затем скачай файл или скопируй вопросы врачу.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={handleExportText}>
                <Download className="h-4 w-4" /> Скачать TXT
              </Button>
              <Button type="button" variant="outline" onClick={handleCopyQuestions}>
                <Copy className="h-4 w-4" /> Скопировать вопросы
              </Button>
            </div>
          </div>
          <ExportFallbackPanel
            notice={exportNotice}
            fileName={textExportName}
            onOpen={handleOpenTextExport}
            onCopy={handleCopyFullReport}
          />
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {[
            ["Зачем", "Не вспоминать симптомы на приёме по памяти."],
            ["Что сделать", "Выбрать период, проверить приватность и скачать TXT."],
            ["Что получишь", "Факты, даты, повторы, анализы и вопросы врачу."],
          ].map(([label, text]) => (
            <div key={label} className="rounded-2xl bg-[#FAF8F5] px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E93]">{label}</p>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-[#1A1A1A]">{text}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mb-5 border-2 border-[#FF6B6B]/40 bg-[#FFF0F0] p-5 print:hidden">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF6B6B] text-white shadow-[0_4px_14px_rgba(255,107,107,0.35)]">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#F25353]">Срочно</p>
            <p className="text-sm font-black text-[#1A1A1A]">Когда лучше обратиться за помощью срочно</p>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {urgentHelpItems.map(item => (
            <div key={item} className="flex items-start gap-2 rounded-2xl border border-[#FF6B6B]/20 bg-white px-3 py-2 text-sm font-semibold leading-relaxed text-[#1A1A1A]">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B6B]" />
              {item}
            </div>
          ))}
        </div>
      </Card>

      <Card className="mb-5 border-[#8B6FB3]/15 p-5 print:hidden">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[#FF6B6B]" />
          <p className="text-sm font-semibold text-[#1A1A1A]">Главное для врача</p>
        </div>
        <div className="space-y-2">
          {(visibleDoctorHighlights.length ? visibleDoctorHighlights : ["Повторяющихся тревожных сигналов пока мало. Отчёт всё равно полезен как история наблюдений."]).slice(0, 5).map((item, index) => (
            <DoctorPoint key={item} index={index + 1} text={item} />
          ))}
        </div>
      </Card>

      <Card className="mb-5 p-5 print:hidden">
        <div className="mb-4 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-[#8B6FB3]" />
          <p className="text-sm font-semibold text-[#1A1A1A]">Что попадёт в отчёт</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {includedSections.periodDates && <InfoRow label="Цикл" value={`${report.periodEntries.length} дней месячных, цикл ${report.cycleLength} дн.`} />}
          {includedSections.pain && <InfoRow label="Боль" value={`${report.painEntries.length} дней с болью, сильная: ${report.strongPainEntries.length}`} />}
          {includedSections.symptoms && <InfoRow label="Симптомы" value={`${report.unusualEntries.length} необычных сигналов, обильные дни: ${report.heavyFlowEntries.length}`} />}
          {includedSections.moodEnergy && <InfoRow label="Состояние" value={`${report.moodEntries.length} настроений, ${report.lowEnergyEntries.length} дней низкой энергии`} />}
          {includedSections.delays && <InfoRow label="Лекарства и задержки" value={`${report.medicationEntries.length} лекарств, ${report.delayChecks.length} разборов задержки`} />}
          <InfoRow label="Забота" value={`${report.care.waterEntries.length} воды, ${report.care.walkingEntries.length} ходьбы, ${report.care.weightEntries.length} веса`} />
          {includedSections.labs && <InfoRow label="Анализы" value={`${labs.length} результатов, вне референса: ${abnormalLabs.length}`} />}
          <InfoRow label="Закономерности" value={`${report.analyticsFindings.length} выводов из аналитики`} />
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#34C759]/15 bg-[#E0F5E8]/25 p-3">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[#34C759]" />
          <p className="text-xs leading-relaxed text-[#8E8E93]">
            Это предварительный отчёт для тебя. Личные заметки, секс и контрацепция скрыты по умолчанию и попадут в файл только после твоего выбора.
          </p>
        </div>
      </Card>

      <Card className="mb-5 border-[#8B6FB3]/15 p-5 print:hidden">
        <div className="mb-4 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#8B6FB3]" />
          <p className="text-sm font-semibold text-[#1A1A1A]">На приёме сказать главное</p>
        </div>
        <p className="rounded-2xl bg-[#F4F0FA]/25 p-3 text-sm italic leading-relaxed text-[#1A1A1A]">"{doctorScript.intro}"</p>
        {visibleFocusItems.length > 0 && (
          <div className="mt-3 rounded-2xl border border-[#FF6B6B]/15 bg-[#F4F0FA]/20 p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E93]">Не забыть обсудить</p>
            <p className="mt-1 text-sm leading-relaxed text-[#1A1A1A]">{visibleFocusItems.join(" · ")}</p>
          </div>
        )}
      </Card>

      <Card className="mb-5 p-5 print:hidden">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#8B6FB3]" />
          <p className="text-sm font-semibold text-[#1A1A1A]">Закономерности из аналитики</p>
        </div>
        <div className="space-y-2">
          {(report.analyticsFindings.length ? report.analyticsFindings : ["Mira пока собирает данные. После нескольких отметок здесь появятся личные закономерности."]).slice(0, 6).map(item => (
            <InfoRow key={item} label="Вывод" value={item} />
          ))}
        </div>
      </Card>

      <Card className="mb-5 p-5 print:hidden">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#8B6FB3]" />
          <p className="text-sm font-semibold text-[#1A1A1A]">Что может влиять на самочувствие</p>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          <CareFactor toneIndex={0} icon={<Droplets className="h-4 w-4" />} label="Вода" value={`${report.care.waterEntries.length}`} note={`мало: ${report.care.lowWaterDays}`} />
          <CareFactor toneIndex={1} icon={<Sparkles className="h-4 w-4" />} label="Питание" value={`${report.care.mealDays}`} note="дней" />
          <CareFactor toneIndex={2} icon={<Footprints className="h-4 w-4" />} label="Ходьба" value={`${report.care.walkingEntries.length}`} note={`активно: ${report.care.walkingGoodDays}`} />
          <CareFactor toneIndex={4} icon={<Activity className="h-4 w-4" />} label="Тренировки" value={`${report.care.workouts.length}`} note={`выполнено: ${report.care.completedWorkouts}`} />
          <CareFactor toneIndex={1} icon={<Scale className="h-4 w-4" />} label="Вес" value={`${report.care.weightEntries.length}`} note={report.care.latestWeight ? `${report.care.latestWeight.weight.toFixed(1)} кг` : "нет"} />
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-[#8E8E93]">
          Эти данные не ставят диагноз, но дают врачу контекст: нагрузка, вода, вес и питание рядом с симптомами.
        </p>
      </Card>

      {includedSections.labs && (
      <Card className="mb-5 p-5 print:hidden">
        <div className="mb-4 flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-[#8B6FB3]" />
          <p className="text-sm font-semibold text-[#1A1A1A]">Анализы в отчёте</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <MiniStat tone="pink" icon={<FlaskConical className="h-4 w-4" />} label="Сохранено" value={`${labs.length}`} note="результатов" />
          <MiniStat tone="red" icon={<AlertTriangle className="h-4 w-4" />} label="Вне референса" value={`${abnormalLabs.length}`} note="обсудить с врачом" />
          <MiniStat tone="green" icon={<Shield className="h-4 w-4" />} label="Для врача" value={labs.length > 0 ? "есть" : "нет"} note="факты без диагноза" />
        </div>
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#DDD2EA]/20 bg-[#FAF8F5] p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-[#8E8E93]">
            Добавлять и смотреть все результаты удобнее на отдельной странице. Врач увидит их в полном отчёте.
          </p>
          <Button variant="outline" onClick={() => navigate("labs")}>
            <FlaskConical className="h-4 w-4" /> Открыть анализы
          </Button>
        </div>
      </Card>
      )}

      <div className="space-y-5 print:space-y-3">
        {showFullReport && (
          <>
        <Card className="border-[#8B6FB3]/15 bg-white p-5 print:border-none print:shadow-none">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E93]">Mira</p>
              <h2 className="mt-1 text-xl font-bold text-[#1A1A1A]">Отчёт для врача</h2>
              <p className="mt-1 text-xs text-[#8E8E93]">
                {report.cutoffDate.toLocaleDateString("ru-RU")} — {new Date().toLocaleDateString("ru-RU")}
              </p>
            </div>
            <Badge>{report.entries.length} дней данных</Badge>
          </div>

          <div className="mt-4 rounded-2xl border border-[#DDD2EA]/20 bg-[#FAF8F5] p-4">
            <p className="text-sm font-semibold text-[#1A1A1A]">
              {visibleFocusItems.length > 0 ? "Есть темы, которые стоит обсудить на приёме" : "В выбранном периоде мало повторяющихся тревожных сигналов"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#8E8E93]">
              Отчёт показывает наблюдения пользователя и не ставит диагноз. Данные могут быть неполными, если дни не заполнялись.
            </p>
          </div>
        </Card>

        <Card className="p-5 print:hidden">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-[#8B6FB3]" />
            <p className="text-sm font-semibold text-[#1A1A1A]">Краткое резюме</p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MiniStat tone="pink" icon={<Calendar className="h-4 w-4" />} label="Данные" value={`${report.entries.length}`} note={`за ${selectedPeriod} мес.`} />
            <MiniStat tone="red" icon={<Activity className="h-4 w-4" />} label="Боль" value={`${report.painEntries.length}`} note={`сильная: ${report.strongPainEntries.length}`} />
            <MiniStat tone="green" icon={<Droplets className="h-4 w-4" />} label="Месячные" value={`${report.periodEntries.length}`} note={`профиль: ${report.periodLength} дн.`} />
            <MiniStat tone="yellow" icon={<AlertTriangle className="h-4 w-4" />} label="Задержки" value={`${report.delayChecks.length}`} note="разборов" />
          </div>
          {visibleFocusItems.length > 0 && (
            <div className="mt-3 rounded-2xl border border-[#FF6B6B]/15 bg-[#F4F0FA]/20 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E93]">Вынести в разговор</p>
              <p className="mt-1 text-sm text-[#1A1A1A]">{visibleFocusItems.join(" · ")}</p>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#FF6B6B]" />
            <p className="text-sm font-semibold text-[#1A1A1A]">Главное для врача</p>
          </div>
          <div className="space-y-2">
            {(visibleDoctorHighlights.length ? visibleDoctorHighlights : ["Повторяющихся тревожных сигналов пока мало. Отчёт полезен как история наблюдений."]).slice(0, 6).map((item, index) => (
              <DoctorPoint key={item} index={index + 1} text={item} />
            ))}
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          {report.analyticsFindings.length > 0 && (
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#8B6FB3]" />
              <p className="text-sm font-semibold text-[#1A1A1A]">Закономерности из аналитики</p>
            </div>
            <div className="space-y-2">
              {(report.analyticsFindings.length ? report.analyticsFindings : ["Данных пока недостаточно для личных закономерностей."]).slice(0, 6).map(item => (
                <InfoRow key={item} label="Вывод" value={item} />
              ))}
            </div>
          </Card>
          )}

          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#8B6FB3]" />
              <p className="text-sm font-semibold text-[#1A1A1A]">Что может влиять на самочувствие</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat tone="pink" icon={<Droplets className="h-4 w-4" />} label="Вода" value={`${report.care.waterEntries.length}`} note={`мало: ${report.care.lowWaterDays}`} />
              <MiniStat tone="green" icon={<Sparkles className="h-4 w-4" />} label="Питание" value={`${report.care.mealDays}`} note="дней" />
              <MiniStat tone="yellow" icon={<Footprints className="h-4 w-4" />} label="Ходьба" value={`${report.care.walkingEntries.length}`} note={`активно: ${report.care.walkingGoodDays}`} />
              <MiniStat tone="neutral" icon={<Scale className="h-4 w-4" />} label="Вес" value={`${report.care.weightEntries.length}`} note={report.care.latestWeight ? `${report.care.latestWeight.weight.toFixed(1)} кг` : "нет"} />
            </div>
          </Card>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {includedSections.periodDates && (
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#8B6FB3]" />
              <p className="text-sm font-semibold text-[#1A1A1A]">Цикл и месячные</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat tone="pink" icon={<Calendar className="h-4 w-4" />} label="Длина цикла" value={`${report.cycleLength} дн.`} note="по профилю" />
              <MiniStat tone="neutral" icon={<Droplets className="h-4 w-4" />} label="Длительность" value={`${report.periodLength} дн.`} note="по профилю" />
              <MiniStat tone="red" icon={<AlertTriangle className="h-4 w-4" />} label="Обильные дни" value={`${report.heavyFlowEntries.length}`} note="heavy / very heavy" />
              <MiniStat tone="green" icon={<Calendar className="h-4 w-4" />} label="Даты месячных" value={`${report.periodEntries.length}`} note="дней с отметкой" />
            </div>
            <DatePills dates={report.periodEntries.map(entry => entry.date)} empty="Нет отметок месячных за период" />
          </Card>
          )}

          {(includedSections.pain || includedSections.symptoms) && (
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#FF6B6B]" />
              <p className="text-sm font-semibold text-[#1A1A1A]">Боль и необычные симптомы</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {includedSections.pain && <MiniStat tone="yellow" icon={<Activity className="h-4 w-4" />} label="Дней с болью" value={`${report.painEntries.length}`} note="любая боль" />}
              {includedSections.pain && <MiniStat tone="red" icon={<AlertTriangle className="h-4 w-4" />} label="Сильная боль" value={`${report.strongPainEntries.length}`} note="отмечено strong" />}
              {includedSections.symptoms && <MiniStat tone="red" icon={<AlertTriangle className="h-4 w-4" />} label="Необычные" value={`${report.unusualEntries.length}`} note="красные сигналы" />}
              {includedSections.moodEnergy && <MiniStat tone="neutral" icon={<Moon className="h-4 w-4" />} label="Нет сил" value={`${report.lowEnergyEntries.length}`} note="низкая энергия" />}
            </div>
            {includedSections.symptoms && report.unusualEntries.length > 0 && (
              <div className="mt-3 flex items-start gap-2 rounded-2xl border border-[#FF6B6B]/15 bg-[#F4F0FA]/20 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF6B6B]" />
                <p className="text-xs leading-relaxed text-[#1A1A1A]">
                  В отчёте есть дни с сильной болью, очень обильными месячными, задержкой, кровью после секса или сильной слабостью.
                </p>
              </div>
            )}
          </Card>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {(includedSections.moodEnergy || includedSections.sleep || includedSections.symptoms) && (
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#A07EC4]" />
              <p className="text-sm font-semibold text-[#1A1A1A]">Настроение, энергия, сон</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {includedSections.moodEnergy && <MiniStat tone="pink" icon={<Sparkles className="h-4 w-4" />} label="Настроение" value={`${report.moodEntries.length}`} note="дней" />}
              {includedSections.sleep && <MiniStat tone="neutral" icon={<Moon className="h-4 w-4" />} label="Сон хуже" value={`${report.badSleepEntries.length}`} note="дней" />}
              {includedSections.moodEnergy && <MiniStat tone="yellow" icon={<Activity className="h-4 w-4" />} label="Энергия ниже" value={`${report.lowEnergyEntries.length}`} note="дней" />}
            </div>
            {includedSections.symptoms && report.symptomCounts.length > 0 && (
              <div className="mt-3 space-y-2">
                {report.symptomCounts.map(([symptom, count]) => (
                  <div key={symptom} className="flex items-center justify-between rounded-xl bg-[#FAF8F5] px-3 py-2">
                    <span className="text-sm text-[#1A1A1A]">{symptom}</span>
                    <span className="text-xs text-[#8E8E93]">{count} раз</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
          )}

          {includedSections.delays && (
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Pill className="h-4 w-4 text-[#8B6FB3]" />
              <p className="text-sm font-semibold text-[#1A1A1A]">Лекарства и задержки</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat tone="pink" icon={<Pill className="h-4 w-4" />} label="Лекарства" value={`${report.medicationEntries.length}`} note="дней с отметкой" />
              <MiniStat tone="yellow" icon={<AlertTriangle className="h-4 w-4" />} label="Задержки" value={`${report.delayChecks.length}`} note="разборов Mira" />
            </div>
            <div className="mt-3 space-y-2">
              {report.medicationEntries.slice(-4).map(entry => (
                <InfoRow key={entry.date} label={formatDate(entry.date)} value={entry.symptomLog?.medications?.join(", ") ?? ""} />
              ))}
              {report.delayChecks.slice(-4).map(item => (
                <InfoRow key={item.delay.id} label={formatDate(item.date)} value={`задержка ${item.delay.delayDays} дн.: ${item.delay.summary}`} />
              ))}
              {report.medicationEntries.length === 0 && report.delayChecks.length === 0 && (
                <p className="rounded-xl bg-[#FAF8F5] p-3 text-xs text-[#8E8E93]">Нет отметок лекарств или задержек за выбранный период.</p>
              )}
            </div>
          </Card>
          )}
        </div>

        {includedSections.sex && (
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-[#8B6FB3]" />
              <p className="text-sm font-semibold text-[#1A1A1A]">Секс и связанные симптомы</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <MiniStat tone="pink" icon={<HeartHandshake className="h-4 w-4" />} label="Отметки" value={`${report.intimacyEntries.length}`} note="дней" />
              <MiniStat tone="yellow" icon={<AlertTriangle className="h-4 w-4" />} label="Риск/дискомфорт" value={`${report.intimacyRiskEntries.length}`} note="дней" />
              <MiniStat tone="red" icon={<Droplets className="h-4 w-4" />} label="Кровь после" value={`${report.intimacyEntries.filter(entry => entry.intimacy?.bleedingAfter).length}`} note="дней" />
              <MiniStat tone="red" icon={<AlertTriangle className="h-4 w-4" />} label="Боль" value={`${report.intimacyEntries.filter(entry => entry.intimacy?.feeling === "pain").length}`} note="дней" />
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
                <p className="rounded-xl bg-[#FAF8F5] p-3 text-xs text-[#8E8E93]">Нет отметок боли, крови после секса или незащищённого секса за выбранный период.</p>
              )}
            </div>
          </Card>
        )}

        {includedSections.labs && labs.length > 0 && (
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Moon className="h-4 w-4 text-[#7E8EC4]" />
              <p className="text-sm font-semibold text-[#1A1A1A]">Анализы</p>
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
            <FileText className="h-4 w-4 text-[#8B6FB3]" />
            <p className="text-sm font-semibold text-[#1A1A1A]">Детали по дням</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#DDD2EA]/20">
            <div className="grid grid-cols-[72px_54px_1fr] bg-[#F4F0FA]/40 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#8E8E93]">
              <span>Дата</span>
              <span>ДЦ</span>
              <span>Наблюдения</span>
            </div>
            {report.tableRows.length > 0 ? report.tableRows.map(row => (
              <div key={row.date} className="grid grid-cols-[72px_54px_1fr] border-t border-[#DDD2EA]/15 px-3 py-3 text-xs">
                <span className="font-semibold text-[#1A1A1A]">{formatDate(row.date)}</span>
                <span className="text-[#8E8E93]">{cycleDayFor(row.date, report.profile) ?? "—"}</span>
                <span className="leading-relaxed text-[#1A1A1A]">{describeRow(row, includedSections)}</span>
              </div>
            )) : (
              <p className="p-3 text-xs text-[#8E8E93]">Нет детальных записей за выбранный период.</p>
            )}
          </div>
        </Card>

        {includedSections.doctorQuestions && (
        <Card className="border-[#8B6FB3]/15 p-5">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#8B6FB3]" />
            <p className="text-sm font-semibold text-[#1A1A1A]">Вопросы врачу</p>
          </div>
          <ol className="space-y-2">
            {report.questions.map((question, index) => (
              <li key={question} className="flex items-start gap-2 text-sm text-[#1A1A1A]">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F4F0FA] text-[10px] font-bold text-[#8B6FB3]">
                  {index + 1}
                </span>
                {question}
              </li>
            ))}
          </ol>
        </Card>
        )}

        <Card className="border-[#8B6FB3]/15 bg-[#F4F0FA]/20 p-5">
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#8B6FB3]" />
            <p className="text-sm font-semibold text-[#1A1A1A]">Как начать разговор</p>
          </div>
          <p className="mb-3 text-xs italic leading-relaxed text-[#8E8E93]">"{doctorScript.intro}"</p>
          {doctorScript.dataPoints.length > 0 && (
            <div className="mb-3 space-y-1 rounded-xl bg-white p-3">
              {doctorScript.dataPoints.map((point, index) => (
                <p key={index} className="text-xs text-[#1A1A1A]">• {point}</p>
              ))}
            </div>
          )}
        </Card>

        <Card className="border-[#34C759]/15 bg-[#E0F5E8]/20 p-4">
          <div className="flex items-start gap-2">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[#34C759]" />
            <p className="text-xs leading-relaxed text-[#34C759]">
              Отчёт не является диагнозом и не заменяет консультацию врача. Если есть резкая боль, обморок, очень обильное кровотечение или кровь после секса, лучше обратиться за медицинской помощью.
            </p>
          </div>
        </Card>
          </>
        )}

        <div className="flex gap-3 print:hidden">
          <Button type="button" variant="outline" className="flex-1" onClick={handleExportText}>
            <Download className="h-4 w-4" /> Скачать TXT
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={handleCopyQuestions}>
            <Copy className="h-4 w-4" /> Скопировать вопросы врачу
          </Button>
        </div>
        <ExportFallbackPanel
          notice={exportNotice}
          fileName={textExportName}
          onOpen={handleOpenTextExport}
          onCopy={handleCopyFullReport}
        />
      </div>
    </div>
  );
}

function ExportFallbackPanel({
  notice,
  fileName,
  onOpen,
  onCopy,
}: {
  notice: string | null;
  fileName: string | null;
  onOpen: () => void;
  onCopy: () => void;
}) {
  if (!notice) return null;

  return (
    <div className="mt-3 rounded-2xl border border-[#8B6FB3]/20 bg-white/85 p-3 text-[#1A1A1A] print:hidden">
      <div className="flex items-start gap-2">
        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#8B6FB3]" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black">{notice}</p>
          {fileName && <p className="mt-1 break-all text-[11px] font-semibold text-[#8E8E93]">{fileName}</p>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={onOpen}>
          <FileText className="h-4 w-4" /> Открыть TXT
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCopy}>
          <Copy className="h-4 w-4" /> Скопировать отчёт
        </Button>
      </div>
    </div>
  );
}

const tileTones = {
  pink: { bg: "#F4F0FA", text: "#8B6FB3", icon: "#8B6FB3" },
  green: { bg: "#EAFBF0", text: "#1A1A1A", icon: "#34C759" },
  red: { bg: "#FFF0F0", text: "#1A1A1A", icon: "#FF6B6B" },
  yellow: { bg: "#FFF7E5", text: "#1A1A1A", icon: "#B97900" },
  neutral: { bg: "#FAF8F5", text: "#1A1A1A", icon: "#8E8E93" },
} as const;

type TileTone = keyof typeof tileTones;

function ReportTopHeader({ entriesCount }: { entriesCount: number }) {
  return (
    <div className="mb-6 print:hidden">
      <div className="mb-5 flex items-center justify-between border-b border-[#2E2826] pb-4">
        <h1 className="mira-app-title text-[34px] font-black leading-none tracking-tight text-[#B3FF6A]">Mira</h1>
        <span className="rounded-full border border-[#404A35] bg-[#1D1816] px-3 py-1.5 text-xs font-black text-[#B3FF6A]">
          {entriesCount} дней
        </span>
      </div>
      <section className="rounded-[24px] border border-[#2E2826] bg-[#1D1816] p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8D817B]">Отчёт для врача</p>
        <h2 className="mt-2 text-[30px] font-black leading-tight text-[#F5F0ED]">Выбери, что показать врачу</h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-[#B7AAA4]">
          Факты, даты и повторения без лишнего. Секс и личные заметки выключены по умолчанию.
        </p>
      </section>
    </div>
  );
}

function MiniStat({
  label,
  value,
  note,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  note: string;
  icon?: React.ReactNode;
  tone?: TileTone;
}) {
  const colors = tileTones[tone];
  return (
    <div
      className="rounded-[20px] p-3.5 shadow-[0_2px_10px_rgba(45,38,64,0.04)]"
      style={{ backgroundColor: colors.bg }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: colors.icon }}>
          {label}
        </p>
        {icon && (
          <span className="shrink-0" style={{ color: colors.icon }}>
            {icon}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-2xl font-black leading-none" style={{ color: colors.text }}>
        {value}
      </p>
      <p className="mt-1 text-[10px] font-semibold text-[#8E8E93]">{note}</p>
    </div>
  );
}

function ReportEmptyState({
  title,
  body,
  onCheckIn,
  onPeriod,
  onProfile,
  onExportText,
}: {
  title: string;
  body: string;
  onCheckIn?: () => void;
  onPeriod?: () => void;
  onProfile?: () => void;
  onExportText?: () => void;
}) {
  return (
    <Card className="border-[#2E2826] bg-[#1D1816] p-6 text-[#F5F0ED] shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2A2523] text-[#F5F0ED]">
          <FileText className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-black text-[#F5F0ED]">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#B7AAA4]">{body}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {onCheckIn && <Button className="bg-[#8B6FB3] text-white" onClick={onCheckIn}>Добавить состояние</Button>}
            {onPeriod && <Button className="border-[#F5F0ED] text-[#F5F0ED]" variant="outline" onClick={onPeriod}>Отметить месячные</Button>}
            {onProfile && <Button className="bg-[#8B6FB3] text-white" onClick={onProfile}>Добавить дату</Button>}
          </div>
          {onExportText && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button type="button" className="border-[#F5F0ED] text-[#F5F0ED]" variant="outline" onClick={onExportText}>
                <Download className="h-4 w-4" /> Скачать TXT
              </Button>
            </div>
          )}
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
        checked ? "border-[#8B6FB3]/35 bg-white text-[#1A1A1A]" : "border-[#DDD2EA]/20 bg-white/60 text-[#8E8E93]"
      }`}
    >
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
        checked ? "border-[#8B6FB3] bg-[#8B6FB3] text-white" : "border-[#DDD2EA]/40 bg-white"
      }`}>
        {checked && <CheckMark />}
      </span>
      <span className="min-w-0">
        {label}
        {sensitive && <span className="ml-1 font-semibold text-[#8E8E93]">личное</span>}
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
    <div className="flex items-start gap-3 rounded-2xl bg-[#FFF0F0] p-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF6B6B] text-xs font-black text-white">
        {index}
      </span>
      <p className="text-sm font-semibold leading-relaxed text-[#1A1A1A]">{text}</p>
    </div>
  );
}

const careFactorTones: TileTone[] = ["pink", "green", "yellow", "red", "neutral"];

function CareFactor({
  icon,
  label,
  value,
  note,
  toneIndex = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  toneIndex?: number;
}) {
  const colors = tileTones[careFactorTones[toneIndex % careFactorTones.length]];
  return (
    <div
      className="rounded-[20px] p-3.5 shadow-[0_2px_10px_rgba(45,38,64,0.04)]"
      style={{ backgroundColor: colors.bg }}
    >
      <div className="mb-2 flex items-center gap-2" style={{ color: colors.icon }}>
        {icon}
        <p className="text-xs font-black text-[#1A1A1A]">{label}</p>
      </div>
      <p className="text-2xl font-black leading-none" style={{ color: colors.text }}>{value}</p>
      <p className="mt-1 text-[10px] font-semibold text-[#8E8E93]">{note}</p>
    </div>
  );
}

function DatePills({ dates, empty }: { dates: string[]; empty: string }) {
  if (dates.length === 0) {
    return <p className="mt-3 rounded-xl bg-[#FAF8F5] p-3 text-xs text-[#8E8E93]">{empty}</p>;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {dates.slice(-10).map(date => (
        <span key={date} className="rounded-full bg-[#F4F0FA] px-3 py-1 text-xs font-semibold text-[#8B6FB3]">
          {formatDate(date)}
        </span>
      ))}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-[#FAF8F5] px-3 py-2">
      <span className="shrink-0 text-xs font-semibold text-[#1A1A1A]">{label}</span>
      <span className="text-right text-xs leading-relaxed text-[#8E8E93]">{value}</span>
    </div>
  );
}

function describeRow(row: DailyCheckIn, includedSections: Record<ReportSectionId, boolean>) {
  const parts = [
    includedSections.periodDates && row.period ? `месячные: ${flowLabels[row.period.intensity] ?? row.period.intensity}` : null,
    includedSections.pain && hasPain(row) ? `боль: ${row.pain?.level ?? "есть"} (${row.pain?.kinds.map(kind => painLabels[kind] ?? kind).join(", ")})` : null,
    includedSections.moodEnergy && row.mood ? `настроение: ${moodLabels[row.mood.value] ?? row.mood.value}` : null,
    includedSections.moodEnergy && row.energy ? `энергия: ${energyLabels[row.energy.value] ?? row.energy.value}` : null,
    includedSections.sleep && row.sleep ? `сон: ${sleepLabels[row.sleep.quality] ?? row.sleep.quality}` : null,
    includedSections.symptoms && row.symptomLog?.appetite ? `аппетит: ${row.symptomLog.appetite}` : null,
    includedSections.symptoms && row.symptomLog?.sweetCraving ? "тяга к сладкому" : null,
    includedSections.moodEnergy && row.symptomLog?.anxiety ? "тревога" : null,
    row.symptomLog?.medications?.length ? `лекарства: ${row.symptomLog.medications.join(", ")}` : null,
    includedSections.delays && row.delayChecks?.length ? `задержка: ${row.delayChecks.map(delay => `${delay.delayDays} дн.`).join(", ")}` : null,
    includedSections.pain && row.badEpisodes?.length ? `мне плохо: ${row.badEpisodes.map(ep => ep.summary).join("; ")}` : null,
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
