# Mira Product Specification

## Product Positioning

Mira is a private daily diary for women's cycle and wellbeing. It turns simple
self-reported check-ins into a personal norm, clear pattern explanations, and a
doctor-ready report that helps the user discuss symptoms with facts instead of
memory.

Mira is not a diagnostic product, fertility predictor, calorie-policing tool,
or static workout program.

## Target User

The MVP serves women who want a private, low-friction way to understand what is
usual for their own body, notice recurring symptoms, and prepare for a medical
conversation when something feels off. They value calm guidance that is specific
without being prescriptive or diagnostic.

## Core Value Proposition

Instead of asking a user to remember scattered symptoms and dates, Mira creates
a structured health diary. The user can see what repeats, what may be outside
their personal pattern, and what is worth taking to a clinician.

## Main Jobs To Be Done

- Build a habit of daily check-ins in under a minute.
- Review a day-by-day diary of cycle, pain, mood, energy, sleep, PMS, meals, water, workouts, and notes.
- Notice patterns in cycle context, mood, sleep, symptoms, and daily routines without treating correlation as diagnosis.
- Prepare a concise doctor report with dates, frequencies, and questions.
- Choose gentle care actions for food, water, and movement based on current state.
- Know when a pattern warrants considering a conversation with a qualified clinician.

## Main Navigation

The product has six primary destinations:

1. **Today**: check-in and daily movement, nutrition, and recovery plan.
2. **Diary**: day-by-day history of check-ins, water, meals, workouts, and notes.
3. **Analytics**: personal norm, trend summaries, and recurring signals.
4. **Care**: nutrition, water, and movement support.
5. **Doctor Report**: concise summary, period controls, questions, and export.
6. **Profile**: privacy, sync, export, and preferences.

Islamic mode is an optional contextual destination when enabled.

## MVP Scope

- Consent-first onboarding with goals, training level, available equipment, self-reported limitations, and optional cycle context.
- A sub-minute daily check-in for period, pain, mood, energy, sleep, PMS, intimacy, meals, and notes.
- A day-by-day diary for recent history and backfilling missed days.
- Personal norm and signal dashboard using only self-reported data and cycle history.
- Doctor report with concise summary, questions, optional sensitive sections, export, and print.
- Nutrition, water, and workout support framed as non-medical self-care.
- Local-first storage with optional sync.

## Later Roadmap

- Stronger PDF report export and share flow.
- Import from other cycle trackers and Apple Health behind explicit consent.
- Optional clinician-facing view or appointment checklist.
- Personalization from longitudinal feedback, model evaluation, and safety monitoring.
- Data export, deletion automation, retention controls, and audit views.
- Paid-plan entitlement service and carefully tested usage limits.

## Backlog

### "Is This Normal?" Symptom Question Assistant

**Pain:** users often do not know whether a symptom is expected cycle variation,
something to observe, or a reason to speak with a qualified clinician.

**User story:** as a user, I want to ask "Is this normal?" in my own words so I
can get a simple, safe explanation of my symptom without receiving a diagnosis.

**Example questions:**

- "My period has lasted 8 days, is this normal?"
- "My stomach hurts a lot on the first day, is this normal?"
- "There was blood after sex, is this normal?"
- "My period is 6 days late, what should I do?"
- "I feel very weak during my period, is that dangerous?"

**MVP requirements:**

- Add an "Is this normal?" entry point from Today and Diary.
- Let the user type a free-text question and optionally choose a quick example.
- Return a short answer in plain language, without diagnosis.
- Explain what can be common, what to observe, what to do now, and when to
  consider contacting a qualified clinician.
- Highlight red flags such as very heavy bleeding, dizziness/fainting, severe or
  unusual pain, bleeding after sex, bleeding between periods, prolonged bleeding,
  and persistent or worsening symptoms.
- Save the question and response to the cycle-day diary.

**Safety constraints:** deterministic red-flag rules must run before any AI
response. AI can compose the explanation, but it must not diagnose, recommend
medication, or minimize severe, new, persistent, or worsening symptoms.

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
