# Frontend Redesign Success Metrics And Gates

This document defines how the VeloRail frontend redesign will be judged. The goal is not generic visual polish. The redesign succeeds when it feels closer to Google Maps where that helps search, routing, map controls, route review, and mobile use, while keeping VeloRail's car-free routing and planning overlays clear.

## Success Metrics

### UX Parity

| Metric | Verification method | Command or evidence |
| --- | --- | --- |
| Search accepts typed LA endpoints and gives visible progress, error, or results after submit. | Browser route-search flow. | `npm run test:browser:required -- --grep @smoke` or targeted `@<issue-id>` test. |
| Route results are scannable by duration, distance, mode sequence, transfers, and selected state. | Spec review, browser assertions, visual/manual browser review when implemented. | `npm run quality`; targeted Playwright route-result grep. |
| Route details support a Google Maps-like itinerary flow while using existing VeloRail route data contracts. | Contract inventory from MBR-57, spec traceability from MBR-60, implementation tests. | `npm run quality`; targeted browser test for the implementation issue. |
| Map controls and layer controls feel map-native and do not fight Google Maps gestures, attribution, or native controls. | Browser review, control positioning checks, overlay tests. | `npm run test:browser:required -- --grep @VR-303`; targeted `@<issue-id>`. |
| Google Maps remains the base runtime for map, gestures, markers, polylines, route display, Places, and Geocoding where feasible. | Architecture review against Google Maps-first policy. | `npm run task:gate -- <issue-id> --explain`; code review evidence. |

### VeloRail Identity

| Metric | Verification method | Command or evidence |
| --- | --- | --- |
| Car-free routing is the primary story. Driving, if present, is explicitly comparison-only or otherwise de-emphasized by owner-approved spec. | Product/design spec review and route-result browser checks. | MBR-60 spec traceability; targeted browser test. |
| Future Transit is opt-in, official-only, and clearly separate from current Google Maps transit service. | Overlay validation, browser toggle checks, metadata review. | `npm run validate:official-future-transit`; `npm run test:browser:required -- --grep @VR-101`; `npm run test:browser:required -- --grep @VR-104`. |
| Visionary, nationalized, and freight conversion overlays keep classification and scenario status visible. | Metadata panel tests and source/disclaimer review. | `npm run test:browser:required -- --grep @VR-305`; `npm run test:browser:required -- --grep @VR-307`. |
| Overlay controls preserve current, future, visionary, and nationalized groupings and accurate visible counts. | Browser layer panel test. | `npm run test:browser:required -- --grep @VR-303`. |
| Source links, confidence, uncertainty, status, and disclaimers remain visible for app-owned planning data. | Metadata contract review and browser tests. | `npm run quality`; targeted overlay metadata grep. |

### Performance

| Metric | Verification method | Command or evidence |
| --- | --- | --- |
| Production build passes with the redesigned frontend. | Repo quality gate. | `npm run quality`. |
| Route search does not silently stall and reaches feedback or results within browser-test timeout. | Strict browser test with route-search assertions. | `npm run test:browser:required -- --grep @smoke` or targeted route issue grep. |
| Dense overlay scenarios are bounded, default-off where needed, and do not add unreviewed rendering work. | Design/spec review, code review, targeted browser check. | `npm run quality`; overlay grep when UI changes. |
| Google Maps API loading failures are visible and documented as environment blockers, not hidden product states. | Browser error-state check and QA notes. | Browser manual/plugin evidence; exact failed command if strict Maps gate fails. |

### Accessibility

| Metric | Verification method | Command or evidence |
| --- | --- | --- |
| App-owned controls have accessible names and state such as `aria-pressed`, expanded state, labelled regions, or status feedback. | Role and label assertions. | `npm run test:browser:required -- --grep @VR-307`; targeted accessibility issue grep. |
| Keyboard users can operate search, route options, panels, overlay controls, metadata, and dismissal flows. | Manual keyboard pass plus Playwright key assertions where durable. | Targeted Playwright test; manual Browser note for flows not automated. |
| Error, loading, empty, and offline-limited states are visible and announced where practical. | Spec review and implementation tests. | `npm run quality`; targeted route-search browser grep. |
| The redesign does not rely on color alone for route mode, overlay classification, or selection state. | Design/spec review and browser inspection. | MBR-60 acceptance evidence; targeted tests where applicable. |

### Mobile

| Metric | Verification method | Command or evidence |
| --- | --- | --- |
| At mobile widths, search, results, details, overlay controls, and metadata do not overlap primary map controls or hide required actions. | Responsive browser review and Playwright viewport tests. | `npm run test:browser:required -- --grep @VR-306`; targeted `@<issue-id>`. |
| Mobile route review preserves map context and supports dismiss/reopen behavior. | Spec review, implementation tests, manual Browser review. | Targeted Playwright test and Browser verification notes. |
| Touch targets and panel transitions are practical on small screens. | Browser/device-size review. | Targeted mobile issue grep or manual Browser evidence. |
| Google Maps gestures remain usable and are not replaced by custom gesture systems. | Browser review and code review. | MBR-63 review evidence. |

### Regression Safety

| Metric | Verification method | Command or evidence |
| --- | --- | --- |
| Every browser-facing issue has a gate explanation before closeout. | Task gate plan. | `npm run task:gate -- <issue-id> --explain`. |
| Browser-facing issues have a matching Playwright title tag or accepted smoke-only label. | Gate output plus test title review. | `npm run test:browser:required -- --grep @<issue-id>` or `--grep @smoke`. |
| Shared style, type, routing, and data contracts do not regress. | Unit tests, lint, typecheck, build. | `npm run quality`. |
| Official future transit data changes preserve provenance and future-only boundaries. | Official future validation. | `npm run validate:official-future-transit`. |
| QA handoff states ready, ready with follow-ups, or blocked. | Launch-readiness artifact. | MBR-64 handoff comment or repo doc. |

## Gate Matrix

| Work type | Required gates | Notes |
| --- | --- | --- |
| Docs-only planning | `npm run task:gate -- <issue-id> --explain` | `npm run quality` is optional unless the gate plan requires it or scripts/code changed. |
| Research-only | Source review and `npm run task:gate -- <issue-id> --explain` | Use Linear comments or repo docs for artifacts. No browser gate unless a browser-facing prototype is created. |
| Design/spec work | `npm run task:gate -- <issue-id> --explain` plus review against Google Maps-first policy and VeloRail identity | Browser verification is required only for implemented or interactive browser-facing changes. |
| Non-browser implementation | `npm run quality`; `npm run task:gate -- <issue-id> --explain` | Focused unit tests are included in quality. |
| Browser-facing UI implementation | `npm run quality`; `npm run test:browser:required -- --grep @<issue-id>`; `npm run task:gate -- <issue-id> --explain` | Map, route, search, overlay, panel, responsive, and accessibility work should be treated as browser-facing by default. |
| Browser smoke-eligible work | `npm run quality`; `npm run test:browser:required -- --grep @smoke` | Only use when an issue or label explicitly allows smoke-only coverage. |
| Official future transit data | `npm run validate:official-future-transit`; `npm run quality` | Add browser verification only if rendering, overlay controls, or metadata UI changes. |
| Final QA and launch readiness | `npm run quality`; `npm run test:browser:required`; targeted Playwright greps; `npm run task:gate -- MBR-64 --explain` | Include exact blockers for Maps API key, Playwright install, port/server, or product failure. |

## Targeted Browser Checks

Known current browser test tags include:

| Flow | Existing tag or grep |
| --- | --- |
| Smoke route search feedback | `@smoke` |
| Route search request shape | `@veloRail-a0c4` |
| Layer grouping and legend | `@VR-303` |
| Future overlay toggle | `@VR-101` |
| Completed network comparison | `@VR-104` |
| Overlay metadata | `@VR-305` |
| Metadata keyboard dismissal | `@VR-307` |
| Mobile or responsive popover safety | `@VR-306` |

New redesign implementation issues should add tags matching the Linear issue identifier when possible, such as `@MBR-83`, so `npm run task:gate -- <issue-id> --explain` and the Playwright suite remain aligned.

## Manual And Plugin Verification

Use the Browser plugin when a flow needs human-scale inspection, screenshots, mobile viewport review, or state that is not yet worth automating. Browser evidence supplements the checked-in Playwright suite; it does not replace `npm run test:browser:required` when a strict browser gate is required.

Manual Browser review should record:

- URL and viewport.
- Flow exercised.
- Whether Google Maps loaded with a valid API key.
- Any visible overlap, clipped text, hidden action, broken focus, or route-search stall.
- The follow-up issue if the problem is not fixed in the current scope.

## Launch Readiness Checklist

- `npm run task:gate -- MBR-64 --explain` lists expected gates.
- `npm run quality` passes.
- `npm run test:browser:required` passes, or every failing grep has an exact documented blocker.
- Targeted route search, overlay metadata, future comparison, mobile, and accessibility flows have regression evidence.
- Official Future Transit validation passes if official future data changed.
- The decision log reflects any spec or implementation decisions made after setup.
- The launch recommendation is explicit: ready, ready with known follow-ups, or blocked.
