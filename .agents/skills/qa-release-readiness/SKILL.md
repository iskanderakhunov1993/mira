---
name: qa-release-readiness
description: Verify whether a feature is fully implemented and release-ready against PRD, user flows, edge cases, responsive behavior, accessibility, tests, errors, persistence, and migration. Use for Mira release audits, regression checks, feature completion, smoke testing, or go/no-go decisions.
---

# QA Release Readiness

## Context

Read the feature PRD or decision, relevant `docs/product/` files, active code, tests, and storage migration logic.

## Workflow

1. Build a requirement-to-implementation traceability matrix.
2. Test the happy path and critical alternate paths.
3. Test empty, loading, error, offline, retry, destructive, and recovery states.
4. Check narrow mobile, larger mobile, and desktop framing.
5. Check keyboard, focus, labels, contrast, and reduced-motion implications.
6. Verify local persistence, migration, import, export, and deletion when affected.
7. Run the most specific tests, then build and broader regression tests.
8. Separate new defects from known unrelated failures.

## Output

- Requirement coverage.
- Test matrix and results.
- Defects by P0/P1/P2.
- Known limitations.
- Go/no-go recommendation.
- Exact release blockers and Definition of Done status.
