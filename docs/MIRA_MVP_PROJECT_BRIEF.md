# Mira MVP Project Brief

## One-Line Description

Mira is a private cycle and wellbeing diary that helps a user understand what is happening today, track health facts, notice cautious patterns, and prepare a doctor-ready report.

## Product Promise

Not a diagnosis. Not control. Not memory. Mira turns daily observations into clear facts: cycle day, symptoms, lifestyle context, patterns, and a report the user can bring to a qualified clinician.

## Target User

Mira is for women who want a calm, private way to track cycle and wellbeing without feeling judged, pushed, or over-medicalized. The user may have pain, PMS, irregular cycles, sleep or energy changes, or simply wants better records before a medical appointment.

## MVP Goal

Make the core loop work end to end:

1. Open Today.
2. Understand current cycle state in a few seconds.
3. Add a medical or lifestyle note.
4. See cautious pattern analysis once enough entries exist.
5. Export a doctor-ready report with privacy controls.

## MVP Navigation

- Today: short daily summary and primary actions.
- Track: manual medical diary for period, symptoms, pain, mood, sleep, sex, tests, and personal notes.
- Care: lifestyle context only: water, movement, training load, food context, weight.
- Analysis: cautious pattern insights with sample size and reliability language.
- Report: doctor-ready facts, red flags, questions, privacy controls, TXT/PDF/print export.
- Profile: cycle settings, privacy, local export, reminders, data deletion.

## Out Of Scope For MVP

- Content/articles.
- Partner mode.
- Islamic mode.
- Standalone labs screen.
- Real AI calls.
- AI workout generation.
- Full calorie or nutrition diary.
- Wearables and Apple Health import.
- Paid plan, subscriptions, and entitlement logic.
- Native mobile app.

These features belong in backlog until the core tracking, analysis, report, privacy, and data consistency are stable.

## Product Principles

- Today is not a dashboard. It is a short status and action surface.
- Track is the source of manual medical facts.
- Care is lifestyle context, not medical tracking.
- Analysis explains patterns cautiously; it never diagnoses.
- Report is the main outcome.
- Sex and personal notes are excluded from doctor export by default.
- Red flags must be visible without making normal days feel like emergencies.
- If pain is reported, reduce intensity and suggest safer choices.
- Medical escalation copy: "consider discussing this with a qualified clinician."

## Data Principles

- Local-first storage is acceptable for MVP.
- Do not create disconnected stores.
- Anything shown in Analysis or Report must come from the active app flow.
- Sensitive categories must have explicit inclusion controls before export.
- Empty states should tell the user exactly what to add next.

## Primary User Stories

- As a user, I want to know what day of my cycle it is so I can understand today's context.
- As a user, I want to quickly log period, pain, mood, sleep, symptoms, and notes so I do not have to remember them later.
- As a user, I want lifestyle context to be separate from medical symptoms so the app feels organized and calm.
- As a user, I want Analysis to say how reliable a pattern is so I do not overtrust weak data.
- As a user, I want to create a doctor report that excludes sex and personal notes unless I explicitly include them.
- As a user, I want to delete or export my local data at any time.

## Screen Acceptance Criteria

### Today

- Shows current date, cycle day, phase, delay/next-period context, and at most one concise safety message.
- Provides direct actions for period/symptom tracking and pain support.
- Does not duplicate Care inputs or dense analytics.

### Track

- Lets the user backfill recent days.
- Saves period, pain, symptoms, mood, energy, sleep, sex, discharge, PMS, medications, and personal notes.
- Explains that personal notes are private and off by default in Report.

### Care

- Saves water, movement, training load, food context, skin/body context, and weight.
- Does not ask for period or medical symptom input.
- Data can appear as context in Analysis and Report.

### Analysis

- Every insight has sample size or "not enough data" language.
- Uses cautious wording: "Mira noticed", "may be related", "first signs".
- Offers Report as the next action when red flags or repeated symptoms appear.

### Report

- Shows selected date range and number of data days.
- Shows privacy checkboxes before export.
- Sex and personal notes are off by default.
- Includes red flag guidance and doctor questions.
- Supports print/PDF and TXT export.

### Profile

- Lets user edit cycle settings.
- Shows privacy controls, reminders, export, and deletion.
- Does not expose backlog features as ready MVP features.

## Backlog

- Content and education library.
- Partner sharing mode.
- Islamic mode.
- Labs as a dedicated workflow.
- AI symptom Q&A.
- AI food/workout assistance.
- Cloud sync and auth hardening.
- Native mobile app.
- Subscription and premium packaging.
