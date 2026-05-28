# Frontend Redesign QA Handoff

Issues: MBR-64, MBR-89, MBR-90, MBR-91
Branch: `feature/velorail-frontend-redesign-google-maps-parity`
Date: 2026-05-26; follow-up updated 2026-05-27
Scope: final frontend redesign QA, browser regression coverage, gate triage, launch-readiness documentation, and the 2026-05-27 Places Autocomplete Data API/session-token follow-up. No route data, Figma artifact, map provider, routing algorithm, or architecture file was changed.

## Acceptance Basis

Figma is unavailable and optional for this phase. The acceptance sources for this handoff are:

- Markdown specs in `docs/frontend/`, especially `velorail-frontend-redesign-spec.md`, `search-routing-user-journeys-spec.md`, `map-overlays-metadata-requirements.md`, `responsive-accessibility-ui-states.md`, `redesign-success-metrics-and-gates.md`, and `redesign-test-docs-launch-plan.md`.
- Google Maps-first architecture policy in `docs/architecture/google-maps-first-policy.md`.
- Checked-in browser regression coverage under `tests/browser/`.
- Running-app verification through Playwright against a local preview server.

## Scope Verified

The handoff review covered the launch-readiness surfaces defined by MBR-60, MBR-77, MBR-78, MBR-79, MBR-89, MBR-90, and MBR-91:

- Search and route entry: collapsed destination entry, missing-origin repair, autocomplete semantics, typed fallback path, and mobile route action visibility.
- Route results and itinerary: route request shape, Bike + Rail, Walk + Rail, Driving as comparison-only, selected route detail, mobile sheet close/reopen behavior where route options are available.
- Map controls and overlays: Current, Future, Visionary, and Nationalized groupings; Present Only vs Present + Future sync; active counts; legend.
- Metadata and provenance: official future, visionary, freight/passenger-conversion warnings, source links, Google Maps rendering boundary, keyboard-accessible metadata path, Escape dismissal, focus return.
- Responsive and accessibility states: 390 by 844 mobile checks, named controls, focus return, visible panels within viewport, `aria-pressed` toggle state, labelled regions.
- Google Maps-first constraints: Google Maps remains the rendering and gesture surface; VeloRail owns planning data, provenance, and scenario metadata.

## Files And Features Reviewed

Primary docs reviewed:

- `AGENTS.md`
- `docs/frontend/figma-search-routing-flow-map.md`
- `docs/frontend/velorail-design-system-plan.md`
- `docs/frontend/velorail-visual-language-plan.md`
- `docs/frontend/velorail-frontend-redesign-spec.md`
- `docs/frontend/search-routing-user-journeys-spec.md`
- `docs/frontend/map-overlays-metadata-requirements.md`
- `docs/frontend/responsive-accessibility-ui-states.md`
- `docs/frontend/redesign-success-metrics-and-gates.md`
- `docs/frontend/redesign-test-docs-launch-plan.md`
- `docs/architecture/google-maps-first-policy.md`

Browser coverage reviewed:

- `tests/browser/route-search.spec.ts`
- `tests/browser/overlay-metadata.spec.ts`

No changes were made to `docs/agentic/codex-cloud-setup.md`.

## Commands Run

| Command | Result | Notes |
| --- | --- | --- |
| `git status --short --branch` | Pass | Confirmed branch `feature/velorail-frontend-redesign-google-maps-parity` and no local modifications before edits. |
| `npm run quality` | Pass | 74 unit tests passed, style lint passed, TypeScript passed, production build passed. Vite emitted the existing chunk-size warning for a 530.21 kB JS chunk. |
| `npm run test:browser:required` | Pass with skip | 18 passed, 1 skipped on Chromium. The skipped route-results sheet test depends on live route options being returned in the environment. |
| `npm run test:browser:required -- --grep @MBR-89` | Pass with skip | 17 passed, 1 skipped. MBR-89 now has a direct targeted browser grep covering search, route repair, overlays, metadata, mobile, and route reopen when route options are available. |
| `npm run test:browser:required -- --grep @MBR-83` | Pass | 2 passed after the Places Autocomplete Data API/session-token migration. |
| `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173 npm run test:browser:required -- --grep "route results can switch"` | Pass with skip | Re-ran the close/reopen route-results test after clarifying its skip reason; it still skipped because no route options rendered in the live environment. |
| `npm run task:gate -- MBR-64 --explain` | Blocked | `Task MBR-64 was not found in .linear/migration.json.` |
| `npm run task:gate -- MBR-89 --explain` | Blocked | `Task MBR-89 was not found in .linear/migration.json.` |
| `npm run task:gate -- MBR-90 --explain` | Blocked | `Task MBR-90 was not found in .linear/migration.json.` |
| `npm run task:gate -- MBR-91 --explain` | Blocked | `Task MBR-91 was not found in .linear/migration.json.` |
| Browser plugin spot check at `http://127.0.0.1:4174/` | Historical pass with warnings | Original handoff app check loaded a nonblank Google Maps-first surface. Console warnings reported legacy Google Places APIs before the 2026-05-27 Places migration. |
| Headless dev-server spot check at `http://127.0.0.1:5173/` | Pass | Google Maps loaded without the app's map-error state and no legacy `AutocompleteService` or `PlacesService` warnings were reported. |

## Browser Flows Tested

Passing browser coverage on the Playwright-managed preview:

- Smoke route search reaches visible feedback or results.
- Collapsed destination submit expands origin repair and preserves destination.
- Autocomplete input exposes combobox state and Escape collapse behavior.
- Expanded search shows destination repair/error state without opening results.
- Google Routes request shape has no request-shape errors and loads `/routes.js`.
- Mobile expanded search keeps the primary route action visible.
- Bike settings popover exposes named controls and returns focus on Escape.
- Bike settings popover is not clipped by the search card.
- Future overlay control is grouped and default off.
- Layer panel groups overlays and exposes a visible legend.
- Present Only and Present + Future synchronize official future overlay state.
- Nationalized overlay exposes hypothetical conversion legend and metadata.
- Visionary overlay exposes speculative legend and metadata.
- Layer feature list opens metadata without requiring a map click and returns focus on Escape.
- Overlay metadata can be dismissed with Escape.
- Mobile layer controls collapse behind a trigger and open as a sheet.
- Mobile overlay panels stay within the viewport.
- Bike and Walk + Rail estimates use different surface speeds.

Skipped browser coverage:

- Route results can switch sheet states, select a route, close, and reopen when options are available. The test is intentionally skipped when VeloRail does not render route options in the environment; deterministic coverage is tracked in MBR-96.

## Pass/Fail Summary

| Area | Status | Evidence |
| --- | --- | --- |
| Docs acceptance source | Pass | Specs and gate docs reviewed; Figma is explicitly optional and unavailable. |
| Quality gate | Pass | `npm run quality` completed. |
| Strict browser gate | Pass with one accepted skip | `npm run test:browser:required` completed with 18 passed, 1 skipped. |
| MBR-89 targeted browser gate | Pass with one accepted skip | `npm run test:browser:required -- --grep @MBR-89` completed with 17 passed, 1 skipped. |
| Places API migration | Pass | `npm run test:browser:required -- --grep @MBR-83` completed with 2 passed, and the dev-server spot check reported no legacy Places warnings. |
| Task gates | Blocked | MBR-64, MBR-89, MBR-90, and MBR-91 are not mapped in `.linear/migration.json`. |
| Figma review | Not applicable | Figma unavailable and not required for this launch handoff. |

## Known Blockers And Follow-Ups

- Add MBR-64, MBR-89, MBR-90, and MBR-91 to `.linear/migration.json` if local `task:gate` closeout must resolve these issues directly.
- Track deterministic route-results close/reopen browser coverage in MBR-96 so this path no longer depends on live route options being available in every environment.
- Places search internals now use the Places Autocomplete Data API, session tokens, and `Place.fetchFields()` behind the existing custom `PlaceAutocomplete` UI. Targeted browser and headless console checks passed; any further search refinements should be scoped separately.
- Track partial mobile bottom-surface coordination in MBR-95. Current mobile layers, metadata, and route sheets are acceptable for this launch, while follow-up cleanup can decide whether more layer and metadata state should move out of `MapContainer`.
- Track 768 px and 1440 by 900 browser assertions, Google controls/attribution overlap assertions, and expanded accessibility/manual-device checks in MBR-93 if owner requires the full viewport matrix to be automated before merge.
- Track the Vite chunk-size warning in MBR-94 if bundle size becomes a launch criterion; it did not fail the current quality gate.
- Have the owner confirm whether final launch requires additional WebKit, screen-reader, axe, or manual device checks beyond current Chromium Playwright and mobile viewport coverage.

## Launch Recommendation

Recommendation: ready with owner-reviewed follow-ups.

The quality gate, strict Chromium browser evidence, targeted MBR-89 regression coverage, targeted MBR-83 search coverage after the Places migration, and Browser spot check are strong enough for a launch-readiness handoff. The remaining issues should be explicitly accepted or assigned before merge: unmapped local task gates, deterministic route-options coverage in MBR-96, partial bottom-surface coordination in MBR-95, optional viewport/accessibility matrix expansion, and bundle-size follow-up.

## PR And Merge Recommendation

Merge recommendation: owner-review required before merge, then merge is reasonable if the owner accepts the documented follow-ups rather than treating them as blockers.

Do not treat this handoff as authorization to launch, push, or merge by itself. It is the evidence package for owner review and PR closeout.
