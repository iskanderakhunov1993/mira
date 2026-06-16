import type { LucideIcon } from "lucide-react";

export type Screen = "today" | "workout" | "nutrition" | "progress" | "profile";

export type ReadinessInput = {
  sleep: number;
  energy: number;
  mood: number;
  soreness: number;
};

export type Exercise = {
  id: number;
  name: string;
  focus: string;
  prescription: string;
  rest: string;
  cue: string;
  completed: boolean;
  skipped: boolean;
};

export type NavItem = {
  id: Screen;
  label: string;
  icon: LucideIcon;
};

export type UserProfile = {
  name: string;
  email: string;
  age: number;
  gender: string;
  goal: string;
  level: string;
  heightCm: number;
  weightKg: number;
  weeklyPlan: string;
  trainingPlace: string;
  availableTime: number;
  limitations: string[];
  cycleTracking: boolean;
  cycleLength?: number;
  lastPeriodDate?: string;
  cycleSymptoms?: string[];
  optionalDocuments?: string[];
  wearableSources?: string[];
};

export type BodyScanView = "front" | "side" | "back" | "seated";

export type BodyScanResult = {
  completedAt: string;
  captureQuality: number;
  observations: string[];
  focusAreas: string[];
  visibleIndicators: BodyScanIndicator[];
  trainingGuidance: TrainingGuidance;
  painAreas: string[];
  painLevel: number;
  goal: string;
  comparisonNote: string;
  source: "ai" | "demo";
};

export type BodyScanIndicator = {
  label: string;
  observation: string;
  confidence: number;
  caveat: string;
};

export type TrainingGuidance = {
  prioritize: string[];
  avoid: string[];
  intensityNote: string;
};

export type BodyVisionAnalysis = {
  captureQuality: number;
  observations: string[];
  visibleIndicators: BodyScanIndicator[];
  focusAreas: string[];
  trainingGuidance: TrainingGuidance;
  comparisonNote: string;
};

export type BodyScanContext = {
  goal: string;
  painAreas: string[];
  painLevel: number;
};

export type NutritionRange = {
  min: number;
  max: number;
};

export type MealVisionAnalysis = {
  isFood: boolean;
  dishName: string;
  items: Array<{
    name: string;
    estimatedPortion: string;
    confidence: number;
  }>;
  calories: NutritionRange;
  macrosG: {
    protein: NutritionRange;
    carbs: NutritionRange;
    fat: NutritionRange;
  };
  confidence: number;
  uncertainFactors: string[];
  followUpQuestion: string | null;
  notes: string;
};

export type MealAnalysisResponse = {
  analysis: MealVisionAnalysis;
  source: "ai" | "demo";
};
