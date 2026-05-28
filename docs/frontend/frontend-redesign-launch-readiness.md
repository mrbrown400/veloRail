# Frontend Redesign Launch Readiness

Issue: MBR-91
Branch: `feature/velorail-frontend-redesign-google-maps-parity`
Date: 2026-05-26; follow-up updated 2026-05-27
Recommendation: ready with owner-reviewed follow-ups

## Decision

The frontend redesign handoff is launch-ready for owner review with known follow-ups. The current repo evidence shows quality passing, strict Chromium browser verification passing on the default Playwright-managed preview, targeted MBR-89 browser regression coverage in place, and targeted MBR-83 search coverage passing after the Places Autocomplete Data API/session-token migration. No Figma artifact is required or available for this decision.

This recommendation is not a production launch approval by itself. It is the MBR-91 handoff decision package for PR review, owner signoff, and any final MBR-90 evidence attachment.

## What Was Verified

Verified by current docs and browser evidence:

- Search starts from a map-first surface and supports collapsed destination entry, origin repair, autocomplete semantics, and typed fallback behavior.
- Route search reaches visible feedback or results and uses the Maps JavaScript Routes library without request-shape errors in the passing browser run.
- Route cards preserve VeloRail route families, including Bike + Rail and Walk + Rail, while Driving is labelled comparison-only.
- Layer controls preserve Current, Future, Visionary, and Nationalized grouping with active counts, legend, and comparison-mode sync.
- Overlay metadata preserves provenance, uncertainty, source links, warnings, and the Google Maps rendering boundary.
- Mobile checks cover 390 by 844 route action visibility, layer sheet behavior, and metadata panel viewport containment.
- Keyboard and accessibility checks cover combobox state, named controls, Escape behavior, focus return, `aria-pressed`, labelled regions, and a non-map metadata access path.

## Evidence Summary

| Gate or review | Result | Evidence |
| --- | --- | --- |
| Markdown acceptance review | Pass | MBR-60, MBR-77, MBR-78, MBR-79, MBR-89, MBR-90, and MBR-91 docs reviewed. |
| Google Maps-first review | Pass | `docs/architecture/google-maps-first-policy.md` confirms Google Maps remains the base rendering, gestures, routing, Places, Geocoding, current transit, bicycling, and overlay primitive surface. |
| `npm run quality` | Pass | 74 tests, lint, typecheck, and production build passed. |
| `npm run test:browser:required` | Pass with one skip | 18 passed, 1 skipped on Chromium. |
| `npm run test:browser:required -- --grep @MBR-89` | Pass with one skip | 17 passed, 1 skipped. |
| `npm run test:browser:required -- --grep @MBR-83` | Pass | 2 passed after the Places Autocomplete Data API/session-token migration. |
| Browser plugin spot check | Historical pass with warnings | The original handoff app check loaded a nonblank Google Maps-first surface before the 2026-05-27 Places migration. |
| Headless dev-server spot check | Pass | Google Maps loaded at `http://127.0.0.1:5173/` without the app's map-error state and without legacy `AutocompleteService` or `PlacesService` warnings. |
| `npm run task:gate -- MBR-64 --explain` | Blocked | MBR-64 is not mapped in `.linear/migration.json`. |
| `npm run task:gate -- MBR-89 --explain` | Blocked | MBR-89 is not mapped in `.linear/migration.json`. |
| `npm run task:gate -- MBR-90 --explain` | Blocked | MBR-90 is not mapped in `.linear/migration.json`. |
| `npm run task:gate -- MBR-91 --explain` | Blocked | MBR-91 is not mapped in `.linear/migration.json`. |

## Launch-Risk Assessment

| Risk | Severity | Status | Owner-review need |
| --- | --- | --- | --- |
| Unmapped MBR-64/89/90/91 local task gates | Medium | Open | Decide whether to add these issues to `.linear/migration.json` or accept the documented local limitation. |
| Route-results close/reopen test skipped when VeloRail renders no route options | Medium | MBR-96 | Deterministic route fixtures or a test seam are tracked separately; this is accepted as a follow-up for MBR-64 closeout. |
| Places/session-token migration | Medium | Verified | Search internals now use the Places Autocomplete Data API, session tokens, and `Place.fetchFields()`; targeted browser and headless console checks passed without legacy `AutocompleteService` or `PlacesService` warnings. |
| Partial bottom-surface coordination | Medium | MBR-95 | Current mobile layers, metadata, and route sheets are acceptable for launch; follow-up cleanup can decide whether more layer and metadata state should move out of `MapContainer`. |
| Viewport/overlap automation gaps | Medium | MBR-93 | Current browser tests cover 390 and 430 mobile paths but do not explicitly assert 768 px, 1440 by 900, or Google control/attribution overlap. |
| Additional accessibility matrix beyond Chromium Playwright | Medium | MBR-93 | Confirm whether WebKit, screen-reader, axe, or manual device checks are required. |
| Vite chunk-size warning | Low | MBR-94 | Track performance/bundle-size work if it becomes a launch gate. |

## Known Non-Blockers

- Figma is unavailable and optional. The Markdown specs plus running-app browser evidence are the acceptance source for this phase.
- Earlier concurrent preview-port contention was environmental and cleared before final lead-thread verification; the final default Playwright-managed browser suite passed.
- The MBR task-gate failures are local migration metadata coverage, not product regressions or evidence that the Linear issues do not exist.
- No official future transit data was changed in this handoff, so official future validation was not required.

## Follow-Up Issues

Recommended follow-ups for owner or next agent:

- MBR task metadata: map MBR-64, MBR-89, MBR-90, and MBR-91 in `.linear/migration.json` if local task-gate closeout is required.
- MBR-96 browser determinism: make the route-results sheet close/reopen path fixture-backed so it does not skip when live route options are unavailable.
- Search platform follow-up: no separate legacy Places warning issue is required after the 2026-05-27 migration; keep any future search refinements behind the existing service boundary.
- MBR-95 mobile panel follow-up: complete store-owned coordination for route, layers, metadata, search, and bike settings bottom surfaces.
- MBR-93 browser matrix follow-up: add 768 px, 1440 by 900, and Google control/attribution overlap assertions if required before launch.
- MBR-93 accessibility matrix: confirm whether final launch needs manual screen-reader, axe, WebKit, or physical-device checks.
- MBR-94 performance follow-up: decide whether the current bundle-size warning should become a post-launch task.

## Owner Review Items

Owner should review and decide:

1. Whether `ready with owner-reviewed follow-ups` is the right launch classification, or whether any listed follow-up should make the recommendation `blocked`.
2. Whether MBR-64, MBR-89, MBR-90, and MBR-91 should be added to local task metadata before PR merge.
3. Whether the verified Places migration behavior is acceptable for merge.
4. Whether MBR-95 is sufficient follow-up coverage for partial mobile bottom-surface coordination.
5. Whether final QA must include MBR-93 scope: WebKit, screen-reader, axe, 768 px, 1440 by 900, Google control/attribution, or physical-device checks.
6. Whether any launch note should explicitly call out Figma unavailability and Markdown specs as the binding acceptance source.

## PR And Merge Guidance

Recommended PR status: ready for owner review.

Recommended merge status: merge after owner accepts the follow-up list or assigns the open items to MBR-89, MBR-90, MBR-91, or post-launch work. Do not merge solely on this document if the owner requires additional Places behavior beyond the verified migration, MBR-95 bottom-surface coordination before launch, MBR-96 deterministic route-results coverage before launch, or an expanded accessibility/viewport matrix before launch.

## Final Handoff Summary

The redesign launch handoff has sufficient evidence for a ready-with-owner-reviewed-follow-ups recommendation:

- Quality passed.
- Strict Chromium browser verification passed with 18 passed and 1 accepted skip.
- Targeted MBR-89 browser verification passed with 17 passed and 1 accepted skip.
- Targeted MBR-83 search browser verification passed with 2 passed after the Places migration, and the headless dev-server spot check showed no legacy Places warnings.
- Specs and browser tests cover search, routing, overlays, metadata, mobile, accessibility, and Google Maps-first constraints.
- Remaining issues are explicit and assignable: local gate metadata, deterministic route-options coverage in MBR-96, bottom-surface coordination in MBR-95, optional expanded accessibility/viewport checks in MBR-93, and bundle-size follow-up in MBR-94.
