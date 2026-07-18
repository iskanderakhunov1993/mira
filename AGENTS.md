# Mira Product and Engineering Rules

## Product context

Before product, UX, roadmap, analytics, onboarding, monetization, or feature-scope work, read the relevant files in `docs/product/`.

Start with:

1. `docs/product/PRODUCT_OVERVIEW.md`
2. `docs/product/PRODUCT_PRINCIPLES.md`
3. `docs/product/FEATURES.md`
4. `docs/product/DECISIONS.md`

Read other product documents only when relevant. Treat `PRD.md` as historical broad context; current decisions in `docs/product/DECISIONS.md` take precedence.

## Core rules

- Position Mira as “Понимай себя”.
- Use the product formula: metric → context → insight → action.
- Keep core tracking, history, import, export, and deletion free.
- Preserve the local-first PWA architecture unless a task explicitly changes it.
- Keep scientific or health-related functions separate from entertainment features.
- Never turn missing data into zero, absence, or evidence.
- Never diagnose, claim causation, or manufacture forecast certainty.
- Keep Today focused on orientation and quick action, not full analytics.
- Design mobile-first and verify Russian copy fits narrow screens.
- Every feature must solve a clear user problem; do not expand scope only to add capabilities.
- Prefer calm minimalism, clear hierarchy, and a restrained bento grid.
- Do not duplicate calendars, analytics, or data-entry paths.
- Do not use manipulative streak mechanics.
- Collect sensitive data only when it has a clear product purpose.

## Feature boundaries

- Hormonoscope uses only personal observations from similar days and must disclose insufficient data.
- Cycloscope is an optional playful mood feature and must not use cycle phase, hormones, symptoms, or health metrics.
- Analytics requires data sufficiency and cautious language.
- Sensitive export fields remain opt-in.

## Documentation maintenance

- Record material product decisions in `docs/product/DECISIONS.md`.
- Update `docs/product/FEATURES.md` when feature scope changes.
- Update `docs/product/PRODUCT_AUDIT.md` after a full audit.
- Mark assumptions explicitly in `docs/product/RESEARCH.md`.
- Do not duplicate the same rule across many files; link to the source of truth.

## Working process

Before materially changing a feature:

1. Read the related documents in `docs/product/`.
2. Find the existing components, states, and user flows.
3. Describe the current user and product problem.
4. Propose a focused implementation plan.
5. Check whether simplifying an existing feature solves the problem.
6. Only then modify code.

After a material product change, update the relevant product documentation.

## Engineering expectations

- Prefer the existing architecture and components.
- Do not add a dependency without a documented reason.
- Extend an existing component when safe instead of creating a duplicate.
- Preserve strict typing.
- Verify mobile responsive behavior and Russian copy on narrow screens.
- Handle loading, empty, error, and offline states when relevant.
- Run the configured lint, typecheck, build, and tests after changes; do not invent missing scripts.
- Add tests for date, cycle, forecast, and analytics calculations when their behavior changes.
- Review the final diff for regressions and unrelated changes.

## Definition of Done

A task is complete when:

- the full requested user flow works;
- primary edge cases are handled;
- mobile layouts remain usable;
- there are no obvious accessibility regressions;
- configured tests, lint, typecheck, and build pass, or unrelated failures are explicitly reported;
- relevant documentation is updated;
- the result follows Mira product principles;
- the final diff has been reviewed.

## Product skills

- Use `.agents/skills/product-strategy-audit/SKILL.md` for positioning and value audits.
- Use `.agents/skills/user-flow-audit/SKILL.md` for end-to-end scenarios.
- Use `.agents/skills/ux-ui-product-review/SKILL.md` for product-oriented interface reviews.
- Use `.agents/skills/product-metrics-analytics/SKILL.md` for metrics and event design.
- Use `.agents/skills/feature-prioritization/SKILL.md` for scope decisions.
- Use `.agents/skills/prd-and-user-stories/SKILL.md` for implementation-ready specs.
- Use `.agents/skills/product-risk-review/SKILL.md` for trust, privacy, femtech, legal, and technical risks.
- Use `.agents/skills/qa-release-readiness/SKILL.md` for release audits.
