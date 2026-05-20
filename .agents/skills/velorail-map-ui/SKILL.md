---
name: velorail-map-ui
description: Use for VeloRail map controls, overlays, route results, responsive UI, accessibility, and visual polish.
---

# VeloRail Map UI

Use this skill for browser-facing map and route work.

## Rules

- Keep Google Maps as the runtime for map rendering, gestures, markers, polylines, and map events.
- Preserve the existing design system and compact operational UI.
- Keep overlay controls grouped by scenario family.
- Make official, visionary, freight, and hypothetical passenger scenarios visually distinct.
- Surface provenance, uncertainty, status, and source links in metadata UI.

## Verification

Run `npm run quality` and strict browser tests with the issue tag when UI changes are user-visible:

```bash
npm run test:browser:required -- --grep @<task-id>
```

If live Google Maps cannot load, report the exact blocker and use the smallest offline regression that still exercises the changed behavior.
