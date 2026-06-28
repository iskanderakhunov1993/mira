"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Calendar,
  ClipboardList,
  Download,
  Droplets,
  FileText,
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
import { evaluateLab, getHormoneCheckup45, getLabRange } from "@/lib/labs";
import { LabsSection } from "./LabsSection";
import type { DailyCheckIn, MiraLocalData } from "@/lib/types";
import type { ScreenProps } from "./types";

const periods = [
  { label: "1 цикл", months: 1 },
  { label: "3 месяца", months: 3 },
  { label: "6 месяцев", months: 6 },
  { label: "12 месяцев", months: 12 },
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
  const length = config.cycleLength || 28;
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

export function ReportScreen({ data, persist }: ScreenProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(3);
  const [includeSex, setIncludeSex] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);

  const report = useMemo(() => {
    const profile = data.profile;
    const cycleLength = profile?.cycleConfig.cycleLength ?? 28;
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
      `Даты месячных с отметками: ${report.periodEntries.map(entry => entry.date).join(", ") || "нет данных"}`,
      `Боль: ${report.painEntries.length} дней, сильная боль: ${report.strongPainEntries.length} дней`,
      `Обильность: ${report.heavyFlowEntries.length} дней с обильными/очень обильными отметками`,
      `Задержки: ${report.delayChecks.length ? report.delayChecks.map(item => `${item.date}: ${item.delay.delayDays} дн.`).join("; ") : "нет отметок"}`,
      `Настроение отмечено: ${report.moodEntries.length} дней`,
      `Сон ухудшался: ${report.badSleepEntries.length} дней`,
      `Лекарства: ${report.medicationEntries.map(entry => `${entry.date}: ${entry.symptomLog?.medications?.join(", ")}`).join("; ") || "нет отметок"}`,
      "",
      "ГЛАВНОЕ ДЛЯ ВРАЧА",
      ...(report.doctorHighlights.length ? report.doctorHighlights.map(item => `— ${item}`) : ["— Повторяющихся тревожных сигналов пока мало"]),
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
      ...(report.focusItems.length ? report.focusItems.map(item => `— ${item}`) : ["— Явных повторяющихся сигналов в выбранном периоде мало"]),
      "",
      "ЧАСТЫЕ СИМПТОМЫ",
      ...(report.symptomCounts.length ? report.symptomCounts.map(([symptom, count]) => `— ${symptom}: ${count}`) : ["— нет частых симптомов"]),
      "",
      includeSex ? "СЕКС И СВЯЗАННЫЕ СИМПТОМЫ" : "СЕКС И СВЯЗАННЫЕ СИМПТОМЫ: скрыто пользователем",
      ...(includeSex
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
      ...report.questions.map((question, index) => `${index + 1}. ${question}`),
      "",
      "ДЕТАЛИ ПО ДНЯМ",
      ...(report.tableRows.length ? report.tableRows.map(row => {
        const parts = [
          row.period ? `месячные: ${flowLabels[row.period.intensity] ?? row.period.intensity}` : null,
          hasPain(row) ? `боль: ${row.pain?.level ?? "есть"} (${row.pain?.kinds.map(kind => painLabels[kind] ?? kind).join(", ")})` : null,
          row.mood ? `настроение: ${moodLabels[row.mood.value] ?? row.mood.value}` : null,
          row.energy ? `энергия: ${energyLabels[row.energy.value] ?? row.energy.value}` : null,
          row.sleep ? `сон: ${sleepLabels[row.sleep.quality] ?? row.sleep.quality}` : null,
          row.symptomLog?.medications?.length ? `лекарства: ${row.symptomLog.medications.join(", ")}` : null,
          row.badEpisodes?.length ? `мне плохо: ${row.badEpisodes.map(ep => ep.summary).join("; ")}` : null,
        ].filter(Boolean);
        return `— ${row.date}: ${parts.join("; ")}`;
      }) : ["— нет детальных записей"]),
      "",
      "Отчёт не является диагнозом и не заменяет консультацию врача. Он помогает структурировать наблюдения.",
    ];

    return lines.join("\n");
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
  const hormoneCheckup = getHormoneCheckup45(data);
  const rawReadyScore = Math.min(
    100,
    Math.round(
      Math.min(report.entries.length, 14) * 4 +
      (report.periodEntries.length > 0 ? 12 : 0) +
      (report.painEntries.length > 0 ? 10 : 0) +
      (report.moodEntries.length > 0 ? 8 : 0) +
      (report.tableRows.length >= 5 ? 10 : 0)
    )
  );
  const readyScore = report.entries.length > 0 ? Math.max(12, rawReadyScore) : 0;
  const readinessTitle = report.entries.length < 5
    ? "Нужно ещё несколько отметок"
    : report.focusItems.length > 0
      ? "Есть что обсудить с врачом"
      : "Отчёт уже можно показать";
  const readinessBody = report.entries.length < 5
    ? "Mira уже собрала первые записи, но врачу будет полезнее увидеть хотя бы 5-7 дней наблюдений."
    : report.focusItems.length > 0
      ? "В отчёте выделены повторяющиеся или тревожные сигналы, чтобы не объяснять всё с нуля на приёме."
      : "Данных достаточно, чтобы показать цикл, симптомы и вопросы без лишней тревоги.";

  return (
    <div>
      <div className="mb-6 print:hidden">
        <h1 className="text-2xl font-bold text-mira-text">Отчёт врачу</h1>
        <p className="mt-1 text-sm text-mira-muted">Симптомы, даты и закономерности, чтобы не вспоминать всё на приёме</p>
      </div>

      <Card className="mb-5 overflow-hidden border-mira-primary/15 bg-white p-5 print:hidden">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Готовность отчёта</p>
            <h2 className="mt-1 text-xl font-bold text-mira-text">{readinessTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-mira-muted">{readinessBody}</p>
          </div>
          <div className="flex items-center gap-4">
            <div
              className="grid h-24 w-24 place-items-center rounded-full"
              style={{ background: `conic-gradient(#70B68A ${readyScore}%, #EEE9F5 0)` }}
              aria-label={`Готовность отчёта ${readyScore}%`}
            >
              <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center">
                <span className="text-2xl font-bold text-mira-text">{readyScore}%</span>
                <span className="-mt-2 text-[10px] font-bold uppercase text-mira-muted">готово</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <MiniStat label="Дней с данными" value={`${report.entries.length}`} note={`за ${selectedPeriod} мес.`} />
          <MiniStat label="Вопросов врачу" value={`${report.questions.length}`} note={report.focusItems.length ? "по данным Mira" : "стартовый список"} />
          <MiniStat label="Детальных записей" value={`${report.tableRows.length}`} note="для истории" />
        </div>

        <div className="mt-5 flex gap-3">
          <Button className="flex-1" onClick={handlePrintPdf}>
            <Printer className="h-4 w-4" /> Скачать PDF
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleExportText}>
            <Download className="h-4 w-4" /> TXT
          </Button>
        </div>
      </Card>

      <Card className="mb-5 border-mira-primary/15 p-5 print:hidden">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-mira-cycle" />
          <p className="text-sm font-semibold text-mira-text">Главное для врача</p>
        </div>
        <div className="space-y-2">
          {(report.doctorHighlights.length ? report.doctorHighlights : ["Повторяющихся тревожных сигналов пока мало. Отчёт всё равно полезен как история наблюдений."]).slice(0, 5).map((item, index) => (
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
          <InfoRow label="Симптомы" value={`${report.painEntries.length} дней с болью, ${report.unusualEntries.length} необычных сигналов`} />
          <InfoRow label="Состояние" value={`${report.moodEntries.length} настроений, ${report.lowEnergyEntries.length} дней низкой энергии`} />
          <InfoRow label="Лекарства и задержки" value={`${report.medicationEntries.length} лекарств, ${report.delayChecks.length} разборов задержки`} />
          <InfoRow label="Забота" value={`${report.care.waterEntries.length} воды, ${report.care.walkingEntries.length} ходьбы, ${report.care.weightEntries.length} веса`} />
          <InfoRow label="Закономерности" value={`${report.analyticsFindings.length} выводов из аналитики`} />
        </div>

        <div className="mt-4 rounded-2xl border border-mira-lavender/20 bg-mira-bg p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-mira-text">Секс и контрацепция</p>
              <p className="text-[10px] text-mira-muted">{includeSex ? "Включится в PDF/TXT" : "Скрыто по умолчанию"}</p>
            </div>
            <button
              onClick={() => setIncludeSex(value => !value)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                includeSex ? "bg-mira-primary text-white" : "border border-mira-lavender/30 text-mira-muted"
              }`}
            >
              {includeSex ? "Включено" : "Включить"}
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
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
      </Card>

      <Card className="mb-5 border-mira-primary/15 p-5 print:hidden">
        <div className="mb-4 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-mira-primary" />
          <p className="text-sm font-semibold text-mira-text">На приёме сказать главное</p>
        </div>
        <p className="rounded-2xl bg-mira-lavender-light/25 p-3 text-sm italic leading-relaxed text-mira-text">"{doctorScript.intro}"</p>
        {report.focusItems.length > 0 && (
          <div className="mt-3 rounded-2xl border border-mira-cycle/15 bg-mira-rose-light/20 p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Не забыть обсудить</p>
            <p className="mt-1 text-sm leading-relaxed text-mira-text">{report.focusItems.join(" · ")}</p>
          </div>
        )}
      </Card>

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

      <Card className="mb-5 p-5 print:hidden">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-mira-primary" />
          <p className="text-sm font-semibold text-mira-text">Факторы заботы</p>
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

      <div className="mb-5 print:hidden">
        <LabsSection data={data} persist={persist} />
      </div>

      <div className="space-y-5 print:space-y-3">
        {!showFullReport && (
          <Card className="border-mira-lavender/20 bg-white p-5 print:hidden">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-mira-text">Полный отчёт скрыт, чтобы экран не перегружал</p>
                <p className="mt-1 text-xs leading-relaxed text-mira-muted">
                  Открой его перед приёмом, если хочешь проверить даты, симптомы и вопросы врачу.
                </p>
              </div>
              <Button variant="outline" onClick={() => setShowFullReport(true)}>
                <FileText className="h-4 w-4" /> Посмотреть отчёт
              </Button>
            </div>
          </Card>
        )}

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
              {report.focusItems.length > 0 ? "Есть темы, которые стоит обсудить на приёме" : "В выбранном периоде мало повторяющихся тревожных сигналов"}
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
          {report.focusItems.length > 0 && (
            <div className="mt-3 rounded-2xl border border-mira-cycle/15 bg-mira-rose-light/20 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Вынести в разговор</p>
              <p className="mt-1 text-sm text-mira-text">{report.focusItems.join(" · ")}</p>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-mira-cycle" />
            <p className="text-sm font-semibold text-mira-text">Главное для врача</p>
          </div>
          <div className="space-y-2">
            {(report.doctorHighlights.length ? report.doctorHighlights : ["Повторяющихся тревожных сигналов пока мало. Отчёт полезен как история наблюдений."]).slice(0, 6).map((item, index) => (
              <DoctorPoint key={item} index={index + 1} text={item} />
            ))}
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
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

          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-mira-primary" />
              <p className="text-sm font-semibold text-mira-text">Факторы заботы</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Вода" value={`${report.care.waterEntries.length}`} note={`мало: ${report.care.lowWaterDays}`} />
              <MiniStat label="Питание" value={`${report.care.mealDays}`} note="дней" />
              <MiniStat label="Ходьба" value={`${report.care.walkingEntries.length}`} note={`активно: ${report.care.walkingGoodDays}`} />
              <MiniStat label="Вес" value={`${report.care.weightEntries.length}`} note={report.care.latestWeight ? `${report.care.latestWeight.weight.toFixed(1)} кг` : "нет"} />
            </div>
          </Card>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
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

        {includeSex && (
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

        {labs.length > 0 && (
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

        {hormoneCheckup.show && (
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-mira-primary" />
              <p className="text-sm font-semibold text-mira-text">Чекап 45+ / гормоны</p>
            </div>
            <p className="text-xs leading-relaxed text-mira-muted">{hormoneCheckup.body}</p>
            <div className="mt-3 rounded-2xl bg-mira-bg p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">Если назначат прогестерон</p>
              <p className="mt-1 text-xs leading-relaxed text-mira-text">
                Ориентир для текущей длины цикла — примерно {hormoneCheckup.progesteroneDay}-й день, не строго 21-й для всех.
              </p>
            </div>
            <div className="mt-3 space-y-2">
              {hormoneCheckup.doctorQuestions.map((question, index) => (
                <p key={question} className="text-xs leading-relaxed text-mira-text">
                  <span className="font-bold text-mira-primary">{index + 1}.</span> {question}
                </p>
              ))}
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
                <span className="leading-relaxed text-mira-text">{describeRow(row, includeSex)}</span>
              </div>
            )) : (
              <p className="p-3 text-xs text-mira-muted">Нет детальных записей за выбранный период.</p>
            )}
          </div>
        </Card>

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
            <Download className="h-4 w-4" /> TXT
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

function describeRow(row: DailyCheckIn, includeSex: boolean) {
  const parts = [
    row.period ? `месячные: ${flowLabels[row.period.intensity] ?? row.period.intensity}` : null,
    hasPain(row) ? `боль: ${row.pain?.level ?? "есть"} (${row.pain?.kinds.map(kind => painLabels[kind] ?? kind).join(", ")})` : null,
    row.mood ? `настроение: ${moodLabels[row.mood.value] ?? row.mood.value}` : null,
    row.energy ? `энергия: ${energyLabels[row.energy.value] ?? row.energy.value}` : null,
    row.sleep ? `сон: ${sleepLabels[row.sleep.quality] ?? row.sleep.quality}` : null,
    row.symptomLog?.appetite ? `аппетит: ${row.symptomLog.appetite}` : null,
    row.symptomLog?.sweetCraving ? "тяга к сладкому" : null,
    row.symptomLog?.anxiety ? "тревога" : null,
    row.symptomLog?.medications?.length ? `лекарства: ${row.symptomLog.medications.join(", ")}` : null,
    row.delayChecks?.length ? `задержка: ${row.delayChecks.map(delay => `${delay.delayDays} дн.`).join(", ")}` : null,
    row.badEpisodes?.length ? `мне плохо: ${row.badEpisodes.map(ep => ep.summary).join("; ")}` : null,
    includeSex && row.intimacy?.happened ? `секс: ${[
      row.intimacy.protection ? protectionLabels[row.intimacy.protection] : null,
      row.intimacy.feeling === "pain" ? "боль" : null,
      row.intimacy.feeling === "discomfort" ? "дискомфорт" : null,
      row.intimacy.bleedingAfter ? "кровь после" : null,
    ].filter(Boolean).join(", ") || "отмечен"}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join("; ") : "запись без симптомов";
}
