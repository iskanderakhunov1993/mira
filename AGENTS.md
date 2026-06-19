# Mira Engineering Instructions

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
