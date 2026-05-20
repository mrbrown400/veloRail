---
name: velorail-browser-verification
description: Use for strict VeloRail browser checks and Playwright regression planning.
---

# VeloRail Browser Verification

Use this skill when Linear labels, file changes, or task scope require browser coverage.

## Commands

```bash
npm run test:browser:required -- --grep @<task-id>
npm run test:browser:required -- --grep @smoke
```

## Expectations

- Add or update tagged Playwright tests for user-visible map, routing, overlay, and responsive behavior.
- Keep tests deterministic and avoid depending on live map clicks where a synthetic app event is the established test seam.
- If Google Maps is unavailable, report the blocker and the fallback tests that were run.
