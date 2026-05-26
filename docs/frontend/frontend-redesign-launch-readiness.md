# Frontend Redesign Launch Readiness

Issue: MBR-91
Branch: `feature/velorail-frontend-redesign-google-maps-parity`
Date: 2026-05-26
Recommendation: ready with owner-reviewed follow-ups

## Decision

The frontend redesign handoff is launch-ready for owner review with known follow-ups. The current repo evidence shows quality passing, strict Chromium browser verification passing on the default Playwright-managed preview, and targeted MBR-89 browser regression coverage in place. No Figma artifact is required or available for this decision.

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
| `npm run quality` | Pass | 73 tests, lint, typecheck, and production build passed. |
| `npm run test:browser:required` | Pass with one skip | 18 passed, 1 skipped on Chromium. |
| `npm run test:browser:required -- --grep @MBR-89` | Pass with one skip | 17 passed, 1 skipped. |
| Browser plugin spot check | Pass with warnings | The running app loaded a nonblank Google Maps-first surface, Route search and Layers were visible, Legend interaction worked, and no map-load error appeared. Console warnings reported legacy Google Places APIs. |
| `npm run task:gate -- MBR-64 --explain` | Blocked | MBR-64 is not mapped in `.linear/migration.json`. |
| `npm run task:gate -- MBR-89 --explain` | Blocked | MBR-89 is not mapped in `.linear/migration.json`. |
| `npm run task:gate -- MBR-90 --explain` | Blocked | MBR-90 is not mapped in `.linear/migration.json`. |
| `npm run task:gate -- MBR-91 --explain` | Blocked | MBR-91 is not mapped in `.linear/migration.json`. |

## Launch-Risk Assessment

| Risk | Severity | Status | Owner-review need |
| --- | --- | --- | --- |
| Unmapped MBR-64/89/90/91 local task gates | Medium | Open | Decide whether to add these issues to `.linear/migration.json` or accept the documented local limitation. |
| Route-results close/reopen test skipped when no route options return | Medium | Open | Decide whether deterministic route fixtures are required before merge. |
| Legacy Places/session-token gap | High | Owner decision | Current code still uses `AutocompleteService` and `PlacesService`; owner should decide whether Places New/session-token migration is required before merge or can remain a follow-up. |
| Partial bottom-surface coordination | High | Owner decision | Route sheet state is store-owned, but layer and metadata state remain local to `MapContainer`; owner should decide whether this is acceptable for launch. |
| Viewport/overlap automation gaps | Medium | Open | Current browser tests cover 390 and 430 mobile paths but do not explicitly assert 768 px, 1440 by 900, or Google control/attribution overlap. |
| Additional accessibility matrix beyond Chromium Playwright | Medium | Owner decision | Confirm whether WebKit, screen-reader, axe, or manual device checks are required. |
| Vite chunk-size warning | Low | Follow-up | Track performance/bundle-size work if it becomes a launch gate. |

## Known Non-Blockers

- Figma is unavailable and optional. The Markdown specs plus running-app browser evidence are the acceptance source for this phase.
- Earlier concurrent preview-port contention was environmental and cleared before final lead-thread verification; the final default Playwright-managed browser suite passed.
- The MBR task-gate failures are local migration metadata coverage, not product regressions or evidence that the Linear issues do not exist.
- No official future transit data was changed in this handoff, so official future validation was not required.

## Follow-Up Issues

Recommended follow-ups for owner or next agent:

- MBR task metadata: map MBR-64, MBR-89, MBR-90, and MBR-91 in `.linear/migration.json` if local task-gate closeout is required.
- MBR-89 browser determinism: make the route-results sheet close/reopen path fixture-backed so it does not skip when live route options are unavailable.
- Search platform follow-up: migrate autocomplete/details internals toward Places New and session-token behavior, or explicitly accept the legacy API warnings for this launch.
- Mobile panel follow-up: complete store-owned coordination for route, layers, metadata, search, and bike settings bottom surfaces.
- Browser matrix follow-up: add 768 px, 1440 by 900, and Google control/attribution overlap assertions if required before launch.
- MBR-88 accessibility matrix: confirm whether final launch needs manual screen-reader, axe, WebKit, or physical-device checks.
- Performance follow-up: decide whether the current bundle-size warning should become a post-launch task.

## Owner Review Items

Owner should review and decide:

1. Whether `ready with owner-reviewed follow-ups` is the right launch classification, or whether any listed follow-up should make the recommendation `blocked`.
2. Whether MBR-64, MBR-89, MBR-90, and MBR-91 should be added to local task metadata before PR merge.
3. Whether legacy Places/session-token work is required before merge.
4. Whether the partial bottom-surface coordinator is acceptable for launch.
5. Whether final QA must include WebKit, screen-reader, axe, 768 px, 1440 by 900, Google control/attribution, or physical-device checks.
6. Whether any launch note should explicitly call out Figma unavailability and Markdown specs as the binding acceptance source.

## PR And Merge Guidance

Recommended PR status: ready for owner review.

Recommended merge status: merge after owner accepts the follow-up list or assigns the open items to MBR-89, MBR-90, MBR-91, or post-launch work. Do not merge solely on this document if the owner requires Places New/session-token work, a completed bottom-surface coordinator, a non-skipped route-results sheet test, or an expanded accessibility/viewport matrix before launch.

## Final Handoff Summary

The redesign launch handoff has sufficient evidence for a ready-with-owner-reviewed-follow-ups recommendation:

- Quality passed.
- Strict Chromium browser verification passed with 18 passed and 1 accepted skip.
- Targeted MBR-89 browser verification passed with 17 passed and 1 accepted skip.
- Specs and browser tests cover search, routing, overlays, metadata, mobile, accessibility, and Google Maps-first constraints.
- Remaining issues are explicit and assignable: local gate metadata, deterministic route-options coverage, Places New/session-token migration, bottom-surface coordination, optional expanded accessibility/viewport checks, and bundle-size follow-up.
