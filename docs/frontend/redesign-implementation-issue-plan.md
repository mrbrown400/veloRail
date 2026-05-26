# Redesign Implementation Issue Plan

Issue: MBR-61
Sub-issue covered: MBR-80
Branch: `feature/velorail-frontend-redesign-google-maps-parity`
Local repo: `/Users/kylebrown/veloRail`
Scope: issue planning only. No frontend code, QA execution, Figma file, route behavior, or map behavior changed.

## Source Of Truth

Use the approved Markdown spec set as the implementation source of truth:

- `docs/frontend/velorail-frontend-redesign-spec.md`
- `docs/frontend/search-routing-user-journeys-spec.md`
- `docs/frontend/map-overlays-metadata-requirements.md`
- `docs/frontend/responsive-accessibility-ui-states.md`
- `docs/frontend/figma-redesign-workflow.md`
- `docs/frontend/figma-search-routing-flow-map.md`
- `docs/frontend/velorail-design-system-plan.md`
- `docs/frontend/velorail-visual-language-plan.md`
- `docs/frontend/redesign-success-metrics-and-gates.md`
- `docs/frontend/redesign-risk-register.md`

Figma is optional only. Do not require a Figma account, workspace, file, selection URL, or frame link for any downstream issue. If Figma later becomes available, linked frames are visual references only unless the owner explicitly accepts them as implementation criteria. Browser/app screenshots and Playwright verification are the practical visual QA loop.

## Shared Execution Policy

All downstream issues should start from `/Users/kylebrown/veloRail` on `feature/velorail-frontend-redesign-google-maps-parity`. Do not reset the branch, discard unrelated work, or push unless the owner explicitly requests it. Use focused `MBR-<id>` commits when code or docs are ready for review.

Parallel agents are allowed for bounded read-heavy exploration, test triage, accessibility review, and independent file audits. Keep one writer in the main checkout at a time unless work is split into separate temporary worktrees with disjoint file ownership. The main thread should integrate and verify changes on the dedicated branch.

## Downstream Issues

| Issue | Scope | Likely files | Dependencies | Verification | Parallel-agent strategy |
| --- | --- | --- | --- | --- | --- |
| MBR-83 | Search and route-entry shell: collapsed destination entry, expanded directions repair, autocomplete states, typed fallback geocoding, explicit current-location states, field-level errors, service-area validation. | `src/components/Search/SearchCard.tsx`, `PlaceAutocomplete.tsx`, `LocationStatus.tsx`, `TimeSelector.tsx`, `ModeSelect.tsx`, `BikeSettings.tsx`, `src/hooks/useRouting.ts`, `src/hooks/useGeolocation.ts`, `src/services/geocoding.ts`, `src/stores/routeStore.ts`, `src/stores/uiStore.ts`, `src/styles/design-system.css`, `src/styles/google-maps-theme.css`, `tests/browser/route-search.spec.ts`. | MBR-77, MBR-79, MBR-81. Coordinate with MBR-86 and MBR-88. | `npm run quality`; `npm run test:browser:required -- --grep @MBR-83` where practical; `npm run task:gate -- MBR-83 --explain` if mapped, otherwise document the unmapped-task limitation. | Use read-only agents for spec, service-boundary, and browser-test audit. Main writer owns search files and shared route state. |
| MBR-84 | Route results and itinerary redesign: duration-first cards, Bike + Rail and Walk + Rail priority, driving as comparison-only, selected card/detail/polyline sync, leg-level itinerary, loading/error/no-route, recoverable close/reopen. | `src/components/Results/ResultsSidebar.tsx`, `RouteOption.tsx`, `RouteDetails.tsx`, `VehicleTrackingStatus.tsx`, `src/components/Map/RouteOverlay.tsx`, `src/stores/routeStore.ts`, `src/stores/uiStore.ts`, `src/types/index.ts`, styles, `tests/browser/route-search.spec.ts`. | MBR-83 should be stable enough for search-to-results flow; MBR-77, MBR-79. Coordinate with MBR-86 and MBR-88. | `npm run quality`; `npm run test:browser:required -- --grep @MBR-84` where practical; `npm run task:gate -- MBR-84 --explain` if mapped, otherwise document the unmapped-task limitation. | Use read-only agents for route-contract and browser-selector audit. Write after MBR-83 search/result state decisions settle. |
| MBR-85 | Map controls and overlay controls: layer grouping, active counts, Present Only vs Present + Future sync, legend, metadata provenance, source links, warning copy, selected-route overlay priority. | `src/components/Map/MapContainer.tsx`, `MapOverlayRenderer.tsx`, `RouteOverlay.tsx`, `mapOverlayRegistry.ts`, `src/stores/mapOverlayStore.ts`, `src/styles/google-maps-theme.css`, `tests/mapOverlayRegistry.test.js`, `tests/browser/overlay-metadata.spec.ts`, `tests/browser/route-search.spec.ts`. | MBR-78, MBR-76, MBR-81. Coordinate with MBR-87 and MBR-88. Can run alongside MBR-83 if shared style churn is coordinated. | `npm run quality`; `npm run test:browser:required -- --grep @MBR-85` where practical; `npm run task:gate -- MBR-85 --explain` if mapped, otherwise document the unmapped-task limitation. | Use read-only agents for overlay registry, metadata, and browser-test audit. Main writer owns map/overlay files. |
| MBR-86 | Mobile search, route results, and bottom-sheet behavior for route-entry and itinerary review. | `src/components/Search/*`, `src/components/Results/*`, `src/stores/uiStore.ts`, `src/styles/design-system.css`, `src/styles/google-maps-theme.css`, mobile browser tests. | MBR-83 and MBR-84. Coordinate with MBR-88. | `npm run quality`; `npm run test:browser:required -- --grep @MBR-86`; `npm run task:gate -- MBR-86 --explain` if mapped, otherwise document the unmapped-task limitation. | Can run in parallel with MBR-87 after core slices land, but bottom-surface state and shared CSS need a single integration owner. |
| MBR-87 | Mobile map controls, overlay controls, metadata access, and Google Maps gesture safety. | `src/components/Map/MapContainer.tsx`, `MapOverlayRenderer.tsx`, `mapOverlayRegistry.ts`, `src/stores/mapOverlayStore.ts`, `src/stores/uiStore.ts`, shared styles, overlay browser tests. | MBR-85. Coordinate with MBR-88. | `npm run quality`; `npm run test:browser:required -- --grep @MBR-87`; `npm run task:gate -- MBR-87 --explain` if mapped, otherwise document the unmapped-task limitation. | Can run in parallel with MBR-86 after MBR-85 lands, with explicit ownership of map-control files and z-index/style changes. |
| MBR-88 | Keyboard, focus, ARIA, Escape behavior, touch targets, status/alert feedback, reduced-motion, and accessibility polish across redesigned search, results, maps, overlays, and metadata. | Search, results, map, overlay, metadata, shared styles, `tests/browser/*`. | MBR-83 through MBR-87 substantially merged. Read-only accessibility audit can start earlier. | `npm run quality`; `npm run test:browser:required -- --grep @MBR-88`; `npm run task:gate -- MBR-88 --explain` if mapped, otherwise document the unmapped-task limitation. | Use agents for read-only keyboard/focus audit and test gap review. Main writer integrates cross-cutting fixes after major UI files settle. |
| MBR-89 | Browser regression coverage for redesigned flows, issue-tagged tests, screenshot evidence where useful, and strict Maps blocker reporting. | `tests/browser/*`, browser helpers or fixtures if present, docs only when test workflow changes. | MBR-83 through MBR-88. Test planning can start earlier, durable test implementation waits for selectors and flows to stabilize. | `npm run quality`; `npm run test:browser:required`; targeted `npm run test:browser:required -- --grep @<issue-id>`; `npm run task:gate -- MBR-89 --explain` if mapped, otherwise document the unmapped-task limitation. | Use agents for read-only coverage audit and flaky-test triage. One writer owns browser test edits. |
| MBR-90 | Full redesign quality gate and failure triage. | Test output, docs or follow-up issue descriptions only unless fixing scoped gate failures. | MBR-89 and substantial completion of MBR-83 through MBR-88. | `npm run quality`; `npm run test:browser:required`; targeted issue greps; `npm run task:gate -- MBR-90 --explain` if mapped, otherwise document the unmapped-task limitation. | Use agents for failure classification and log triage only. Main thread decides fixes versus blockers. |
| MBR-91 | Launch-readiness handoff and documentation updates. | `docs/frontend/*`, README or run docs only if behavior or commands changed, Linear comments, follow-up issues. | MBR-89 and MBR-90. | `npm run task:gate -- MBR-91 --explain` if mapped; verify docs with `git diff --check`; cite gate output from MBR-90. | Use agents for read-only handoff review. Main thread writes final handoff and docs. |

## Coverage Decision

The existing MBR-83 through MBR-91 issue set covers the implementation, polish, browser regression, final gate, and launch-readiness work. Do not create duplicate issues for this milestone. Instead, update the existing Linear issue bodies with:

- dedicated branch and local repo instructions;
- Markdown-spec source-of-truth language;
- Figma optional fallback;
- likely file lists;
- exact verification commands;
- parallel-agent guidance;
- explicit dependencies and non-goals.

## Shared Non-Goals

- No frontend implementation in MBR-61, MBR-80, MBR-81, or MBR-82.
- No Figma dependency.
- No alternate map provider, custom tile system, or second overlay visibility store.
- No routing algorithm rewrite.
- No unsupported route facts such as fare, platform, alerts, exact arrivals, crowding, accessibility status, live ETA, or turn-by-turn steps unless a later issue models, sources, tests, and documents them.
- No issue assignment or Codex delegation unless explicitly requested.
