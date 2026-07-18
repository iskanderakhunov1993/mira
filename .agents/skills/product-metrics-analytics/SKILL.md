---
name: product-metrics-analytics
description: Define North Star, activation, retention, engagement, feature adoption, funnels, analytics events, experiment metrics, and success criteria. Use when measuring Mira features, designing product analytics, evaluating Hormonoscope or Cycloscope, or deciding whether a release created value.
---

# Product Metrics and Analytics

## Context

Read `docs/product/METRICS.md`, `PRODUCT_OVERVIEW.md`, `USER_FLOWS.md`, `BUSINESS_MODEL.md`, and the relevant feature scope.

## Rules

- Do not send health content, notes, symptoms, cycle dates, or intimate data to analytics.
- Prefer local or privacy-preserving events.
- Separate product interaction events from health records.
- Define denominators and eligibility for every rate.

## Workflow

1. State the user value being measured.
2. Define one primary outcome metric.
3. Add activation, retention, adoption, and guardrail metrics.
4. Map the funnel and drop-off points.
5. Define event names, triggers, and safe properties.
6. Set minimum sample and decision thresholds where possible.

## Output

- North Star and rationale.
- Metric tree.
- Funnel.
- Event taxonomy.
- Feature success criteria.
- Experiment readout template.
- Privacy guardrails.
