# Mira Product Specification

## Product Positioning

Mira is a cycle-aware body calendar and daily AI wellness coach for women. It
turns self-reported context, training history, nutrition, recovery, and optional
cycle signals into one calm daily decision: what kind of movement, nourishment,
and recovery may be useful today.

Mira is not a diagnostic product, fertility predictor, calorie-policing tool,
or static workout program.

## Target User

The MVP serves adult women who want a practical, low-friction way to adapt
movement and daily routines to changing energy, mood, sleep, stress, symptoms,
and training load. They value guidance that is supportive and specific without
being prescriptive or medical.

## Core Value Proposition

Instead of asking a user to interpret many disconnected health and fitness
signals, Mira gives an explainable, actionable plan for the day. The user can
quickly see what to do, how hard to train, and what supportive actions to
consider without shame or false precision.

## Main Jobs To Be Done

- Decide whether to train, recover, or choose a lighter movement option today.
- Adjust a workout around energy, soreness, self-reported pain, time, and equipment.
- Notice patterns in cycle context, mood, sleep, stress, symptoms, and load without treating correlation as diagnosis.
- Log meals with approximate, neutral feedback and correct an AI estimate.
- Review progress through habits and self-reported signals rather than body judgment.
- Know when a pattern warrants considering a conversation with a qualified clinician.

## Main Navigation

The product has five primary tabs:

1. **Today**: check-in and daily movement, nutrition, and recovery plan.
2. **Calendar**: cycle context, symptoms, workouts, and events by date.
3. **Workouts**: the current session, exercise alternatives, feedback, and completed-session history.
4. **Nutrition**: meal log, photo-assisted estimate, corrections, and neutral daily context.
5. **Analytics**: trends, recurring signals, load, and user-controlled insights.

Health Navigator is a contextual destination, entered from Today or Analytics,
not a sixth primary tab.

## MVP Scope

- Consent-first onboarding with goals, training level, available equipment, self-reported limitations, and optional cycle context.
- A sub-minute daily check-in for energy, mood, sleep, stress, soreness, symptoms, and pain.
- A deterministic safety policy and a daily workout plan drawn from an approved exercise library.
- Exercise replacement and immediate load reduction when pain is reported.
- Calendar for cycle context, symptoms, workouts, and check-ins.
- Nutrition photo analysis with ranges, uncertainty, and mandatory user confirmation or correction.
- Guided body-scan capture limited to neutral visual observations and capture quality, behind separate consent.
- Analytics for trends in self-reported signals and training behavior.
- Supabase authentication, persistence, row-level security, and secure Edge Functions for AI operations.

## Later Roadmap

- Wearable and Apple Health integrations behind explicit consent.
- Expo private beta with camera, notifications, and StoreKit subscriptions.
- Personalization from longitudinal feedback, model evaluation, and safety monitoring.
- Data export, deletion automation, retention controls, and audit views.
- Paid-plan entitlement service and carefully tested usage limits.

## Monetization Model

Free access includes manual tracking, basic workouts, and a limited number of
AI-assisted scans. Pro includes adaptive daily plans, extended history,
additional scans, and advanced trend insights. Pricing, trial length, and limits
are hypotheses to validate through research and experiments; they are not a
clinical or behavior-change intervention.

## Safety Principles

- Do not diagnose or present pregnancy, fertility, disease, injury, or medical conditions as facts.
- Cycle phase is a context signal, never a command. Self-reported symptoms, pain, and individual history have priority.
- When pain is reported, stop or reduce intensity and offer a safer option.
- For severe, new, persistent, or worsening symptoms, say: "consider discussing this with a qualified clinician."
- Do not recommend medication or supplements as treatment.
- Keep food feedback approximate, neutral, and non-shaming.
- Do not infer body fat, weight, attractiveness, posture diagnoses, or health status from body images.
- Show uncertainty and confidence rather than hiding them.

## Privacy Principles

- Collect only data needed for an explicit product function.
- Obtain distinct consent for sensitive features, including body scans, wearable imports, and optional health documents.
- Keep user data protected by authentication and row-level security.
- Store sensitive photos privately, strip EXIF before storage, use short-lived signed access URLs, and define retention and deletion behavior.
- Keep service credentials and model keys server-side only.
- Provide understandable deletion and export controls before paid release.
