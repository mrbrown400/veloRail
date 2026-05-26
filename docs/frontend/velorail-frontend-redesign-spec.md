# VeloRail Frontend Redesign Specification

Issues: MBR-60, MBR-77, MBR-78, MBR-79
Milestone: Unified Product/Design Specification
Verified: 2026-05-26 on `feature/velorail-frontend-redesign-google-maps-parity`
Scope: implementation-ready specification only. No frontend code, routing algorithm, map provider, data contract, Figma file, or QA execution changed.

## Product Goal

VeloRail should feel close to Google Maps for search, directions entry, route review, map controls, and mobile panel behavior while preserving the product surfaces Google Maps does not provide: car-free mixed-mode routing, future and visionary transit planning overlays, nationalized or freight passenger-conversion scenarios, and source-backed planning metadata.

This spec is the handoff from MBR-57, MBR-58, and MBR-59 into implementation planning. It defines the product, design, state, accessibility, data, and verification requirements that MBR-61 should split into implementation issues, MBR-62 should implement, MBR-63 should polish, and MBR-64 should verify for launch readiness.

Supporting specs:

- `docs/frontend/search-routing-user-journeys-spec.md` for MBR-77.
- `docs/frontend/map-overlays-metadata-requirements.md` for MBR-78.
- `docs/frontend/responsive-accessibility-ui-states.md` for MBR-79.

## Design Source Of Truth

Figma is optional and unavailable for this phase. There is no active Figma account, workspace, file, or selection to use as an implementation blocker or acceptance artifact.

The MBR-59 Markdown design docs are the design source of truth:

- `docs/frontend/figma-redesign-workflow.md`
- `docs/frontend/figma-search-routing-flow-map.md`
- `docs/frontend/velorail-design-system-plan.md`
- `docs/frontend/velorail-visual-language-plan.md`

Browser/app screenshots and Playwright verification replace Figma review for practical acceptance in this phase. Future linked Figma frames may be treated as visual references only after they are linked from Linear or repo docs and explicitly accepted by the owner.

## Non-Goals

- Do not implement code in MBR-60, MBR-77, MBR-78, or MBR-79.
- Do not create child implementation issues here; MBR-61 owns issue creation and final breakdown.
- Do not migrate away from React, Vite, or TypeScript.
- Do not replace Google Maps with another map provider, tile system, or custom geospatial rendering stack.
- Do not replace Zustand or the existing CSS custom property approach unless a later implementation issue proves a repo-specific blocker.
- Do not rewrite routing algorithms unless an implementation issue proves the UI cannot accurately display existing data.
- Do not add unsupported route facts such as fares, platforms, exact arrivals, alerts, crowding, accessibility status, turn-by-turn maneuvers, or live ETA without modeled, nullable, sourced, and tested data.
- Do not water down VeloRail's car-free, future-transit, visionary, nationalized rail, or freight overlay identity.

## Current Architecture Summary

The current app is a React 18, Vite 7, and TypeScript frontend. Google Maps is loaded through `@react-google-maps/api` with the `places`, `geometry`, and `routes` libraries. State is split across focused Zustand stores including `routeStore`, `uiStore`, and `mapOverlayStore`. Styling uses app CSS and custom properties, including `src/styles/design-system.css` and `src/styles/google-maps-theme.css`.

Primary implementation owner files:

- Search and routing entry: `src/components/Search/SearchCard.tsx`, `src/components/Search/PlaceAutocomplete.tsx`, `src/hooks/useRouting.ts`, `src/services/geocoding.ts`, `src/services/routing.ts`, `src/services/googleRoutesService.ts`.
- Route results: `src/components/Results/ResultsSidebar.tsx`, `src/components/Results/RouteOption.tsx`, `src/components/Results/RouteDetails.tsx`, `src/stores/routeStore.ts`, `src/types/index.ts`.
- Map and overlays: `src/components/Map/MapContainer.tsx`, `src/components/Map/RouteOverlay.tsx`, `src/components/Map/MapOverlayRenderer.tsx`, `src/components/Map/mapOverlayRegistry.ts`, `src/stores/mapOverlayStore.ts`.
- Shared UI state and styles: `src/stores/uiStore.ts`, `src/styles/design-system.css`, `src/styles/google-maps-theme.css`.

Google Maps should continue to own the base map, gestures, viewport, native controls, attribution, current transit context, bicycling context, map object events, markers, polylines, and InfoWindows wherever feasible. VeloRail should own custom data and interaction around route family comparison, future and visionary proposals, freight/passenger-conversion overlays, source provenance, and scenario metadata.

## Target UX Principles

1. Google Maps parity is an interaction target, not an identity replacement.
2. Bike + Rail and Walk + Rail are first-class route families. Driving, when shown, is comparison-only and visually quieter.
3. The map remains the dominant surface on desktop and mobile.
4. Search and directions entry must make endpoint state visible: raw input, selected place, fallback resolved, invalid, outside service area, loading, or error.
5. Route cards, details, and selected map polylines must stay synchronized through a single selected route state.
6. Overlay controls must explain whether a layer is current Google context, official future service, visionary planning, freight-only corridor, or hypothetical passenger conversion.
7. Mobile uses one coordinated bottom-surface model. Search, route results, route detail, layer controls, metadata, and bike settings must not compete independently for the same bottom viewport.
8. Loading, empty, error, no-route, degraded-provider, and API-limited states are product requirements, not QA leftovers.

## Screen And State Requirements

Primary search flow:

```text
Loaded map -> collapsed destination search -> autocomplete or typed fallback -> expanded directions when origin is needed -> route calculation -> route results -> selected route detail -> edit or reopen route
```

Primary overlay flow:

```text
Loaded map -> compact layers entry -> layer panel or sheet -> overlay toggle or comparison mode -> legend -> metadata panel or sheet -> source review -> close and restore previous map context
```

Desktop requirements:

- Full-viewport Google map remains dominant.
- Search stays stable and recoverable at the map edge.
- Route results use a side panel.
- Layer controls, legend, and metadata can coexist without covering Google controls, attribution, selected route detail, or critical search actions.
- Selected route fit padding must account for side panels and metadata.

Mobile requirements:

- Map remains the first screen.
- Search becomes a keyboard-safe sheet or compact entry when active.
- Route results use collapsed, half, and full sheet states.
- Layers open from a compact control into a sheet or popover.
- Metadata uses the same bottom-surface coordinator and restores prior route or layer context on close.
- Active sheet height must feed selected-route map padding.

Required UI states:

- Map loading, map load error, loaded, API/key/library blocked.
- Search collapsed, expanded, unresolved field, field loading, field error, outside service area.
- Autocomplete closed, loading, results, active option, no results, service error.
- Geocoding fallback resolved and degraded-provider warning when fallback quality affects confidence.
- Routing resolving places, calculating, error, no routes.
- Results empty, loading, route options, selected detail, closed with recoverable routes.
- Layer default, group expanded, legend open, overlay toggled, comparison mode active.
- Metadata closed, open, long-content scrolling, source-link review.

## Component-Level Requirements

Search and directions:

- Preserve the custom `SearchCard` and `PlaceAutocomplete` UI while moving internals toward Google Places New and session-token behavior behind the current service boundary.
- Keep destination-first entry, but missing origin must expand directions, preserve the destination, and show an origin-specific repair prompt.
- Expanded directions must include origin, destination, current-location action, swap, clear, time, route mode, bike settings or bike safety, and route action.
- Current-location use should be explicit and report pending, granted, denied, and unavailable states near the origin field.

Route results:

- Route cards must show duration, distance, route family, mode sequence, transfer count, summary, bike safety when present, and future opening or savings only when populated.
- Selected route card, route detail, and `RouteOverlay` must stay synchronized.
- Route detail remains leg-level until `RouteLeg` or step-level contracts are explicitly expanded.
- Stable route IDs are required before enabling same-mode route alternatives or duplicate labels.

Map controls and overlays:

- Preserve `mapOverlayStore` as the owner of overlay visibility and comparison mode.
- Preserve overlay groups for Current, Future, Visionary, Nationalized Rail Planning, and bike context.
- Current Google transit and bicycling layers are native context layers, not VeloRail proposal data.
- `RouteOverlay` must remain above scenario overlays.
- Add a keyboard-accessible overlay feature list, table, or equivalent non-map path before map geometry clicks are the only metadata route.

Metadata:

- Metadata must show source boundary, classification, status, confidence, uncertainty, geometry source, opening year or phase when present, freight/conversion details when present, disclaimer, and source links.
- Source links should include publisher, title, URL, source type, note, and accessed date where present.
- Future overlays must say official future, not current service.
- Visionary overlays must say unofficial or speculative.
- Nationalized and passenger-conversion overlays must say hypothetical planning over sourced freight corridors, not approved passenger service.

## State And Data Contract Requirements

- Keep `routeStore.selectedRoute` as the selected route source for cards, details, and route overlay.
- Keep `mapOverlayStore` as the single overlay visibility and comparison-mode source.
- Keep `uiStore` or a narrow panel-state module as the owner of search/sidebar/bottom-surface UI state. The final owner decision belongs to implementation, but duplicate local state models are not allowed.
- Track raw typed endpoint input separately from selected or resolved `Location` values.
- Final resolved endpoints must be validated against owner-approved service-area anchors: Oxnard west, San Bernardino east, San Fernando north, and San Clemente south. The exact polygon or bounding rule is an open owner decision for implementation.
- Keep Photon, Nominatim, OSRM, and static station logic as fallback or feature-gap paths only. User-facing confidence should change when fallback affects quality.
- Normal search should keep future route preview dormant unless a later issue intentionally enables future routing.
- Do not display unsupported route fields until they are present in `Route` or `RouteLeg`, sourced from a real provider, nullable, tested, and documented.

## Visual And Design-System Requirements

- Keep React/Vite/TypeScript.
- Keep Google Maps as the base rendering and runtime surface.
- Keep Zustand and the existing CSS custom property approach unless a later implementation issue proves a blocker.
- Extend `src/styles/design-system.css` before app-specific aliases in `src/styles/google-maps-theme.css`.
- Add or formalize tokens for mode colors, route drawing, warning/error/success/info/degraded states, touch target minimums, panel widths, panel insets, mobile sheet heights, compact controls, z-index, shadow, border, and motion.
- Use visual treatments that combine color with labels, icons, line patterns, badges, counts, button states, or text. Do not rely on color alone.
- Keep the interface dense and map-centered. Do not introduce landing-page layout, oversized hero typography, marketing cards, or decorative visual systems that compete with the map.
- Preserve VeloRail's car-free, future-transit, visionary, nationalized, and freight overlay identity in labels, badges, warnings, legends, and metadata.

## API Assumptions And Constraints

- Google Maps remains the map runtime and should continue to provide base map rendering, gestures, viewport behavior, native controls, attribution, current transit context, bicycling context, map object events, markers, polylines, and InfoWindows where feasible.
- Places New migration should happen behind the current search service boundary and preserve the custom UI.
- Autocomplete session tokens should start on typing, continue through selected-place details, and reset on clear, submit, blur abandonment, or route completion.
- Geocoder bounds are bias, not service-area enforcement.
- Expand Google Routes field masks only with matching UI requirements, billing awareness, tests, and contract documentation.
- Same-mode Google alternatives are out of baseline scope until stable route IDs, source metadata, duplicate-label tests, and selected-route synchronization tests exist.
- Native Google `TransitLayer` and `BicyclingLayer` are visual context only and cannot provide proposal metadata.

## Accessibility Requirements

- Search inputs require explicit labels or accessible names.
- Field errors require `aria-invalid` and `aria-describedby`.
- Autocomplete requires combobox/listbox/option semantics, active-descendant behavior or equivalent, Arrow navigation, Enter selection, Escape dismissal, Tab-safe focus flow, loading status, no-results state, and service-error state.
- Route cards should use native button semantics or equivalent and expose selected state with `aria-pressed` or equivalent.
- Loading and progress messages should use `role="status"` where practical.
- Errors should use `role="alert"` where appropriate.
- Results, layers, legend, and metadata need labelled regions.
- Opening panels or sheets should move focus to a meaningful heading or first useful control.
- Closing panels or sheets should return focus to the trigger or a safe fallback.
- Trap focus only for modal sheets, not persistent sheets that preserve map access.
- Escape should close active autocomplete first, then active dismissible panels or sheets by priority.
- Primary mobile controls should target at least 48 by 48 CSS pixels.

## Test Plan

Docs-only MBR-60 verification:

- `npm run task:gate -- MBR-60 --explain`
- `git diff --check`

Implementation verification for browser-facing follow-up issues:

- `npm run task:gate -- <issue-id> --explain`
- `npm run quality`
- `npm run test:browser:required -- --grep @<issue-id>`

Required future coverage areas:

- Collapsed search to expanded directions repair.
- Autocomplete loading, results, no-results, service-error, keyboard selection, and Escape behavior.
- Typed fallback geocoding, service-area validation, and degraded-provider messaging.
- Current-location permission states.
- Route calculation loading, no-route, and error states.
- Route card selection, route detail, and selected polyline synchronization.
- Mobile sheet states at 390 by 844, 430 by 932, 768 px transition, and 1440 by 900 desktop.
- Layer group toggles, active counts, comparison sync, legend, source notices, metadata open/close, focus return, and source links.
- Google controls and attribution overlap checks in Browser or Playwright screenshots.

## Implementation Issue Plan

MBR-61 should create or confirm child implementation issues. This spec does not create them.

Recommended issue slices:

1. Search, Places, endpoint state, current-location repair, typed fallback geocoding, and service-area validation.
2. Route result cards, safe itinerary detail, selected-route synchronization, route reopen, and stable route IDs.
3. Map controls, overlay groups, comparison mode, legend, metadata panel, and keyboard metadata fallback.
4. Mobile bottom-surface coordinator for search, route, layer, metadata, and bike settings.
5. Accessibility and UI-state regression pass for focus, Escape behavior, ARIA, touch targets, reduced motion, and degraded-provider states.
6. Browser verification and launch-readiness gate consolidation for MBR-64.

MBR-62 can implement the functional slices once MBR-61 confirms ownership and labels. MBR-63 should polish responsive, accessibility, visual-system, and mobile overlap details. MBR-64 should make the launch-readiness decision from real gate output and Browser/Playwright evidence.

## Traceability Table

| Requirement | Source issues | Owner files | Implementation handoff | Verification |
| --- | --- | --- | --- | --- |
| Unified spec approval and no-code boundary | MBR-60, MBR-77, MBR-78, MBR-79, MBR-57, MBR-58, MBR-59 | This spec and supporting specs | MBR-61 issue breakdown | `npm run task:gate -- MBR-60 --explain`, `git diff --check` |
| Search and route-entry journeys | MBR-77, MBR-68, MBR-71, MBR-74 | `SearchCard.tsx`, `PlaceAutocomplete.tsx`, `geocoding.ts`, `useRouting.ts`, `routeStore.ts`, `uiStore.ts` | MBR-62 search/routing child issue | `npm run quality`, issue-tagged browser tests, unit tests for Places/session/service-area/fallback |
| Route cards, itinerary, and selected-route sync | MBR-77, MBR-69, MBR-72 | `ResultsSidebar.tsx`, `RouteOption.tsx`, `RouteDetails.tsx`, `RouteOverlay.tsx`, `src/types/index.ts`, `googleRoutesService.ts` | MBR-62 route results child issue | Browser test for card/detail/polyline sync; tests that unsupported fields stay absent |
| Map controls, layer groups, and comparison mode | MBR-78, MBR-70, MBR-73, MBR-76 | `MapContainer.tsx`, `MapOverlayRenderer.tsx`, `mapOverlayRegistry.ts`, `mapOverlayStore.ts`, `google-maps-theme.css` | MBR-62 map controls child issue | Browser tests for grouping, active counts, legend, comparison sync, attribution/control overlap |
| Overlay metadata and provenance | MBR-78, MBR-70, MBR-76 | `mapOverlayRegistry.ts`, `MapContainer.tsx`, `MapOverlayRenderer.tsx`, proposal data imports | MBR-62 metadata child issue | Metadata browser tests, registry unit tests, source/disclaimer visibility, keyboard fallback |
| Responsive bottom-surface model | MBR-79, MBR-73, MBR-75 | `ResultsSidebar.tsx`, `SearchCard.tsx`, `MapContainer.tsx`, `uiStore.ts`, `design-system.css`, `google-maps-theme.css` | MBR-63 polish or MBR-62 mobile child issue | 390 by 844, 430 by 932, 768 px, and 1440 by 900 checks |
| Accessibility, focus, and UI states | MBR-79, MBR-66, MBR-75 | Search, results, map, shared styles, and stores | MBR-63 polish and MBR-64 QA | ARIA/focus/browser assertions, no color-only states, loading/empty/error/degraded coverage |
| Launch readiness | MBR-64 informed by MBR-60/62/63 | Playwright tests, package scripts, task gates, docs | MBR-64 | `npm run quality`, `npm run test:browser:required`, task gate output, exact blocker report |

## Open Owner Decisions

- Exact service-area geometry: polygon, bounding rule, or hybrid around Oxnard, San Bernardino, San Fernando, and San Clemente.
- Whether current-location prompting should become fully user-initiated instead of mount-time.
- Final owner for the mobile bottom-surface coordinator: `uiStore`, `MapContainer`, or a new narrow panel-state module.
- Whether edited endpoints/options mark existing routes stale or immediately clear visible route results.
- Exact visual treatment for demoting Driving while preserving comparison value.
- When future route preview becomes active and whether it is a toggle, route mode, or scenario entry.
- Whether Map ID and Advanced Markers are part of the next implementation slice or a separate setup/accessibility issue.
- Final MBR-64 launch matrix for WebKit, manual screen-reader checks, or accessibility scanners.

## Acceptance Checklist

- The spec explicitly states that Figma is optional and unavailable for this phase.
- The MBR-59 Markdown docs are the binding design source of truth.
- Browser/app screenshots and Playwright verification replace Figma review for practical acceptance.
- React, Vite, TypeScript, Google Maps, Zustand, and CSS custom properties remain the baseline.
- VeloRail's car-free, future-transit, visionary, nationalized, and freight overlay identity is preserved.
- Search, directions, results, route detail, map controls, overlays, metadata, loading, empty, error, degraded, desktop, mobile, keyboard, focus, and accessibility behavior are covered.
- Requirements map to owner files, source issues, implementation handoff areas, and verification commands.
