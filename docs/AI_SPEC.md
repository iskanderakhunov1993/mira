# Mira AI Specification

## AI Architecture

Mira uses a hybrid decision system. Deterministic policy owns safety,
eligibility, and exercise constraints. AI is limited to structured composition,
summarization, and bounded image-assisted estimates. AI never bypasses safety
rules or invents exercises outside the curated library.

All model requests run through authenticated Supabase Edge Functions. Clients
send only the minimum task-specific data to an Edge Function and never receive
an OpenAI API key or call OpenAI directly.

## Edge Functions

| Function | Responsibility |
| --- | --- |
| `daily-decision` | Turn validated check-in and permitted context into a daily intent and supportive actions. |
| `generate-workout` | Compose an approved exercise session within a deterministic load budget. |
| `replace-exercise` | Replace or remove an exercise after pain, discomfort, equipment, or time feedback. |
| `analyze-meal` | Return conservative food, portion, nutrient-range, confidence, and uncertainty data from a meal image. |
| `analyze-body` | Return capture quality and neutral, non-medical visible observations from consented images. |
| `workout-summary` | Summarize completed-session feedback for the next decision. |
| `user-data` | Support authenticated export and deletion workflows; it does not invoke a model. |

## Input Schemas

Every request is authenticated and parsed with a versioned runtime schema. The
minimum shared context includes `userId`, `localDate`, `locale`, and
`policyVersion` from trusted server state. Client input must not set privileged
fields such as user identity, allowed exercises, consent status, or model
configuration.

### Daily Decision Input

```ts
type DailyDecisionInput = {
  checkIn: {
    energy: number; // 1..10
    mood: number; // 1..10
    soreness: number; // 1..10
    sleepMinutes?: number;
    stress?: number; // 1..10
    painAreas: string[];
    symptoms: string[];
  };
  availability: { minutes: number; equipment: string[] };
};
```

### Workout Generation Input

```ts
type WorkoutGenerationInput = {
  intent: "recovery" | "mobility" | "low_impact_strength" | "strength" | "progression";
  loadBudget: { durationMinutes: number; intensity: "low" | "moderate" | "high" };
  allowedExerciseIds: string[];
  exclusions: string[];
};
```

### Meal And Body Image Inputs

Images are limited by authenticated upload policy, MIME type, size, and consent.
Meal analysis accepts a single meal image. Body analysis requires a separate
body-scan consent and the required guided views. User-reported pain is context,
not an image-derived observation.

## Output Schemas

All model outputs use strict JSON Schema at generation time and runtime
validation before persistence or UI use. A failed validation produces a safe
fallback or an explicit unavailable state.

### Daily Decision Output

```ts
type DailyDecisionOutput = {
  intent: "recovery" | "mobility" | "low_impact_strength" | "strength" | "progression";
  durationMinutes: number;
  intensity: "low" | "moderate" | "high";
  rationale: string;
  movementAction: string;
  nutritionSupport: string;
  recoverySupport: string;
  safetyFlags: string[];
};
```

### Workout Output

```ts
type WorkoutOutput = {
  intent: string;
  durationMinutes: number;
  intensity: "low" | "moderate" | "high";
  rationale: string;
  exercises: Array<{
    exerciseId: string;
    sets: number;
    reps: string;
    restSeconds: number;
    techniqueCue: string;
    breathingCue: string;
  }>;
};
```

Meal output contains foods, estimated portions, nutrient ranges, confidence,
uncertain factors, and at most one follow-up question. Body output contains
capture quality, neutral observations, visible indicators with caveats,
training focus, and a cautious comparison note.

## Safety Rules

- Do not diagnose, or state pregnancy, fertility, disease, injury, eating disorder, or medical condition as fact.
- Do not recommend medication or supplements as treatment.
- Active pain is a hard safety signal: exclude painful movements and reduce or stop intensity. Severe, new, persistent, or worsening pain uses the phrase "consider discussing this with a qualified clinician."
- Cycle data is context only. It must not override pain, symptoms, recovery, limitations, or user preference.
- Food outputs are approximate and neutral. They must not shame, restrict, or imply laboratory precision.
- Body outputs must not estimate attractiveness, weight, BMI, body fat, age, posture diagnosis, scoliosis, injury, or health status.
- Do not fabricate wearable, medical, or historical data. State uncertainty when information is missing or low confidence.

## Structured Output Requirements

- Use strict JSON Schema with `additionalProperties: false` where supported.
- Version every prompt, schema, safety policy, curated exercise set, and model configuration.
- Define numeric bounds, string enums, nullable fields, and maximum array sizes in schemas.
- Keep user-facing copy short, localizable, and separate from policy-critical fields.
- Use conservative defaults and deterministic fallbacks when a model response is absent, malformed, unsafe, or unavailable.

## Validation Requirements

Each Edge Function must:

1. Authenticate the Supabase JWT and derive identity server-side.
2. Verify consent and load only the minimum permitted context.
3. Validate request input with Zod before calling a model.
4. Apply deterministic safety and eligibility rules before model invocation.
5. Validate model JSON with Zod after generation.
6. Confirm all exercises belong to the approved library and match exclusions.
7. Scan or reject unsafe language and invalid ranges before persistence.
8. Persist audit metadata in `ai_runs`: model, prompt version, schema version, policy version, latency, cost, and safety outcome, without storing secrets.

## Client Boundary

No direct client-side OpenAI calls are permitted. Web, Expo, and native clients
call task-specific Supabase Edge Functions through a typed API client. Service
role keys and `OPENAI_API_KEY` exist only in server-side secrets.
