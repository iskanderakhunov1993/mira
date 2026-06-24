import type { UserProfile, CyclePhase } from "./types";

export type KBJUTarget = {
  kcalMin: number;
  kcalMax: number;
  protein: number;
  fat: number;
  carbs: number;
};

export function calculateKBJU(profile: UserProfile | undefined, phase?: CyclePhase): KBJUTarget {
  if (!profile?.weight || !profile?.height || !profile?.age) {
    return { kcalMin: 1800, kcalMax: 2000, protein: 90, fat: 65, carbs: 220 };
  }

  // Mifflin-St Jeor for women
  const bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;

  const activityMultiplier = {
    low: 1.3,
    medium: 1.55,
    high: 1.725,
  }[profile.activityLevel ?? "medium"];

  let tdee = bmr * activityMultiplier;

  // Phase adjustment
  if (phase === "luteal") tdee *= 1.05;
  if (phase === "menstruation") tdee *= 0.97;

  const kcalMin = Math.round(tdee * 0.95);
  const kcalMax = Math.round(tdee * 1.05);

  const protein = Math.round(profile.weight * 1.6);
  const fat = Math.round(tdee * 0.28 / 9);
  const carbs = Math.round((tdee - protein * 4 - fat * 9) / 4);

  return { kcalMin, kcalMax, protein: Math.max(protein, 50), fat: Math.max(fat, 40), carbs: Math.max(carbs, 100) };
}
