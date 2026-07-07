import type { Cycle, DailyEntry } from "../../types/health";
import type { DailyCheckIn, MiraLocalData } from "../../lib/types";
import type { AddDraft, WaterAmount } from "./types";

export function todayKey(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function nowIso() {
  return new Date().toISOString();
}

export function createInitialAddDraft(): AddDraft {
  return {
    action: null,
    periodState: "started",
    wellbeing: "normal",
    waterAmount: 250,
    customWaterMl: "",
    energy: "normal",
    sleepQuality: "normal",
    sleepHours: "",
    painLocation: "низ живота",
    painIntensity: 2,
    painAffectedLife: "none",
    mood: "calm",
    symptom: "головная боль",
    customSymptom: "",
    context: "стресс",
    note: "",
  };
}

export function waterMl(amount: WaterAmount, custom: string) {
  if (amount !== "custom") return amount;
  const parsed = Number(custom);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}

export function validateAddDraft(draft: AddDraft): string | null {
  if (!draft.action) return "Выберите, что хотите отметить.";
  if (draft.action === "water" && waterMl(draft.waterAmount, draft.customWaterMl) <= 0) return "Введите объём воды больше 0 мл.";
  if (draft.action === "sleep" && draft.sleepHours && Number(draft.sleepHours) < 0) return "Часы сна не могут быть отрицательными.";
  if (draft.action === "pain" && !draft.painLocation.trim()) return "Укажите место боли.";
  if (draft.action === "symptom" && draft.symptom === "другое" && !draft.customSymptom.trim()) return "Напишите свой симптом.";
  return null;
}

export function buildRepositoryEntry(existing: DailyEntry | undefined, draft: AddDraft, date = todayKey()): DailyEntry {
  const savedAt = nowIso();
  const entry: DailyEntry = {
    id: existing?.id ?? `entry-${date}`,
    date,
    checkIn: existing?.checkIn,
    period: existing?.period,
    waterMl: existing?.waterMl,
    energy: existing?.energy,
    sleep: existing?.sleep,
    pain: existing?.pain,
    mood: existing?.mood,
    context: existing?.context ?? [],
    symptoms: existing?.symptoms ?? [],
    note: existing?.note,
    createdAt: existing?.createdAt ?? savedAt,
    updatedAt: savedAt,
  };

  if (draft.action === "period") {
    entry.period = {
      id: `period-${date}`,
      date,
      state: draft.periodState,
      createdAt: savedAt,
    };
  }
  if (draft.action === "wellbeing") entry.checkIn = { value: draft.wellbeing };
  if (draft.action === "water") entry.waterMl = (entry.waterMl ?? 0) + waterMl(draft.waterAmount, draft.customWaterMl);
  if (draft.action === "energy") entry.energy = draft.energy;
  if (draft.action === "sleep") {
    entry.sleep = {
      quality: draft.sleepQuality,
      hours: draft.sleepHours ? Number(draft.sleepHours) : undefined,
    };
  }
  if (draft.action === "pain") {
    entry.pain = {
      location: draft.painLocation.trim(),
      intensity: draft.painIntensity,
      affectedLife: draft.painAffectedLife,
    };
  }
  if (draft.action === "mood") entry.mood = draft.mood;
  if (draft.action === "symptom") {
    const symptom = draft.symptom === "другое" ? draft.customSymptom.trim() : draft.symptom;
    entry.symptoms = Array.from(new Set([...entry.symptoms, symptom].filter(Boolean)));
  }
  if (draft.action === "other") {
    entry.context = Array.from(new Set([...entry.context, draft.context].filter(Boolean)));
    if (draft.note.trim()) entry.note = draft.note.trim();
  }

  return entry;
}

export function buildRepositoryCycle(draft: AddDraft, date = todayKey()): Cycle | null {
  if (draft.action !== "period" || draft.periodState !== "started") return null;
  const savedAt = nowIso();
  return {
    id: `cycle-${date}`,
    startDate: date,
    source: "user",
    createdAt: savedAt,
    updatedAt: savedAt,
  };
}

export function buildLegacyData(existing: MiraLocalData, draft: AddDraft, date = todayKey()): MiraLocalData {
  const savedAt = nowIso();
  const previous = existing.checkIns[date];
  const nextCheckIn: DailyCheckIn = {
    ...previous,
    date,
    savedAt,
  };

  if (draft.action === "period") {
    nextCheckIn.period = {
      intensity: draft.periodState === "unusual_bleeding" ? "heavy" : "moderate",
      type: draft.periodState === "spotting" ? "spotting" : "normal",
    };
  }
  if (draft.action === "wellbeing") {
    nextCheckIn.mood = { value: draft.wellbeing === "good" ? "joy" : draft.wellbeing === "hard" ? "anxiety" : "normal" };
  }
  if (draft.action === "energy") {
    nextCheckIn.energy = { value: draft.energy === "low" ? "low" : draft.energy === "high" ? "high" : "normal" };
  }
  if (draft.action === "sleep") {
    nextCheckIn.sleep = { quality: draft.sleepQuality === "poor" ? "bad" : draft.sleepQuality, hours: draft.sleepHours ? Number(draft.sleepHours) : undefined };
  }
  if (draft.action === "pain") {
    nextCheckIn.pain = {
      kinds: ["lower_abdomen"],
      level: draft.painIntensity >= 4 ? "strong" : draft.painIntensity >= 2 ? "medium" : "light",
    };
  }
  if (draft.action === "mood") {
    nextCheckIn.mood = { value: draft.mood === "good" ? "joy" : draft.mood === "sad" ? "sadness" : draft.mood === "angry" ? "anger" : draft.mood === "anxious" ? "anxiety" : "normal" };
  }
  if (draft.action === "symptom") {
    const symptom = draft.symptom === "другое" ? draft.customSymptom.trim() : draft.symptom;
    nextCheckIn.pms = { symptoms: Array.from(new Set([...(previous?.pms?.symptoms ?? []), symptom].filter(Boolean))) };
  }
  if (draft.action === "other") {
    nextCheckIn.symptomLog = {
      ...(previous?.symptomLog ?? {}),
      medications: draft.context === "новый препарат" ? ["новый препарат"] : previous?.symptomLog?.medications,
    };
    if (draft.note.trim()) nextCheckIn.note = { text: draft.note.trim() };
  }

  const profile = existing.profile && draft.action === "period" && draft.periodState === "started"
    ? {
        ...existing.profile,
        cycleConfig: {
          ...existing.profile.cycleConfig,
          periodStart: date,
          periodStarts: Array.from(new Set([...(existing.profile.cycleConfig.periodStarts ?? []), date])).sort(),
        },
      }
    : existing.profile;

  return {
    ...existing,
    profile,
    checkIns: {
      ...existing.checkIns,
      [date]: nextCheckIn,
    },
  };
}
