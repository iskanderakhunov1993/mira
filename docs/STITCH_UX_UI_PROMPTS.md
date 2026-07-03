# Mira Stitch UX/UI Prompt Pack

Use these prompts in Google Stitch to generate high-fidelity UI directions for Mira. Stitch can generate UI from natural-language descriptions, image references, and iterative refinements; Google's own materials describe text prompts, image input, theme selectors, and export to Figma as part of the workflow. Prefer English prompts for Stitch output quality, then localize final UI copy to Russian in implementation.

## Global Product Prompt

```text
Design a mobile-first high-fidelity UI for "Mira", a private women's cycle and wellbeing diary.

Mira helps a user understand today's cycle context, track health facts, notice cautious patterns, and prepare a doctor-ready report. It is not a diagnostic app, fertility predictor, emergency triage tool, or calorie policing product.

Audience:
Women who want a calm, private, low-friction way to track cycle, pain, symptoms, mood, energy, sleep, and lifestyle context before discussing patterns with a qualified clinician.

Core navigation:
Today, Care, Track, Analysis, Report, Profile.

Visual direction:
Create a premium iOS-style health app. Calm, trustworthy, warm, minimal, data-rich but not clinical. Use a dark espresso/charcoal surface for the main app shell with controlled high-contrast accent colors. Primary accent: electric lime for active safe actions. Secondary accent: vivid pink for period/pain signals. Neutrals: warm black, soft clay, off-white text, muted taupe labels. Avoid purple gradient-heavy wellness design, beige spa aesthetic, decorative blobs, mascots, and stock photos.

Layout:
Mobile-first. Dense but breathable. Use large readable headings, compact cards, clear segmented controls, icon buttons, bottom tab navigation, and fixed primary actions. Cards have 18-24px radius only where they are real content containers. Avoid nested cards.

Tone:
Calm, practical, non-judgmental. Use cautious language: "may", "could", "first signs", "based on N entries". Never diagnose. Use this medical escalation phrase when needed: "consider discussing this with a qualified clinician."

Privacy:
Sex and personal notes must be excluded from doctor report by default. Report export must show explicit privacy controls. Local-first privacy should be visible and reassuring.

Generate a coherent multi-screen app concept with these screens:
1. Today
2. Track
3. Care
4. Analysis
5. Report
6. Profile
```

## Screen Prompt: Today

```text
Design the Today screen for Mira.

Job of screen:
Answer "What is happening with me today?" in under 5 seconds.

Content:
- Current date.
- Large cycle status module: cycle day, phase, days until period or delay.
- One concise explanation of today's context.
- Three actions: log period, add symptoms, "I feel pain".
- A compact mini calendar strip or cycle history link.
- If there are red flags, show one calm safety card. Do not create alarm fatigue.

Do not include:
- Long analytics charts.
- Food, water, or workout inputs.
- Article recommendations.
- Decorative illustrations.

Visual:
Dark warm background, large centered cycle number, lime primary action, pink period/pain accents, bottom tab navigation visible.
```

## Screen Prompt: Track

```text
Design the Track screen for Mira.

Job of screen:
Answer "What happened on this day?"

Content:
- Horizontal recent-day selector with dots for saved data and notes.
- Selected day summary: cycle day, period, pain, mood, energy, sleep, note state.
- Primary add/edit button.
- Medical tracking categories: period, pain, symptoms, mood, energy, sleep, sex, discharge, PMS, medications, personal note.
- Privacy hint: personal notes stay private and are excluded from doctor report by default.

Interaction:
Use modal or bottom sheet category picker for quick entry. Make backfilling previous days easy.

Visual:
Compact, diary-like, dark UI, structured tiles, high tap targets, no shame or streak pressure.
```

## Screen Prompt: Care

```text
Design the Care screen for Mira.

Job of screen:
Answer "What lifestyle context may affect how I feel?"

Content:
- Water amount with plus/minus controls.
- Movement/walking segmented choice.
- Training load segmented choice: none, light, medium, heavy.
- Food context chips: usual, little food, sweets, heavy food.
- Skin/body context chips.
- Weight entry.
- Save confirmation explaining that Care data supports Analysis and Report context.

Do not include:
- Period tracking.
- Diagnosis.
- Calorie scoring.
- Diet judgment.

Visual:
Dark premium utility surface. Use clear icon-led controls and compact stats. Lime for saved/healthy actions, muted neutral for optional context, pink for body/cycle context.
```

## Screen Prompt: Analysis

```text
Design the Analysis screen for Mira.

Job of screen:
Answer "What repeats, how reliable is it, and what should I do?"

Content:
- Time range selector: current cycle, 3 cycles, 6 cycles, 12 cycles.
- Insight cards with:
  - What Mira noticed.
  - Why it may matter.
  - What to do next.
  - Reliability.
  - Based on N entries.
- Cycle history section.
- Symptoms, pain, mood, sleep, care-context sections.
- Red flag card with button to open Report.

Rules:
If N < 5, use "first signs" language, not conclusions. Avoid strong causation.

Visual:
Data-rich but calm. Use line charts and bar charts sparingly. Strong hierarchy. Each insight should be scannable in 6 seconds.
```

## Screen Prompt: Report

```text
Design the Report screen for Mira.

Job of screen:
Answer "What facts can I bring to a doctor?"

Content:
- Header: Doctor report.
- Period selector: 1 cycle, 3 months, 6 months, 12 months.
- Stats: days with data, symptoms, questions, red flags.
- Privacy controls before export:
  - period dates on
  - delays on
  - pain on
  - symptoms on
  - mood and energy on
  - sleep on
  - doctor questions on
  - personal notes off by default
  - sex off by default
- Urgent help card with calm wording.
- Main doctor highlights.
- Questions to ask a clinician.
- Export buttons: print/PDF, TXT, copy questions.

Safety:
The report is not a diagnosis. Include a note that the user can consider discussing repeated or severe symptoms with a qualified clinician.

Visual:
This screen can use a lighter printable report area inside the dark app shell. Make privacy controls highly visible and trustworthy.
```

## Screen Prompt: Profile

```text
Design the Profile screen for Mira.

Job of screen:
Answer "How do I control my data and cycle settings?"

Content:
- User card: name, cycle day, number of entries, storage mode, protection state.
- Cycle settings.
- Privacy settings: PIN, hidden notifications, private marks, cloud exclusion categories.
- Reminders.
- Export all data.
- Delete all data.
- Short local-first privacy explanation.

Do not include:
- Partner mode.
- Religious mode.
- Premium upsell.
- AI settings.

Visual:
Trustworthy settings surface. Calm dark UI, clear rows, destructive action visually separated.
```

## Stitch Iteration Prompts

Use these after the first generation.

```text
Make the design more MVP-focused: remove article/content surfaces, partner sharing, religious mode, AI workout generation, and full nutrition tracking. Keep only Today, Care, Track, Analysis, Report, and Profile.
```

```text
Increase trust and privacy clarity. Make the Report privacy checkboxes more prominent. Sex and personal notes must be visibly off by default.
```

```text
Make the UI feel like a premium iOS health utility, not a wellness landing page. Reduce decorative elements, remove gradients and illustrations, use compact controls and clear information hierarchy.
```

```text
Improve mobile ergonomics. Ensure all buttons have at least 44px touch targets, labels do not truncate awkwardly, bottom navigation remains stable, and primary actions are reachable with one thumb.
```

```text
Make Analysis less diagnostic. Add sample size and reliability labels to every insight card. Replace strong conclusions with cautious wording.
```

## Design Tokens For Implementation

```text
Canvas: #050505
Surface: #1D1816
Inset surface: #2A2523
Border: #2E2826
Primary action: #84E600
Cycle/pain accent: #F9359E
Warning: #FFB800
Danger: #FF6B6B
Text primary: #F5F0ED
Text secondary: #B7AAA4
Text muted: #8D817B
Printable paper: #FAF8F5
Printable text: #1A1A1A
```

## Component Checklist

- Bottom tab bar with 6 items.
- Day selector.
- Cycle status ring/card.
- Segmented controls.
- Toggle chips.
- Privacy checkbox rows.
- Export action cluster.
- Red flag safety card.
- Insight card with sample size and reliability.
- Empty state with one clear action.
- Toast/saved confirmation.

## Copy Rules

- Keep UI copy short.
- Russian product copy in final implementation.
- Avoid fear-based language.
- Avoid medical certainty.
- Avoid diet or body judgment.
- Use "consider discussing this with a qualified clinician" for medical escalation.
