import {
  createDemoDailyDecision,
  createDemoHealthNavigator,
  createDemoMealAnalysis,
  createDemoPatternAnalysis,
  createDemoReplacement,
  createDemoWorkout,
  createEnvelope,
  isDailyDecisionOutput,
  isHealthNavigatorOutput,
  isMealAnalysisOutput,
  isPatternAnalysisOutput,
  isRecord,
  isReplaceExerciseOutput,
  isWorkoutOutput,
  type AiEnvelope,
  type AiOperation,
  type AnalyzeMealInput,
  type AnalyzeMealOutput,
  type DailyDecisionInput,
  type DailyDecisionOutput,
  type GenerateWorkoutInput,
  type GenerateWorkoutOutput,
  type HealthNavigatorInput,
  type HealthNavigatorOutput,
  type PatternAnalysisInput,
  type PatternAnalysisOutput,
  type ReplaceExerciseInput,
  type ReplaceExerciseOutput
} from "../../../../shared/ai-contracts";

type AiClientConfig = {
  supabaseUrl?: string;
  accessToken?: () => Promise<string | null>;
};

type OutputValidator<T> = (value: unknown) => value is T;

export function createMiraAiClient(config: AiClientConfig = {}) {
  const supabaseUrl = config.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL;

  async function invoke<Input, Output>(
    operation: AiOperation,
    input: Input,
    fallback: (value: Input) => Output,
    validate: OutputValidator<Output>
  ): Promise<AiEnvelope<Output>> {
    if (!supabaseUrl) return createEnvelope(operation, fallback(input));

    try {
      const accessToken = await config.accessToken?.();
      const response = await fetch(`${supabaseUrl}/functions/v1/${operation}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify(input)
      });
      const body: unknown = await response.json();

      if (!response.ok || !isRecord(body) || !validate(body.data)) {
        return createEnvelope(operation, fallback(input), "fallback", "edge-function-unavailable");
      }

      return body as AiEnvelope<Output>;
    } catch {
      return createEnvelope(operation, fallback(input), "fallback", "network-unavailable");
    }
  }

  return {
    dailyDecision: (input: DailyDecisionInput) =>
      invoke("daily-decision", input, createDemoDailyDecision, isDailyDecisionOutput),
    generateWorkout: (input: GenerateWorkoutInput) =>
      invoke("generate-workout", input, createDemoWorkout, isWorkoutOutput),
    replaceExercise: (input: ReplaceExerciseInput) =>
      invoke("replace-exercise", input, createDemoReplacement, isReplaceExerciseOutput),
    analyzeMeal: (input: AnalyzeMealInput) =>
      invoke("analyze-meal", input, createDemoMealAnalysis, isMealAnalysisOutput),
    patternAnalysis: (input: PatternAnalysisInput) =>
      invoke("pattern-analysis", input, createDemoPatternAnalysis, isPatternAnalysisOutput),
    healthNavigator: (input: HealthNavigatorInput) =>
      invoke("health-navigator", input, createDemoHealthNavigator, isHealthNavigatorOutput)
  };
}

export const miraAiClient = createMiraAiClient();
