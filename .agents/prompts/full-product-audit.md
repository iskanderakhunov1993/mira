# Mira Full Product Audit — Master Prompt

Run a complete senior product and UX audit of Mira.

## Required context

1. Read `AGENTS.md`.
2. Use the eight relevant skills in `.agents/skills/`, starting with `product-strategy-audit` and `product-risk-review`.
3. Read every file in `docs/product/`.
4. Treat `PRD.md` as historical context, not the final source of truth.
5. Inspect the active app code and tests to verify what is actually implemented.

## Audit scope

- positioning and target audience;
- first-session value and onboarding;
- Today, Diary, Calendar, Analytics, Knowledge, Report, and Profile;
- cycle forecast clarity and data sufficiency;
- Hormonoscope and Cycloscope boundaries;
- local-first privacy, import, export, deletion, and migration;
- mobile-first UX, hierarchy, accessibility, and copy;
- activation, retention, trust, and value metrics;
- free versus paid boundaries;
- MVP scope, technical-product risks, and roadmap.

## Questions

1. Does Mira clearly deliver “Понимай себя”?
2. Does each major flow follow metric → context → insight → action?
3. What confuses users in the first five seconds?
4. What is duplicated, decorative, premature, or harmful?
5. Where does the product sound medical, scientific, or certain without evidence?
6. Are Hormonoscope and Cycloscope clearly separated?
7. Which P0 issues block trust or core value?
8. Which P1 changes most improve activation and retention?
9. What should be removed from the MVP?
10. What evidence is required before monetization or expansion?

## Deliverable

Update `docs/product/PRODUCT_AUDIT.md` with:

- executive score out of 10;
- current product thesis;
- what works;
- end-to-end flow findings;
- P0/P1/P2 issues;
- top five improvements;
- removal/postponement list;
- metrics and research plan;
- recommended 30/60/90-day roadmap;
- explicit facts, inferences, and hypotheses.

Do not modify application code during the audit unless explicitly requested. Do not invent user research or metrics.
