# Mira Engineering Instructions

## Pinned Mira Project Context

This repository is the Mira femtech product. For product, UX/UI, and implementation work, use the local Codex skills installed in `~/.codex/skills`:

- `$mira-product-strategist` for product analysis, prioritization, user flows, P0/P1/P2 decisions, and specs.
- `$mira-ux-ui-designer` for mobile-first iOS-style UX/UI, screen simplification, and visual component choices.
- `$mira-frontend-implementer` for scoped React/Next/Tailwind implementation that preserves Mira data flow.

Core product architecture:

- Today shows a short daily summary and quick CTAs only.
- Track/Diary is the source for manual medical entries: period, symptoms, pain, mood, sex, tests, and notes.
- Care is only for lifestyle factors: water, activity, food, weight, supplements, skin/hair context.
- Analytics shows cautious patterns, not diagnosis. Every insight needs sample size and reliability.
- Report is the main outcome: doctor-ready facts with explicit privacy controls before export.

P0 rules that must not regress:

- Keep cycle day, delay, phase, and next-period logic consistent across screens.
- Do not create disconnected data stores. If data appears in Analytics or Report, wire it through the active app flow.
- Sex and personal notes must be excluded from doctor export by default.
- Red flags must be visible and clear without turning every normal day into an emergency.
- Avoid editing unused legacy screens; confirm active imports before changing UI.

## Expo

Before writing Expo code, read the exact versioned documentation at
https://docs.expo.dev/versions/v56.0.0/.

## Working Style

- Work in small, reviewable changes.
- Preserve useful existing logic unless a change is necessary for the task.
- Prefer explicit TypeScript types and runtime validation at system boundaries.
- Avoid large rewrites unless they are necessary and the task explicitly calls for them.
- Run the relevant build and lint checks when possible.
- At the end of a task, summarize changed files, verification performed, and the recommended next step.

## Security And AI

- Do not add secrets, API keys, tokens, or private credentials to the repository.
- Do not implement real AI calls unless the task explicitly asks for backend integration.
- Never expose an OpenAI API key in client code. AI requests belong in secure backend services or Supabase Edge Functions.
- Keep AI output structured and validate it before use.

## Product Safety

- Do not present diagnoses, fertility, pregnancy, disease, or medical conditions as facts.
- Phrase medical escalation as: "consider discussing this with a qualified clinician."
- Do not recommend medication or supplements as treatment.
- Stop or reduce fitness intensity when pain is reported.
