---
name: user-flow-audit
description: Audit onboarding, activation, first value, daily use, return loops, empty states, errors, dead ends, overloaded steps, and recovery paths. Use for Mira onboarding, Today, Diary, Calendar, Analytics, Profile, import/export, or any end-to-end user journey review.
---

# User Flow Audit

## Context

Read `docs/product/USER_FLOWS.md`, `TARGET_AUDIENCE.md`, `PRODUCT_PRINCIPLES.md`, and `METRICS.md`. Inspect the active components and state transitions for the audited flow.

## Workflow

1. Map entry point, intent, actions, outcome, and exit.
2. Identify the first useful result and time-to-value.
3. Check empty, loading, error, offline, retry, and destructive states.
4. Find duplicate steps, hidden dependencies, and dead ends.
5. Verify past, present, and future date behavior when relevant.
6. Check whether the flow creates a reason to return.

## Output

- Flow diagram in text or Mermaid.
- Friction points by severity.
- Broken or missing states.
- Recommended simplified flow.
- Acceptance criteria.
- Activation and return-loop metrics.
