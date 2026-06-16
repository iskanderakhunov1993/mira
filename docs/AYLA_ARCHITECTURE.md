# Ayla: MVP architecture

## Product principle

Ayla is not a calorie tracker or a static workout plan. Its primary product
object is a daily decision:

> Given the woman's current state, what type of movement and support is useful
> today?

Every feature either supplies context to that decision or helps the user act on
it with minimal input.

## MVP user flows

### Activation

1. Choose a goal and training level.
2. Select self-reported limitations without diagnosis language.
3. Optionally add cycle context and symptoms.
4. Complete a guided front, side and back body scan.
5. Receive the first explanation of how Ayla will adapt the next day.

### Daily loop

1. Ayla imports sleep and activity when available.
2. User completes a sub-minute energy, mood, soreness and pain check-in.
3. Decision engine computes readiness and chooses a session policy.
4. AI generates a structured workout from an approved exercise library.
5. During training, `pain` immediately removes the exercise and requests a
   safer alternative under the same constraints.
6. Post-workout feedback updates recovery and the next decision.

### Nutrition

1. User uploads a meal image.
2. Vision returns foods, portions, nutrient ranges and confidence.
3. User accepts or makes a quick correction.
4. The daily coach uses nutrition as a soft context signal, not a score of
   personal worth.

### Body scan

1. Guided capture validates light, framing and pose.
2. The system stores encrypted originals separately from derived landmarks.
3. Output is limited to visible change and fitness-oriented observations.
4. No diagnosis, body-fat claim, attractiveness score or medical conclusion.

## Repository structure

```text
apps/
  web/                 Vite + React product prototype
  mobile/              Future Expo Router application
packages/
  domain/              Readiness rules, types, validators
  design-system/       Tokens and cross-platform primitives
  api-client/          Typed Supabase Edge Function client
supabase/
  migrations/          PostgreSQL schema and RLS
  functions/           Secure AI orchestration
docs/
  AYLA_ARCHITECTURE.md
```

The current MVP implements `apps/web`. When mobile work begins, pure functions
such as readiness calculation move to `packages/domain`; screens are rebuilt
with React Native primitives rather than shared DOM components.

## Frontend architecture

- React + TypeScript + Vite for rapid validation.
- Feature boundaries: daily coach, workout, nutrition, progress and profile.
- Server state: TanStack Query when Supabase is connected.
- Local UI state: component state or a small Zustand store.
- Forms: React Hook Form + Zod.
- Mobile: Expo Router, React Native Reanimated, Expo Camera and HealthKit
  adapters behind platform interfaces.

Never put an OpenAI API key in web or mobile clients.

## Supabase data model

Core tables:

| Table | Purpose |
| --- | --- |
| `profiles` | Goal, level, locale, consent versions |
| `limitations` | User-reported body areas, severity and notes |
| `cycle_logs` | Cycle dates, symptoms and user confidence |
| `daily_checkins` | Energy, mood, soreness, sleep and pain |
| `wearable_daily` | Normalized sleep, HRV, resting HR and activity |
| `body_scans` | Private object paths, capture metadata and status |
| `body_observations` | Non-medical derived observations |
| `meal_logs` | Meal image, nutrient ranges, confidence and corrections |
| `workouts` | Generated daily session, rationale and policy version |
| `workout_exercises` | Ordered exercises and execution state |
| `exercise_feedback` | Complete, skip, pain, effort and notes |
| `subscriptions` | Entitlement mirrored from App Store / Stripe |
| `ai_runs` | Model, prompt version, latency, cost and safety result |

### Important columns

```sql
create table daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  local_date date not null,
  energy smallint check (energy between 1 and 10),
  mood smallint check (mood between 1 and 10),
  soreness smallint check (soreness between 1 and 10),
  pain_areas jsonb not null default '[]',
  sleep_minutes integer,
  readiness_score smallint check (readiness_score between 0 and 100),
  created_at timestamptz not null default now(),
  unique (user_id, local_date)
);

create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  local_date date not null,
  status text not null check (status in ('draft','active','complete','abandoned')),
  decision_policy_version text not null,
  readiness_score smallint not null,
  rationale text not null,
  duration_minutes smallint not null,
  intensity text not null,
  created_at timestamptz not null default now()
);
```

Every user-owned table enables RLS and checks `auth.uid() = user_id`. Sensitive
storage buckets use private access with short-lived signed URLs. Service-role
keys exist only inside Edge Functions.

## API architecture

Client-facing operations are task-oriented rather than generic AI chat:

```text
POST /functions/v1/daily-decision
POST /functions/v1/generate-workout
POST /functions/v1/replace-exercise
POST /functions/v1/analyze-meal
POST /functions/v1/analyze-body
POST /functions/v1/workout-summary
DELETE /functions/v1/user-data
```

Each request:

1. Authenticates the Supabase JWT.
2. Loads only the minimum required context.
3. Runs deterministic eligibility and safety rules.
4. Calls the model with a versioned structured-output schema.
5. Validates output with Zod.
6. Rejects exercises outside the curated library.
7. Stores the decision, model version and safety metadata.

## AI decision engine

The engine is hybrid. Deterministic rules own safety and constraints; the model
selects and explains within those boundaries.

### Inputs

- stable profile: goal, level, equipment and limitations
- current state: sleep, energy, mood, pain, soreness and cycle symptoms
- recent load: muscle groups, volume, RPE and pain events
- recovery: wearable trends and self-report
- nutrition: coarse energy/protein sufficiency with confidence
- availability: location, equipment and available minutes
- body scan: neutral visible indicators, capture quality and comparison notes

Body scan never infers weight, body-fat percentage or a medical diagnosis from
photos. Height and weight come from the profile; pain comes only from
self-report. Image observations are low-confidence training context and always
include camera/stance caveats.

### Policy stages

1. **Hard exclusions:** active pain, clinician restrictions and contraindicated
   movement patterns.
2. **Readiness band:** recovery, standard or progressive.
3. **Session intent:** recovery flow, mobility, low-impact strength, standard
   strength or progression.
4. **Load budget:** duration, sets, intensity and muscle-group recovery.
5. **Exercise retrieval:** only approved exercises matching constraints.
6. **Model composition:** order, cues, rest and supportive explanation.
7. **Validation:** duration, duplicate muscles, exclusions and language safety.

The menstrual cycle is a context signal, never a deterministic command.
Self-reported symptoms and individual history outweigh phase assumptions.

## Structured workout output

```json
{
  "intent": "low_impact_strength",
  "duration_minutes": 32,
  "intensity": "moderate",
  "rationale": "Short user-facing explanation",
  "exercises": [
    {
      "exercise_id": "glute_bridge",
      "sets": 3,
      "reps": "12",
      "rest_seconds": 45,
      "technique_cue": "Neutral, non-medical cue",
      "breathing_cue": "Exhale during effort"
    }
  ]
}
```

## Safety and privacy

- Do not infer diagnoses, fertility, pregnancy, eating disorders or disease
  from images or behavioral data.
- Do not recommend medication, supplements or medical treatment.
- Water, cycle and nutrition messages must include uncertainty when relevant.
- A pain event stops the current movement; severe or persistent pain directs
  the user to a qualified professional.
- Strip EXIF before upload and define explicit retention periods.
- Body scans require separate consent and one-tap deletion.
- Medical files are optional, isolated and never interpreted as diagnosis.
- Crisis, pregnancy and post-operative states require dedicated policies before
  product support is enabled.

## Design system

Core tokens:

```text
Ivory       #FBF8F4  primary canvas
Paper       #FFFEFA  elevated surface
Muted rose  #BC8992  warmth and secondary context
Plum        #74505D  accessible primary action
Lavender    #AFA7BD  recovery and cycle context
Sage        #738B79  completion and restoration
Warm beige  #DDCFC2  neutral wellness context
Ink         #292326  primary text
```

Principles:

- "quiet intelligence": calm surfaces with a precise, confident hierarchy
- generous whitespace and one primary action per screen
- rounded 13–28 px surfaces with restrained shadows
- calm, supportive language without judgment
- uncertainty and confidence are visible, not hidden
- motion communicates adaptation, never urgency
- no red failure states for missed workouts or food choices
- the Ayla mark combines an `A`, a body silhouette and an adaptive orbit

## Roadmap

### Phase 0: clickable web MVP

- Validate value proposition and daily loop with 10–15 women.
- Measure whether the generated recommendation feels personally relevant.
- Test trust in meal and body scan explanations.

### Phase 1: connected web alpha

- Supabase auth, profile, check-ins and workout persistence.
- Edge Functions with OpenAI structured output.
- Curated exercise library and deterministic safety policies.
- Meal image upload and corrections.

### Phase 2: Expo private beta

- Apple/email auth, camera, push notifications and StoreKit.
- Apple Health integration behind explicit consent.
- Guided body scan capture and encrypted storage.
- Post-workout feedback and adaptation history.

### Phase 3: paid MVP

- Subscription entitlement service and usage limits.
- Model evaluation dashboard, safety review and deletion/export tooling.
- Cohort analytics: activation, D7 retention, workout completion, pain
  replacement success and trial conversion.

## MVP success metrics

- 70% of activated users generate a second daily workout.
- 50% complete at least two check-ins in week one.
- 60% rate the recommendation as relevant or very relevant.
- Less than 5% of sessions produce an inappropriate exercise report.
- Meal analysis corrections are completed in under 15 seconds.
- D7 retention target for the first qualified cohort: 25% or higher.
