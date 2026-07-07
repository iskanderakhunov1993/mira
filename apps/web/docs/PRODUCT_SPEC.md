# Mira Web/PWA MVP Product Spec

## MVP Goal

Mira helps a user understand what is happening today, save key cycle and symptom facts quickly, see cautious patterns, and prepare a private doctor-ready report.

This repository currently ships the web/PWA MVP. Native Expo work remains a separate future stage.

## Core Flow

1. Open `/today`.
2. Understand cycle state, delay or next-period context in a few seconds.
3. Add a period start, symptom, pain, mood, sleep, water, weight, or calorie entry.
4. Check `/calendar` and `/analysis` for cautious pattern context.
5. Open `/report`, choose privacy sections, and export doctor-facing facts.

## Primary Routes

- `/onboarding`: creates the local health profile, first cycle anchor, tracker preferences, and privacy defaults.
- `/today`: daily summary and short CTAs.
- `/add`: route-backed entry flow for period, symptoms, pain, sleep, mood, energy, water, and context.
- `/track`: detailed diary flow for medical entries and private notes.
- `/calendar`: confirmed entries plus forecast range from the shared cycle model.
- `/analysis`: cautious pattern surface with sample size and reliability language.
- `/body`: rhythm summary and doctor summary builder for the new health snapshot model.
- `/report`: legacy-compatible doctor report with explicit export controls.
- `/settings` and `/profile`: local data, privacy, and sync controls.

## P0 Product Invariants

- Cycle day, delay, next-period timing, and forecast range must come from the same cycle semantics across Today, Calendar, Analytics, Body, Report, and store bridges.
- Report export must keep sex and personal notes off by default.
- Nutrition and calorie details must not be exported by default unless a dedicated opt-in section exists.
- Data saved in Today, Add, or Track must be available to Analytics and Report through `HealthRepository`, legacy local data, or the bridge. Do not create another disconnected store.
- Escalation copy must stay non-diagnostic and use cautious clinician language.

## Privacy Defaults

Included by default:
- period dates;
- delays;
- pain;
- symptoms;
- mood and energy;
- sleep;
- doctor questions.

Excluded by default:
- sex and contraception;
- personal notes;
- nutrition/calorie details;
- labs unless the user explicitly includes them in the relevant export surface.

## Acceptance

- `npm run lint --workspace=@mira/web` passes.
- `npm run test --workspace=@mira/web` passes.
- `npm run smoke --workspace=@mira/web` passes against a running app.
- `npm run core-flow --workspace=@mira/web` passes against a running app and verifies the P0 flow from onboarding to report privacy.
- Primary routes return 200: `/onboarding`, `/today`, `/calendar`, `/body`, `/add`, `/settings`, `/track`, `/profile`, `/report`, `/analysis`.
- Report export controls are visible before export.
