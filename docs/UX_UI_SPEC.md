# Mira UX And UI Specification

## Design Principles

- **Quiet intelligence**: turn complexity into one clear next action.
- **Support without judgment**: no streak pressure, guilt, red failure states, or moral language about food and activity.
- **Visible uncertainty**: show confidence, assumptions, and the ability to correct AI-derived information.
- **Safety before optimization**: pain and concerning self-reported patterns change the experience before performance goals do.
- **Fast daily use**: the core check-in and plan should be understandable in under a minute.
- **Accessible by default**: legible contrast, touch targets, reduced motion, and plain-language labels.

## Visual Style

The interface is calm, functional, and warm rather than clinical or decorative.
Use an ivory canvas, paper surfaces, plum as the primary action color, sage for
completion and restoration, muted rose for supportive context, and lavender for
cycle context. Favor restrained shadows, compact rounded controls, clear
typographic hierarchy, and information-dense but breathable layouts.

Avoid body-comparison imagery, urgency cues, aggressive progress visuals, and
large decorative gradients. Use icons for familiar tools and icon-plus-text only
for clear actions.

## Tone Of Voice

Use concise, calm, practical language. Prefer "may", "could", and "consider"
when evidence is incomplete. Address the user directly, avoid promises, and do
not frame missed activity or food choices as failures. Medical escalation uses
the exact phrase: "consider discussing this with a qualified clinician."

## Bottom Navigation

Bottom navigation is persistent in the authenticated product and contains five
items: Today, Calendar, Workouts, Nutrition, and Analytics. Each item has a
recognizable icon and a short label. The active tab is clear through color and
weight, not size shifts. Health Navigator opens from contextual cards and does
not compete for a primary navigation slot.

## Today Dashboard UX

Today is the default landing surface. It shows:

- A compact daily check-in entry point or completion summary.
- A single primary plan card with movement intent, duration, intensity, and a short rationale.
- Separate supporting actions for nutrition and recovery.
- A visible pain-aware state that replaces training actions with safe, lower-intensity choices.
- Context labels for self-reported signals and cycle data without declaring causation.

The primary action is either complete check-in, start the plan, or continue the
current workout. Do not show competing primary calls to action.

## Calendar UX

Calendar is a date-based view of cycle logs, symptoms, check-ins, workouts,
meals, and personal notes. Each day uses small, accessible markers with a
legend; it must not imply a predicted medical event. Tapping a day opens a
summary and permits correction. Cycle estimates remain visibly approximate and
can be turned off.

## Workout Page UX

The Workout page presents one session at a time: intent, time budget,
intensity, exercise list, cues, rest, and feedback. Users can reduce intensity,
skip, or replace an exercise. Selecting pain immediately pauses the exercise,
removes it from the active plan, and offers a safer alternative or recovery
option. Completion feedback captures effort, pain, and notes without requiring
long forms.

## Nutrition Page UX

Nutrition supports a meal log rather than a scorecard. Photo analysis shows
identified foods, estimated portions, nutrient ranges, confidence, uncertain
factors, and one follow-up question when helpful. The user must be able to
correct components and portions before saving. Daily context focuses on gentle,
practical support such as meal regularity, hydration, or protein inclusion; it
does not prescribe restrictive behavior.

## Analytics UX

Analytics shows trends in energy, mood, sleep, stress, symptoms, training load,
and completion over user-selected periods. It explains that trends are not
medical conclusions. Insights must link to supporting observations and offer a
way to hide or correct data. Avoid rankings, body scores, and uncontextualized
correlations.

## Health Navigator UX

Health Navigator is a calm, contextual surface for patterns worth noticing. It
does not diagnose, triage emergencies, or substitute for care. It summarizes
user-entered patterns, explains uncertainty, and can suggest that the user
"consider discussing this with a qualified clinician." It may prepare a
shareable, user-controlled summary but never sends data automatically.

## Loading States

Use stable skeletons for plan, calendar, list, and analytics layouts so content
does not shift. AI tasks show the current non-sensitive step, a cancel option
where possible, and a clear reminder that estimates may be approximate. Never
present a loading state as a clinical assessment.

## Empty States

Empty states explain the immediate value of adding one piece of context and
offer one relevant action. Examples: complete the first check-in, add a meal,
start a workout, or log a symptom. They do not use shame, pressure, or false
progress claims.

## Error States

Errors use plain language, preserve entered data, and provide a retry or
alternative manual path. Photo failures explain supported formats and privacy
limits without exposing implementation details. AI unavailability falls back to
deterministic, non-medical guidance where safe; otherwise it says that a plan
cannot be generated right now.
