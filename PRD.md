# Mira PRD

Версия: 1.0
Дата: 10 июля 2026
Статус: Draft for validation

## 1. Executive Summary

Mira is a privacy-first daily cycle and wellbeing tracker for women who want to understand what is happening with their body today, prepare for upcoming periods, and identify personal patterns without information overload or alarmist medical claims.

The MVP connects four product surfaces, Today, Diary, Analytics, and Knowledge, to one local source of truth. A user can record a meaningful daily entry in under 40 seconds, see an explainable cycle forecast, and receive cautious observations only when enough history exists.

The intended impact is higher trust and sustained tracking through simplicity, transparent predictions, user-owned data, and useful interpretation rather than a large collection of disconnected metrics.

## 2. Problem Statement

### Who has this problem

[assumption] The primary user is an adult woman with a regular or somewhat variable cycle who wants to track her cycle and daily wellbeing, but is not currently using the product primarily to conceive or prevent pregnancy.

### Problem

Existing period trackers commonly create one or more of these problems:

- Predictions appear more certain than the underlying data supports.
- Basic tracking becomes hidden behind subscriptions or repeated upgrade prompts.
- Daily input is slow, cluttered, or disconnected from later insights.
- Missing data is treated as a zero or as confirmation that a symptom did not occur.
- Dashboards show empty or misleading charts before enough history exists.
- Pregnancy and fertility content is shown even when it does not match the user's goal.
- Users cannot easily export, move, or delete their history.
- Medical language can pathologize normal variation or increase anxiety.

### Why it is painful

The user cannot confidently answer:

- When are my next periods likely to start?
- Is this change unusual for me?
- Does this symptom repeat around the same time?
- How did I feel over the last week or cycle?
- What information should I bring to a medical appointment?
- Who controls my reproductive health data?

### Evidence

Desk research across Flo, Clue, Stardust, Glow, Ovia, Apple Health, Euki, Drip, public reviews, forums, and published studies found repeated demand for:

- explainable predictions and better support for irregular cycles;
- simple and customizable logging;
- symptom patterns rather than raw charts;
- privacy, local storage, and clear data controls;
- import, export, and reports for clinicians;
- fewer paywalls, popups, and pregnancy-first assumptions.

Supporting research:

- [Experiences of users of period tracking apps, UCL](https://discovery.ucl.ac.uk/id/eprint/10184475/)
- [The role of menstrual apps in healthcare](https://nzmj.org.nz/journal/vol-136-no-1570/the-role-of-menstrual-apps-in-healthcare-provider-and-patient-perspectives)
- [Characterizing physiological and symptomatic variation](https://arxiv.org/abs/1909.11211)
- [Benefits and harms of period tracking apps](https://www.sciencedirect.com/science/article/pii/S0738399126002880)

## 3. Target Users and Jobs-to-be-Done

### Primary proto-persona

**Name:** Observant Olga
**Context:** Uses a phone daily, wants a calm way to understand cycle-related changes, and will log only if the interaction is quick.
**Current behavior:** Remembers period dates imperfectly, occasionally tracks symptoms, and opens an app mainly near the expected start date.
**Pain:** Existing products feel noisy, judgmental, or too focused on pregnancy.
**Goal:** Prepare for upcoming periods and understand whether symptoms repeat.

[assumption, validate] Privacy is a reason for product choice, not only a minimum expectation.

### Secondary proto-persona

**Name:** Variable Vera
**Context:** Her cycle changes enough that a single-date prediction is often wrong.
**Pain:** Trackers repeatedly move the prediction or label the cycle as abnormal.
**Goal:** See a realistic range and maintain a useful history without feeling that she has failed the model.

### Core JTBD

1. When I open the app, help me understand today's cycle state so I can prepare without doing calculations.
2. When I notice a symptom or change, let me record it quickly so I can remember and compare it later.
3. When I have enough history, show me cautious personal patterns so I can make better daily decisions or prepare for a clinician conversation.
4. When I stop using the product, let me export or delete my data so I remain in control.

## 4. Positioning and Strategic Context

### Positioning statement

For women who want to understand their cycle and wellbeing without complex charts or content overload, Mira is a private daily cycle tracker that helps them record how they feel in seconds and gradually explains their personal patterns.

Unlike content-heavy or fertility-first trackers, Mira focuses on today's state, explainable forecasts, cautious personal observations, and user-owned data.

### Product principles

1. Explain confidence, never manufacture certainty.
2. One source of truth for daily records and analytics.
3. Missing is not zero and not “no symptom.”
4. Show an interpretation only when it enables a decision.
5. Use personal range before population labels.
6. Never diagnose or claim causation.
7. Keep basic tracking, history, export, and deletion available.
8. Sensitive modules are optional and private by default.

### Competitive position

Mira occupies the space between:

- Clue's science-oriented tracking;
- Apple Health's device integration and export;
- Euki and Drip's privacy-first approach;
- the visual warmth and approachability of Stardust.

The product will not compete with Flo or Glow on content volume, community size, or pregnancy workflows in the MVP.

## 5. Solution Overview

### Primary navigation

Bottom navigation contains four destinations:

1. **Today:** orientation and quick actions.
2. **Diary:** structured entry for a selected day.
3. **Analytics:** history, comparisons, and patterns.
4. **Knowledge:** context-aware educational materials.

The full calendar and profile are accessed from Today. Calendar is a tool within the daily flow, not a separate bottom tab.

### Core user flow

```text
Open Today
→ understand cycle state and forecast
→ record a symptom, mood, water, or period
→ data is stored in the selected day's entry
→ Diary reflects the same entry
→ Analytics recalculates from the same source
→ when enough data exists, show one cautious observation
→ optionally read a related Knowledge article
```

### 5.1 Today

Today answers: “What is happening with me now?”

Required blocks, in priority order:

1. Profile, date, and calendar access.
2. Seven-day date strip.
3. Cycle day, next-period range, and prediction confidence.
4. Fertile-window language only when enough data exists, always with a contraception disclaimer.
5. Quick actions: period, symptoms, intimate life.
6. One quick day-rating control.
7. Up to four configurable daily metrics.
8. Diary completion progress.
9. At most one personal observation.
10. Compact previous-cycle teaser.
11. At most one contextual Knowledge article.

Rules:

- Full history and large charts do not appear on Today.
- A repeated tap on an existing period entry opens edit, not delete.
- Future days can display predictions but cannot accept factual entries.
- Empty sleep is not displayed as zero hours.

### 5.2 Diary

Diary answers: “What happened on this day?”

MVP modules:

- overall day rating;
- period status and flow;
- symptoms and severity;
- mood and emotion tags;
- energy from 1 to 5;
- sleep duration and quality;
- water;
- free-text note and context tags.

Later optional modules:

- activity and steps;
- intimate life;
- appetite and nutrition context;
- wearable-sourced data.

Interaction rules:

- Quick controls save immediately.
- Multi-field forms save on explicit confirmation.
- Completing a day is optional and does not freeze the record.
- Past days remain editable.
- Visible modules are user-configurable.
- Missing, explicitly absent, and present are distinct states.

### 5.3 Analytics

Analytics answers: “What changed and what repeats?”

Required structure:

1. Consistent comparison selector: the last 3, 6, or 12 completed, non-excluded cycles. A single completed cycle may be opened as a factual detail view, not as a comparison period.
2. Data-sufficiency card.
3. At most one primary observation above the fold.
4. Cycle metrics and history.
5. Cycle-length chart with a personal range band.
6. Period-duration comparison.
7. Symptom frequency, severity, and cycle-day heatmap.
8. Mood, energy, and day-rating trends.
9. Sleep and activity only when enabled and sufficiently populated.
10. Full cycle history.
11. Exportable report.

Minimum evidence rules:

| Output | Minimum data |
|---|---|
| Current cycle day | One valid start date |
| Completed cycle length | Two valid start dates |
| Two-cycle comparison | Two completed cycles, with both facts shown and no personal average or range |
| Preliminary average cycle length | Three completed cycles |
| Personal range | Three completed cycles |
| Personal cycle dynamics | Six completed cycles |
| Longer-history forecast | Twelve completed cycles |
| Regularity language | At least three completed cycles; stronger language after six |
| Frequent symptom | Three symptom entries |
| Cycle-timed symptom | Repetition across at least two cycles |
| Mood trend | At least ten mood entries |
| Repeated wellbeing pattern | Two to three cycles |
| Sleep and energy relationship | Fourteen paired entries |

Every observation is labeled as one of:

- preliminary observation;
- repeated across several cycles;
- stable personal pattern.

The product describes associations, not causes.

### 5.4 Knowledge

Knowledge answers: “How can I understand this?”

Main sections:

- For you;
- all materials;
- saved materials;
- categories and search.

MVP content categories:

- cycle basics;
- symptoms;
- mood and energy;
- sleep and daily wellbeing;
- intimate health;
- self-care;
- when to seek professional help.

Content rules:

- Recommendations use transparent rules, not AI.
- The user can see why a material was recommended.
- Medical content displays reviewer and review date.
- Articles separate general information, self-care, and signs requiring care.
- Articles can open the related Diary module.
- No public comments, private messaging, forum, or AI health chat.

Initial content target: 15 reviewed articles.

### 5.5 Calendar

Calendar is opened from Today and supports:

- actual period days;
- predicted range;
- days with entries;
- selected date;
- a clear legend;
- entry into the selected day's Diary.

Future factual period dates are rejected at the input boundary, storage boundary, and calculation boundary.

### 5.6 Profile and data control

Profile contains:

- cycle settings;
- Diary module settings;
- water and notification goals;
- privacy controls;
- export;
- full deletion;
- Knowledge library access;
- product information and disclaimers.

MVP storage remains local. Export and deletion must be understandable without legal language.

### 5.7 Prediction rules

Forecast output includes:

- start date or date range;
- confidence level;
- number of cycles used;
- short explanation.

Rules:

- No valid history produces no forecast.
- One valid cycle plus profile estimate produces a preliminary forecast.
- Two or more completed cycles produce a range.
- Old predictions advance to the next plausible cycle rather than becoming “today.”
- Future period starts never participate in calculations.
- Fertility language is explicitly non-contraceptive.

## 6. Success Metrics

[flag] No production baseline exists. Targets are provisional and must be revised after instrumentation and the first usability cohort.

### Primary metric

**Meaningful weekly tracking rate:** current unknown → target 40% of activated users record data on at least 3 distinct days in a rolling week, measured 30 days after launch.

### Activation metrics

- First meaningful entry: unknown → 60% of new users within their first session.
- Time to first meaningful entry: unknown → median under 2 minutes.
- Onboarding completion: unknown → 70%.

### Usability metrics

- Quick daily record time: unknown → median under 40 seconds.
- Water addition: completed in no more than two actions.
- Symptom addition: completed in no more than four actions.
- Started-entry completion: unknown → at least 75%.

### Value metrics

- Analytics adoption after three cycles: unknown → 30% open Analytics within 7 days of becoming eligible.
- Observation usefulness: unknown → 60% of rated observations marked useful.
- Contextual article open rate: unknown → 20% monthly among eligible active users.
- Report generation: establish baseline during beta.

### Guardrails

- Impossible date states: 0 known occurrences.
- Negative cycle lengths: 0.
- Medical conclusions based on insufficient data: 0.
- Sensitive data included in export without opt-in: 0.
- User-reported alarming or judgmental copy: below 2% of feedback.

## 7. Epic Hypothesis, Stories, and Requirements

### Epic hypothesis

If we connect quick daily tracking, explainable predictions, and evidence-gated personal observations for women who want to understand their cycle, then at least 40% of activated users will record meaningful data on three days per week within 30 days of launch.

### Story 1: Understand today

As an adult cycle tracker who wants to prepare for her period, I want to see today's cycle state and forecast confidence so that I know what to expect without treating an estimate as certainty.

**Acceptance criteria**

- Given no valid period history, when Today loads, then the product shows a no-forecast state and a period-entry action.
- Given a past date was previously selected, when the Today tab is opened, then the selected date resets to the actual local calendar day.
- Given one valid cycle, when Today loads, then the forecast is labeled preliminary.
- Given three completed cycles, when Today loads, then a date range, confidence, and cycle count are visible.

### Story 2: Record a symptom

As an adult who notices a physical change, I want to record a symptom and severity quickly so that I can check whether it repeats.

**Acceptance criteria**

- Given Today or Diary is open, when a symptom and severity are saved, then the selected day's single entry is updated.
- Given the same symptom already exists, when it is edited, then the existing record changes rather than duplicating.
- Given the date is in the future, when symptom input is requested, then factual saving is blocked.

### Story 3: Edit the Diary

As an adult who remembers information later, I want to edit a past day so that my history remains accurate.

**Acceptance criteria**

- Given a past date is selected, when a module is edited and saved, then Today, Diary, and Analytics read the updated value.
- Given a field was never completed, when Analytics runs, then it is treated as missing rather than zero.

### Story 3a: Confirm a period episode

As an adult tracking bleeding, I want to distinguish the start, continuation, and confirmed end of a period so that the product does not infer duration from missing days.

**Acceptance criteria**

- Given a period start is saved without a confirmed end, when summaries load, then they say “period noted for N days” and “end not confirmed.”
- Given an end date is explicitly confirmed, when summaries load, then the duration is presented as a completed fact.
- Given a day has no bleeding entry, when duration is calculated, then the empty day is not interpreted as a confirmed end.

### Story 4: Understand a pattern

As an adult with several tracked cycles, I want to see a cautious personal observation so that I can prepare for recurring symptoms.

**Acceptance criteria**

- Given evidence is below the minimum threshold, when Analytics loads, then an empty or preliminary state appears instead of a definitive claim.
- Given a symptom repeats across sufficient cycles, when the observation appears, then the supporting period and source entries are accessible.
- Given a cycle is open or excluded, when averages, ranges, patterns, or reports are calculated, then that cycle is not included.
- Given fewer than three completed cycles exist, when cycle analytics loads, then facts are shown without a personal average or range.

### Story 5: Control data

As a privacy-conscious tracker, I want to export or delete my data so that I remain in control of sensitive information.

**Acceptance criteria**

- Given export is requested, when categories are selected, then intimate data remains excluded unless explicitly enabled.
- Given full deletion is confirmed, when the action completes, then locally stored health data is removed.

### Non-functional requirements

- Mobile-first layout.
- Empty, loading, save-failure, and invalid-data states for each core surface.
- Local date calculations that do not shift because of UTC conversion.
- Explainable source data for each analytical observation.
- No sensitive information in default notification copy.
- Accessible labels, touch targets, contrast, and keyboard behavior.

## 8. Out of Scope

The MVP explicitly excludes:

- teen and first-period mode;
- clinician routing and lab-order workflow;
- pregnancy planning and pregnancy tracking;
- contraceptive decision support;
- AI diagnosis or AI interpretation of notes;
- community, forums, comments, and private messaging;
- partner mode;
- calorie counting and a full nutrition diary;
- automatic treatment or medication recommendations;
- direct lab result interpretation;
- a large universal content feed;
- wearable integrations in the first release.

Tradeoff: the MVP serves fewer life stages and offers less content breadth in exchange for a clearer daily value proposition, lower safety risk, and faster validation.

## 9. Dependencies and Risks

### Product dependencies

- Final content taxonomy and the first 15 reviewed articles.
- UX writing for prediction confidence and insufficient-data states.
- A consistent symptom and severity taxonomy.

### Technical dependencies

- Migration of the current local storage shape.
- A single daily-entry schema shared by all surfaces.
- Calculation tests for dates, ranges, missing data, and thresholds.
- Export format and privacy defaults.

### Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Users perceive forecasts as medical certainty | Trust and safety harm | Range, confidence, explanation, disclaimer |
| Too many Diary modules reduce completion | Lower activation | Configurable modules and quick mode |
| Analytics creates false patterns | Anxiety and misinformation | Evidence thresholds and source drill-down |
| Knowledge becomes a low-use content tab | Wasted navigation slot | Contextual recommendations and usage validation |
| Local-only storage causes data loss | Loss of trust | Export in MVP, backup later |
| Sensitive data appears unexpectedly | Privacy harm | Optional modules and private defaults |
| Existing user data breaks during migration | Product regression | Versioned migration and fallback recovery |

### External dependencies

- Medical review is required before publishing symptom safety content.
- Regional legal review is required before adding teen mode, clinician booking, or medical routing.
- Apple Health and Health Connect are deferred integrations.

## 10. Validation Plan and Open Questions

### Tiny acts of discovery before full implementation

1. Test clickable prototypes of Today and Diary with 8–10 target users.
2. Measure whether a meaningful daily record can be completed in under 40 seconds.
3. Show date-only versus range-plus-confidence forecasts and assess comprehension.
4. Test whether users understand the difference between Diary and Analytics.
5. Test whether Knowledge deserves a permanent bottom-navigation position.

### Open questions

- Is the primary segment regular-cycle tracking, or should irregular cycles lead the positioning?
- Which four Diary modules are most valuable above the fold?
- Does water support retention or distract from cycle tracking?
- Is “Knowledge” understood better than “Articles” by the target audience?
- What export format provides the most value before clinician integrations?
- Should activity remain manual until wearable integrations exist?
- Which current local data must be migrated, repaired, or discarded?
- What monetization model keeps basic tracking, history, and export accessible?

## 11. Release Slices

### R1: Walking skeleton

- New bottom navigation.
- Today with valid-date forecast states.
- Diary with period, symptom, mood, energy, sleep, water, and note.
- Basic Analytics with cycle history and honest empty states.
- Knowledge with a small static reviewed set.
- Profile export and delete.

### R2: Interpretation

- Symptom severity and heatmap.
- Personal range and confidence labels.
- Evidence-gated observations.
- Contextual Knowledge recommendations.
- Configurable Diary modules.
- PDF report.

### R3: Expansion

- Apple Health and Health Connect.
- PIN and biometrics.
- Backup and restore.
- Activity automation.
- Adaptive reminders.
- Clinically reviewed care-guidance module.

### Future, separate product track

- Teen and first-period mode.
- Trusted-adult support.
- Adolescent privacy and regional consent rules.
- Clinician search and appointment preparation.
- Clinician-assigned test plan, without app-directed testing.

---

Generated with [product-manager-skills](https://github.com/Digidai/product-manager-skills).
