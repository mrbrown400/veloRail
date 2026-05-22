# Current Frontend Inventory

Issues: MBR-57, MBR-68, MBR-69, MBR-70  
Milestone: Current App + Repo Analysis  
Verified: 2026-05-22 on `feature/velorail-frontend-redesign-google-maps-parity`

## Scope

This inventory documents the current frontend architecture before redesign work. It is intentionally descriptive: no redesign implementation, Figma output, routing rewrite, map provider replacement, or new tests are part of this milestone.

## App Entry Path

The active React app path is:

```text
index.html -> src/main.tsx -> src/App.tsx
```

`src/main.tsx` creates the React root, wraps `App` in `QueryClientProvider`, and imports the active style stack:

- `src/styles/design-system.css`
- `src/styles/google-maps-theme.css`

`src/App.tsx` owns Google Maps script loading, app-level map loading/error states, and the primary shell composition:

- `MapContainer`
- `SearchCard`
- `ResultsSidebar`

## Stack

The active frontend stack is:

- React 18 and TypeScript.
- Vite 7.
- Zustand for UI, route, realtime, and map overlay state.
- React Query is installed and the root provider exists, though the inspected search/map/results flow mostly uses local stores and services.
- Google Maps JavaScript API through `@react-google-maps/api`.
- `@googlemaps/js-api-loader` remains in legacy loading paths such as `src/google_map.js`.
- Playwright for browser verification.
- Node built-in test runner for unit tests.

## Google Maps Runtime And Loading

`src/App.tsx` loads Google Maps with these libraries:

- `places`
- `geometry`
- `routes`

The API key comes from `CONFIG.GOOGLE_MAPS_API_KEY`, which maps to `VITE_GOOGLE_MAPS_API_KEY` in `src/services/config.ts`.

Current app-level states:

- Loading: centered `Loading VeloRail...`.
- Load error: centered `Error Loading Google Maps` and API key guidance.
- Loaded: full-viewport map with search, route results shell, and layer controls.

Runtime Browser inspection on `http://127.0.0.1:5173/` confirmed the loaded app shows the route search, route results shell, and layer panel. The browser console also reported Google Places legacy-service migration warnings for `AutocompleteService` and `PlacesService`; this is a Places API research risk, not a current local build failure.

## Stores, Hooks, And Services

Stores:

- `src/stores/routeStore.ts`: route results, selected route, loading/error state, and search parameters.
- `src/stores/uiStore.ts`: collapsed or expanded search state, sidebar visibility, geolocation status, current location, and geolocation usage.
- `src/stores/mapOverlayStore.ts`: overlay visibility and present/future comparison mode.
- `src/stores/realtimeStore.ts`: tracked vehicle, vehicle position, tracking active state, and last update timestamp.

Hooks:

- `src/hooks/useRouting.ts`: submit-time route calculation orchestration.
- `src/hooks/useGeolocation.ts`: geolocation request, refresh, watch setup, and UI store synchronization.
- `src/hooks/useVehicleTracking.ts`: placeholder hook for vehicle tracking; it does not currently connect to GTFS-RT.

Services:

- `src/services/geocoding.ts`: Google Places, Google Geocoder, Photon fallback, Nominatim fallback, place normalization, and geocode cache.
- `src/services/routing.ts`: route comparison fan-out and OSRM-based fallback route construction.
- `src/services/googleRoutesService.ts`: Google Routes JavaScript library wrapper and route response conversion.
- `src/services/multimodalRouter.ts`: Google Routes-backed Bike + Rail, Walk + Rail, and Driving route construction.
- `src/services/bikeDurationService.ts`: bike speed/weight settings and bike-duration estimation.
- `src/services/config.ts`: Google, OSRM fallback, ORS, Swiftly, Metrolink, and refresh configuration.

## Major Components

Search:

- `src/components/Search/SearchCard.tsx`
- `src/components/Search/PlaceAutocomplete.tsx`
- `src/components/Search/LocationStatus.tsx`
- `src/components/Search/TimeSelector.tsx`
- `src/components/Search/ModeSelect.tsx`
- `src/components/Search/BikeSettings.tsx`

Results:

- `src/components/Results/ResultsSidebar.tsx`
- `src/components/Results/RouteOption.tsx`
- `src/components/Results/RouteDetails.tsx`
- `src/components/Results/VehicleTrackingStatus.tsx`

Map:

- `src/components/Map/MapContainer.tsx`
- `src/components/Map/MapOverlayRenderer.tsx`
- `src/components/Map/RouteOverlay.tsx`
- `src/components/Map/VehicleMarker.tsx`
- `src/components/Map/mapOverlayRegistry.ts`

Shared UI:

- `src/components/ui/Button.tsx`
- `src/components/ui/Chip.tsx`
- `src/components/ui/Surfaces.tsx`
- `src/components/ui/ToggleChip.tsx`
- `src/components/ui/icons.tsx`

## Styles And Design System

`src/styles/design-system.css` is the token layer. It defines `--vr-*` color, typography, spacing, radius, shadow, focus, z-index, and layout tokens.

`src/styles/google-maps-theme.css` aliases `--gm-*` values to the VeloRail token layer and owns the active app layout, search card, autocomplete, results sidebar, route option/details, map layer panel, metadata panel, loading states, and responsive behavior.

Design-system constraints:

- Shared primitives are intentionally thin wrappers around native HTML elements.
- `Button` wires variants, size, full width, icons, and `aria-pressed`.
- `Panel` maps label props and `aria-hidden`.
- `ToggleChip` standardizes toggle buttons over `Button`.
- `icons.tsx` provides local SVG icons marked `aria-hidden`.
- `tests/design-system.test.js` checks token and reusable class presence only; it does not validate rendered accessibility or responsive behavior.

## Current UI States

App states:

- Map loading.
- Map load failure.
- Loaded shell.

Search states:

- Collapsed mode: destination input plus location status.
- Expanded mode: start input, destination input, location button.
- Geolocation pending, granted, denied, unavailable.
- Typed lookup progress.
- Route calculation progress.
- Validation errors for missing start or destination.
- Geocode failure error.
- Route calculation error.

Autocomplete states:

- Closed.
- Debounced loading.
- Suggestions visible.
- Highlighted suggestion.
- Escape close.
- No-results markup exists, but the dropdown currently closes when there are zero results, so the no-results row is effectively hidden.

Results states:

- Closed.
- Open loading.
- Open error.
- Open empty.
- Route options plus selected details.
- Closed with route-results reopen button.

Map and overlay states:

- Current Google transit overlay on by default.
- Bicycling off by default.
- Future, visionary, and nationalized overlays off by default.
- Present-only comparison mode by default.
- Present + Future comparison mode toggles official future overlay visibility.
- Legend closed or open.
- Metadata panel closed or populated from an overlay metadata event.

## Responsive Behavior

Current responsive behavior is CSS breakpoint based:

- Base layout is a fixed full-viewport map shell with `body { overflow: hidden; }`.
- Search card is absolute top-left and maxes at viewport width minus margins.
- Results sidebar is a left fixed panel on desktop.
- At `max-width: 768px`, results become a bottom sheet, layer controls move toward bottom, and metadata becomes a bottom constrained panel.
- At `max-width: 480px`, route option padding/duration sizing tightens and layer buttons become one column.
- `MapContainer` uses viewport-specific route-fit padding so selected routes leave room for desktop side panels or mobile bottom panels.

Responsive gaps:

- Playwright has one Chromium project; mobile checks use individual viewport changes rather than a full mobile project matrix.
- Search and results do not yet behave like a full Google Maps-style editable mobile route sheet.
- Layer legend labels and descriptions use ellipsis, so long metadata can be visually hidden until metadata panel interaction.
- No focus trap or focus return exists for results, metadata, bike settings, or legend panels.

## Test Commands

Primary commands from `package.json`:

```bash
npm run test
npm run lint
npm run typecheck
npm run build
npm run quality
npm run test:browser
npm run test:browser:required
npm run task:gate -- <task-id> --explain
```

Browser verification:

- `playwright.config.ts` uses `tests/browser`.
- If `PLAYWRIGHT_BASE_URL` is unset, Playwright builds and previews on `http://127.0.0.1:4174`.
- `npm run test:browser:required` sets `PLAYWRIGHT_STRICT_MAPS=1`, which turns a Google Maps load failure into a hard failure instead of a skip.

Existing browser specs:

- `tests/browser/route-search.spec.ts`
- `tests/browser/overlay-metadata.spec.ts`

Existing relevant unit tests:

- `tests/routing.test.js`
- `tests/googleRoutesService.test.js`
- `tests/mapOverlayRegistry.test.js`
- `tests/routingComparison.test.js`
- `tests/design-system.test.js`

## Major Repo Constraints

- Google Maps remains the base map, gesture, viewport, marker, polyline, and map-event runtime where feasible.
- Do not introduce Mapbox, Leaflet, custom tiles, or a second map runtime for this redesign.
- Places, Geocoder, and Routes should be used first where they can express the workflow.
- Fallback providers such as Photon, Nominatim, and OSRM are resilience or feature-gap paths, not redesign targets.
- App-owned overlays are allowed for future, visionary, nationalized, freight, GTFS, scoring, and scenario data because Google Maps does not expose those planning surfaces.
- Custom planning overlays must preserve status, classification, confidence, uncertainty, provenance, and disclaimers.
- Browser-facing implementation work requires strict browser verification; this milestone is docs-only.

## Implementation Boundaries For Later Milestones

- Preserve `src/types/index.ts` route contracts unless MBR-60 explicitly expands them.
- Preserve `mapOverlayStore` as the source of truth for overlay visibility and comparison mode.
- Keep redesign work display-oriented until a later issue explicitly authorizes data-model, routing, realtime, or API changes.
- Treat Driving as an existing route comparison option that needs product framing before it becomes more prominent.
- Treat Google Places legacy-service migration warnings as a research/API follow-up, not an implicit reason to replace Google Maps.
