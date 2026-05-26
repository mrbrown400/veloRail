# Search And Routing User Journeys Specification

Issues: MBR-77, MBR-60
Milestone: Unified Product/Design Specification
Verified: 2026-05-26 on `feature/velorail-frontend-redesign-google-maps-parity`
Scope: implementation-ready journey requirements only. No code, routing behavior, Figma file, or QA execution changed.

## Outcome

The redesigned search and routing journey should make VeloRail's core task obvious: find a car-free route across Los Angeles, compare route families, inspect the selected itinerary, and keep the route visible on the Google map. The journey should borrow Google Maps state clarity while preserving VeloRail's custom Bike + Rail, Walk + Rail, future context, and planning-data boundaries.

## Journey Principles

- Keep the map visible and useful through search, route calculation, route alternatives, route detail, and route reopen.
- Search may start destination-first, but the user must always see how to provide or repair the origin.
- Every typed or selected endpoint has a clear state: raw input, selected place, fallback resolved, invalid, outside service area, loading, or error.
- Route-family alternatives are the primary comparison model. Google same-mode alternatives are later contract work.
- Route modification should reuse the same fields and state model instead of resetting the experience.
- Driving is comparison-only when present and should not compete visually with Bike + Rail and Walk + Rail.

## Default Map To Search

Entry state:

- Google map loaded.
- Search can be collapsed.
- No route has been calculated.
- Current Google transit context is visible by default.

Requirements:

1. The first screen is the map, not a landing page.
2. A compact destination search entry is visible and reachable.
3. Location status is visible without forcing geolocation permission.
4. The search control does not cover Google controls or attribution.
5. The user can enter a destination, expand directions, or open layers without losing map context.

Owner files: `src/App.tsx`, `src/components/Map/MapContainer.tsx`, `src/components/Search/SearchCard.tsx`, `src/stores/uiStore.ts`.

## Collapsed Search To Expanded Directions

Goal: a destination-first user can submit and repair a missing origin without losing the destination.

Requirements:

1. Collapsed search accepts destination input and autocomplete selection.
2. Submitting with a destination but no origin expands directions mode.
3. The selected or typed destination stays populated.
4. The origin field receives focus or is clearly identified.
5. A field-level prompt explains the missing origin and offers manual entry or current location.
6. The route action remains available after the user repairs the origin.

Owner files: `SearchCard.tsx`, `PlaceAutocomplete.tsx`, `routeStore.ts`, `uiStore.ts`.

## Autocomplete Selection

States:

| State | Requirement | Recovery |
| --- | --- | --- |
| Idle | Dropdown closed when field is empty or below query threshold. | User types. |
| Loading | Dropdown remains open with loading row. | Results, no results, or service error replaces row. |
| Results | Rows show primary place name and secondary geographic context. | User selects, arrows, tabs, or escapes. |
| Highlighted | Active descendant follows Arrow navigation. | Enter selects, Escape closes. |
| No results | Visible no-results row remains open for active query. | User edits or clears. |
| Service error | Visible service-error row distinguishes provider failure from no matches. | User edits, retries, or submits typed text. |
| Details lookup | Selected prediction without coordinates resolves minimal place fields. | Success stores coordinates; failure falls back to geocode. |

Requirements:

- Preserve the custom VeloRail autocomplete UI.
- Prefer Google Places New Autocomplete Data API behind the existing `searchPlaces` service boundary.
- Use session tokens for prediction plus selected-place details.
- Request only needed fields unless a later issue expands the contract.
- Store selected display value, coordinates, place ID, and fallback confidence when available.

Accessibility:

- Use combobox/listbox/option semantics.
- Communicate active option state through `aria-activedescendant` or equivalent.
- Arrow keys move through predictions.
- Enter selects an active option or submits only when unambiguous.
- Escape closes the list without clearing typed text.
- Loading uses status semantics; errors use alert semantics.

Owner files: `PlaceAutocomplete.tsx`, `src/services/geocoding.ts`.

## Typed Fallback Geocoding

Goal: unselected typed text can still route when a user submits a clear address or place.

Requirements:

1. Submit-time typed origin and destination text resolves with Google Geocoder first.
2. Fallback providers remain fallback-only and must not be presented as equivalent quality when confidence differs.
3. Field-level progress names whether origin or destination is resolving.
4. Geocode failure is attached to the responsible field.
5. Final coordinates are validated against the service area after resolution.
6. Fallback or degraded resolution shows a user-facing confidence message when it may affect route quality.

Owner files: `SearchCard.tsx`, `src/services/geocoding.ts`, `src/hooks/useRouting.ts`.

## Use Current Location

Goal: the user can explicitly choose current location as origin and recover when permission fails.

Requirements:

1. Current-location use is an explicit action near the origin field.
2. Pending, granted, denied, timeout, and unavailable states are visible.
3. Permission denied never blocks manual origin entry.
4. A granted location populates the origin as a resolved coordinate-backed location.
5. If the current code requests geolocation on mount, implementation should reconcile that behavior with the explicit action requirement.

Owner files: `src/hooks/useGeolocation.ts`, `src/components/Search/LocationStatus.tsx`, `SearchCard.tsx`.

## Time, Mode, And Bike Settings

Requirements:

- Expanded directions keeps time, route mode, bike settings, and safety options visible.
- Time and mode changes clear stale errors without clearing valid endpoint selections.
- Bike setting changes should not auto-recalculate unless a later issue explicitly adds that behavior.
- Driving remains comparison-only and visually quieter than Bike + Rail and Walk + Rail.
- Settings must be reachable and usable on mobile without hiding the active route action behind the keyboard.

Owner files: `TimeSelector.tsx`, `ModeSelect.tsx`, `BikeSettings.tsx`, `SearchCard.tsx`.

## Route Calculation

Route loading sequence:

1. Clear stale route errors.
2. Resolve origin.
3. Resolve destination.
4. Validate service area.
5. Show route calculation progress.
6. Call the current route comparison path.
7. Store routes.
8. Select the default route.
9. Open results.
10. Fit the selected route with panel-aware map padding.

Requirements:

- Do not rewrite route calculation for this journey spec.
- Route calculation progress should be visible and screen-reader friendly.
- Route errors and no-route states should appear where the user can repair endpoints or settings.
- Successful calculation opens route results without hiding the selected route on the map.

Owner files: `useRouting.ts`, `src/services/routing.ts`, `src/services/googleRoutesService.ts`, `RouteOverlay.tsx`.

## Route Alternatives

Baseline alternatives:

- Bike + Rail.
- Walk + Rail.
- Driving comparison when requested or available.

Requirements:

- Route cards show route family alternatives before any same-mode alternative work.
- Bike + Rail and Walk + Rail are first-class.
- Driving is comparison-only and must not be presented as the primary route recommendation.
- Google same-mode alternatives are deferred until stable route IDs, source metadata, duplicate-label selection tests, and selected-route sync tests exist.

Owner files: `ResultsSidebar.tsx`, `RouteOption.tsx`, `src/types/index.ts`.

## Selected Route Details

Requirements:

1. Selected route detail shows route label, summary, duration, distance, transfer count, and safe status chips.
2. Itinerary rows are chronological and mode-led.
3. Each leg can show mode, from/to labels, distance, duration, transit line, line color, headsign, wait time, departure time, delay, station count only when `leg.stations` exists, and bike safety only when present.
4. Route detail uses the same selected route as the selected card and map polyline.
5. Detail remains leg-level until the route contract preserves step-level detail.

Unsupported fields:

- Fare.
- Platform or track.
- Exact arrival time.
- Agency alerts.
- Crowding or occupancy.
- Accessibility status.
- Turn-by-turn maneuvers.
- Live ETA unless realtime store data is populated by a real provider.

Owner files: `RouteDetails.tsx`, `RouteOption.tsx`, `src/types/index.ts`.

## Route Reopen

Goal: closing route results minimizes recoverable context instead of destroying it unexpectedly.

Requirements:

- Desktop close can show a reopen affordance while routes still exist.
- Mobile full sheet close should usually minimize to half or collapsed.
- Clearing a route is explicit and separate from minimizing.
- Reopen restores the previous selected route when possible; implementation must define fallback selection if the previous selected route is unavailable.
- Closing metadata or layers should not clear selected route.

Owner files: `ResultsSidebar.tsx`, `routeStore.ts`, `uiStore.ts`.

## Future Route Preview

Requirements:

- Future route UI remains dormant unless a later issue enables `includeFuture`.
- Future badges, opening dates, and savings appear only when `route.isFuture`, `expectedOpening`, or `timeSavings` are populated.
- Future route previews must never read as current Google transit service.
- If future preview becomes active, it must disclose whether the result uses official future, visionary, or scenario data.

Owner files: `useRouting.ts`, `src/services/routing.ts`, `RouteOption.tsx`, `RouteDetails.tsx`.

## No Route And Error Flows

| Scenario | Required state | User action |
| --- | --- | --- |
| Missing origin | Expand directions and focus or identify origin field. | Enter origin or use current location. |
| Missing destination | Mark destination field and keep route action available after edit. | Enter destination. |
| Location permission denied | Show denied state near origin/current-location action. | Enter origin manually or retry permission. |
| Autocomplete no results | Keep dropdown open with no-results row. | Edit query or submit typed text. |
| Autocomplete provider error | Show service-error row. | Retry, edit, or rely on submit-time geocode. |
| Geocode failed | Field-level error names the failed query. | Choose suggestion or more specific text. |
| Outside service area | Field-level or route-level message names service boundary. | Choose in-area endpoint. |
| Route calculation error | Route/search error with recovery action. | Retry or edit endpoints/options. |
| No routes returned | Dedicated no-route state, not only closed sidebar. | Edit endpoints/options. |
| Fallback provider used | Degraded confidence message when quality may differ. | Continue or choose another endpoint. |

## Browser Verification Expectations

Future implementation issues should cover:

- Collapsed-to-expanded origin repair.
- Autocomplete loading/results/no-results/service-error.
- Clear, swap, current-location, and field error states.
- Typed fallback geocoding and outside-service-area handling.
- Route calculation loading, no-route, and error recovery.
- Route card selected state, route detail, and selected polyline synchronization.
- Route reopen.
- Mobile sheet states at 390 by 844, 430 by 932, 768 px, and 1440 by 900.

Recommended commands for implementation issues:

- `npm run quality`
- `npm run task:gate -- <issue-id> --explain`
- `npm run test:browser:required -- --grep @<issue-id>`

## Acceptance Criteria

- Default map, search, directions, autocomplete, typed fallback, current location, time/mode/bike settings, route calculation, route alternatives, selected route details, route reopen, future preview, and no-route/error flows are specified.
- Desktop and mobile variants are explicit.
- VeloRail car-free route identity is preserved.
- Requirements are ready to split into implementation issues without Figma.
