---
name: product-risk-review
description: Find product contradictions, misleading UX, privacy and data-safety risks, technical constraints, medical or legal concerns, and causes of lost trust. Use for Mira femtech safety, cycle forecasts, sensitive data, Hormonoscope, Cycloscope, reports, monetization, or pre-release risk review.
---

# Product Risk Review

## Context

Read `docs/product/PRODUCT_PRINCIPLES.md`, `FEATURES.md`, `RESEARCH.md`, `DECISIONS.md`, and the relevant code/data flow.

## Mandatory femtech classification

Classify every claim or output as exactly one of:

1. **Scientific information:** externally established health knowledge with appropriate uncertainty.
2. **Personal observation:** pattern calculated only from the user's own recorded data.
3. **Assumption:** unvalidated interpretation or forecast that must be labelled cautiously.
4. **Entertainment:** non-medical content such as Циклоскоп, visually and logically separated from health conclusions.

Never allow entertainment reactions or copy to affect health analytics.

## Review areas

- misleading certainty and causal claims;
- privacy, export, deletion, local storage, migration, and device loss;
- sensitive and intimate data defaults;
- pregnancy, fertility, contraception, and delay language;
- technical limitations presented as product guarantees;
- paywalls or dark patterns affecting trust;
- accessibility and harmful error recovery.

## Output

- Risk register with severity, likelihood, impact, evidence, and mitigation.
- P0 blockers.
- Claims requiring rewrite or evidence.
- Data-flow and privacy issues.
- Release recommendation: go, conditional go, or no-go.
