---
name: prd-and-user-stories
description: Convert product decisions into implementation-ready PRDs, user stories, acceptance criteria, edge cases, dependency maps, and Definition of Done. Use for Mira feature specs, handoff to engineering/design, scope changes, or documenting an approved experiment.
---

# PRD and User Stories

## Context

Read the relevant files in `docs/product/`, always including `PRODUCT_OVERVIEW.md`, `PRODUCT_PRINCIPLES.md`, `FEATURES.md`, and `DECISIONS.md`.

## Required PRD sections

1. Goal and non-goals.
2. Target user and job-to-be-done.
3. Product rationale.
4. User flow.
5. Functional requirements.
6. Content, trust, and privacy rules.
7. Empty, loading, error, offline, and edge states.
8. Dependencies and migration impact.
9. Metrics and experiment plan.
10. Acceptance criteria.
11. Definition of Done.

## User-story format

`As a <segment>, I want <capability>, so that <outcome>.`

Write testable acceptance criteria using Given/When/Then where helpful. Record accepted material decisions in `docs/product/DECISIONS.md`.
