# Mira Product Backlog

## Product Goal

Mira helps a user understand her current context and choose one supportive
action for today. The first releasable version is local-first: it works without
an account, stores data in the browser, and makes no real AI or medical claims.

## Definition Of Working MVP

A user can complete onboarding, record a daily check-in, receive a safety-aware
plan, choose or complete a workout, add a meal manually or through the demo
flow, and revisit her own entries in Calendar and Analytics after several days.

## Execution Order

### P0 - Daily Value Loop

| ID | Task | Why it matters | Done when | Dependencies |
| --- | --- | --- | --- | --- |
| P0-01 | Create a versioned local data store | Makes the prototype useful across reloads and is the base for all personal views. | Profile, check-ins, workouts, meals, and notes persist in `localStorage`; malformed data falls back safely. | None |
| P0-02 | Persist the daily check-in | Turns Today from a demo into a personal daily tool. | Saving a check-in records date/time; reopening Today reflects the latest entry. | P0-01 |
| P0-03 | Make Today state-driven | Gives one clear action instead of a dashboard of equal actions. | Before check-in, primary action is `Отметить состояние`; after it, primary action is `Начать план`; pain state prioritizes recovery. | P0-02 |
| P0-04 | Add end-of-day reflection | Creates the feedback loop needed for future recommendations. | User can record effort, energy after movement, pain, and a short note; all fields are optional. | P0-01 |
| P0-05 | Replace demo Calendar records with local records | Makes the calendar credible and useful. | Calendar shows actual check-ins, workouts, meals, and notes; demo data is visibly labelled or absent. | P0-01, P0-02 |
| P0-06 | Add empty and first-use states | Prevents empty screens from feeling broken. | Calendar, workouts, nutrition, and analytics each provide one next action when there is no data. | P0-01 |

### P1 - Action Loops

| ID | Task | Why it matters | Done when | Dependencies |
| --- | --- | --- | --- | --- |
| P1-01 | Implement workout start and completion | Closes the recommendation-to-action loop. | User chooses 12/25/40 minutes, starts a session, completes or skips it, and saves feedback. | P0-01, P0-03 |
| P1-02 | Improve workout safety actions | Makes the workout promise trustworthy. | `Больно`, `Сделать легче`, `Заменить` and `Остановить` alter the current session and save a reason. | P1-01 |
| P1-03 | Add manual meal logging | Makes nutrition useful without a camera or AI. | User can add meal name, optional photo placeholder, approximate meal time, and an optional note. | P0-01 |
| P1-04 | Make demo meal analysis editable | Keeps estimates honest and user-controlled. | Foods, confidence, and range can be corrected before saving. | P1-03 |
| P1-05 | Add personal notes from Today and Calendar | Captures context that chips cannot express. | A note can be created, edited, and deleted locally from a selected day. | P0-01, P0-05 |

### P2 - Personal Patterns

| ID | Task | Why it matters | Done when | Dependencies |
| --- | --- | --- | --- | --- |
| P2-01 | Replace Analytics demo data with aggregation | Insights must be earned from user data. | Analytics only uses local records; it shows a data-collection threshold before showing patterns. | P0-01, P0-02, P1-01, P1-03 |
| P2-02 | Add minimum-data rules | Avoids false personal conclusions. | A pattern needs a documented minimum, such as 7 check-ins or 3 cycle entries; otherwise it remains hidden. | P2-01 |
| P2-03 | Add user feedback on recommendations | Lets Mira learn whether a plan was useful. | A user can mark a plan as useful, too much, too little, or not relevant; the response is stored locally. | P0-03 |
| P2-04 | Build Health Navigator from observed entries only | Provides cautious escalation without diagnosis. | It cites user-entered records, clearly says it is not a diagnosis, and only says to consider discussing patterns with a qualified clinician. | P2-01 |

### P3 - Trust, Quality, And Release Readiness

| ID | Task | Why it matters | Done when | Dependencies |
| --- | --- | --- | --- | --- |
| P3-01 | Finalize the dark Mira design system | Removes visual inconsistency after the visual direction change. | UX spec matches implementation; color tokens, buttons, cards, charts, and states are consistent and accessible. | P0-03 |
| P3-02 | Accessibility pass | Makes core flows usable for more people. | Keyboard flow, visible focus, semantic labels, contrast, and reduced-motion behavior are verified. | P3-01 |
| P3-03 | Local data controls | Makes the local-first promise understandable. | Settings can export a JSON preview, clear all local data after confirmation, and explain what stays on-device. | P0-01 |
| P3-04 | Product event instrumentation plan | Makes early learning measurable before backend work. | Documented event names, properties, privacy limits, and success metrics; no sensitive content is sent by default. | P0-03 |
| P3-05 | Automated tests for safety and persistence | Protects the highest-risk flows. | Tests cover pain-reduces-load, invalid local data, check-in persistence, and no-data analytics states. | P0-01, P1-02 |

### P4 - Backend And AI, Only After The Local Loop Works

| ID | Task | Why it matters | Done when | Dependencies |
| --- | --- | --- | --- | --- |
| P4-01 | Add Supabase auth and migration rollout | Enables private multi-device persistence. | Auth, RLS, migrations, and delete/export flows are verified with user-owned data. | P3-03 |
| P4-02 | Connect typed client API to Edge Function fallbacks | Keeps AI behind safe boundaries. | Client uses shared schemas and safe demo fallbacks; no keys appear in client code. | P4-01 |
| P4-03 | Integrate daily decision and workout functions | Adds AI only where it improves an established loop. | Outputs pass runtime validation and deterministic safety rules before UI display. | P4-02 |
| P4-04 | Integrate meal analysis behind consent | Adds a controlled photo capability. | Explicit consent, image validation, editable output, confidence, and delete path are complete. | P4-02 |

## Recommended First Milestone

Complete P0-01 through P0-06 before adding new feature surfaces. This creates a
working local product loop: input, decision, action, reflection, and history.

## Acceptance Checklist For The First Milestone

- A fresh user can reach a useful Today plan in under one minute.
- Reloading the app does not lose onboarding, check-ins, completed workouts,
  meals, notes, or plan feedback.
- Calendar and Analytics never present demo patterns as personal data.
- Pain changes movement advice before performance goals are considered.
- Every empty screen explains one next useful action.
- Build, typecheck, and focused tests pass.

## Out Of Scope Until P4

- Real OpenAI calls or keys in the frontend.
- Medical diagnosis, fertility claims, medication advice, or treatment advice.
- Body scoring, weight goals, body-fat estimates, or attractiveness assessment.
- Automatic data sharing, automatic clinician reports, or dark-pattern consent.
