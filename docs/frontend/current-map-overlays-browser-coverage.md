# Current Map Overlays And Browser Coverage

Issues: MBR-57, MBR-70  
Verified: 2026-05-22 on `feature/velorail-frontend-redesign-google-maps-parity`

## Scope

This document inventories current map behavior, overlay controls, metadata surfaces, visual identity, strict browser coverage, and browser verification gaps. It does not implement controls, overlays, tests, or routing changes.

## MapContainer Behavior

`src/components/Map/MapContainer.tsx` is the active map shell. It:

- Creates the `GoogleMap` React surface.
- Centers the map on Los Angeles.
- Renders `MapOverlayRenderer`.
- Renders `RouteOverlay` when `selectedRoute` exists.
- Renders `VehicleMarker` when realtime state has both `vehiclePosition` and `trackedVehicle`.
- Owns the layer panel.
- Owns the legend open/closed state.
- Owns the selected overlay metadata panel.
- Listens for `velorail:map-overlay-metadata-selected`.
- Fits bounds to the selected route with responsive padding.
- Closes metadata on Escape.

Route fit padding is viewport based:

- Small mobile leaves top and bottom room for search and bottom panels.
- Tablet/mobile leaves bottom room for bottom sheet behavior.
- Desktop leaves left padding for the route/results panel.

## GoogleMap Options

Current `GoogleMap` options:

- Google dark color scheme.
- Default Google UI remains enabled.
- Zoom control enabled.
- Zoom control placed at top right.
- Map type control disabled.
- Street View control disabled.
- Fullscreen control disabled.
- Gesture handling set to `greedy`.

Boundary:

- Redesign should work with Google controls and attribution, not replace them with a second map-control system.

## Route Overlay Rendering

`src/components/Map/RouteOverlay.tsx` renders selected route geometry through Google Maps overlays:

- Start marker with a circular symbol.
- Destination marker with a circular symbol.
- One polyline stack per route leg.
- White outer casing.
- Dark casing.
- Main colored line.
- Optional station markers for transit legs with `leg.stations`.

Leg identity:

- Transit uses `leg.color` or blue.
- Walk uses gray dashed line.
- Bus uses blue dashed line.
- Driving uses blue.
- Bike uses bright green.

Z-index:

- Route casings and lines use z-indexes `9000` to `9002`, keeping selected routes above proposal overlays.
- `VehicleMarker` currently uses z-index `1000`, so selected route lines can sit above vehicle markers.

Risk:

- Any redesign of route/scenario stacking should preserve selected route priority and explicitly test marker/line overlap.

## Layer Panel Behavior

`MapContainer` renders the layer panel as an app-owned panel over the map.

Current panel surfaces:

- Live status text with comparison mode and active overlay count.
- Legend toggle.
- Comparison mode group.
- Current group.
- Future group.
- Visionary group.
- Nationalized Rail Planning group.
- Visible legend region when open.

Current controls:

- Present Only.
- Present + Future.
- Current.
- Biking.
- Future Transit.
- Vision.
- Passenger Conversion.

Accessibility states:

- Toggle controls use `aria-pressed`.
- The panel has an accessible label.
- Group descriptions are present as screen-reader-only text.
- Legend has `aria-expanded`, `aria-controls`, and a labelled region.
- Metadata panel has a labelled region, close button, and screen-reader instruction text.

Gaps:

- No focus move, focus trap, or focus return for legend or metadata.
- No keyboard-selectable overlay feature list for users who cannot click map geometry.
- Long legend labels/descriptions are truncated visually.

## Overlay Registry And Store Behavior

Overlay identity lives in `src/components/Map/mapOverlayRegistry.ts`.

Registered overlays in deterministic order:

1. `current-transit`
2. `future-projects`
3. `visionary-concepts`
4. `nationalized-rail`
5. `bicycling`

Default visibility:

- `current-transit`: on.
- `future-projects`: off.
- `visionary-concepts`: off.
- `nationalized-rail`: off.
- `bicycling`: off.

`src/stores/mapOverlayStore.ts` owns:

- `visibility`.
- `comparisonMode`.
- `setComparisonMode`.
- `setOverlayVisible`.
- `toggleOverlay`.
- `resetOverlayVisibility`.

Comparison modes:

- `present-only`: current Google Maps transit with official future overlay off.
- `present-plus-future`: current Google Maps transit plus official future project context.

Important synchronization:

- Setting comparison mode changes `future-projects` visibility.
- Toggling `future-projects` updates comparison mode.
- Unknown overlay ids are ignored by the store.

Boundary:

- Redesign work should not create a second overlay visibility model in component-local state.

## Native And App-Owned Overlay Sources

Native Google layers:

- `current-transit` uses `google.maps.TransitLayer`.
- `bicycling` uses `google.maps.BicyclingLayer`.

App-owned proposal overlays:

- `future-projects`.
- `visionary-concepts`.
- `nationalized-rail`.

Proposal overlays are built from `IMPORTED_TRANSIT_PROPOSALS` and rendered through Google Maps:

- `Polyline`.
- `Marker`, only when station marker rendering is explicitly enabled.
- `InfoWindow`.
- Google Maps click listeners.

The Google basemap is rendering context only. It is not source evidence for future, visionary, freight, or conversion claims.

## Metadata Panel Behavior

Overlay click behavior:

1. Proposal polyline or marker click fires a Google Maps listener.
2. Registry publishes `velorail:map-overlay-metadata-selected`.
3. Registry opens a Google `InfoWindow`.
4. React metadata panel opens with normalized metadata.

Metadata fields currently available:

- Object id.
- Proposal id.
- Kind: line, corridor, or station.
- Title.
- Subtitle.
- Badge label and badge class.
- Status.
- Classification.
- Confidence.
- Uncertainty.
- Geometry source.
- Opening year.
- Phase.
- Station role and station notes.
- Freight owner.
- Freight operator.
- Track usage.
- Electrification.
- Suitability rating.
- Suitability score.
- Suitability method.
- Missing scoring data.
- Source corridor.
- Conversion scenario.
- Station assumptions.
- Disclaimer.
- Source links with publisher and accessed date.

Current close behavior:

- Close metadata button.
- Escape key.

Gap:

- There is no focus-management contract around opening or closing metadata.

## Future, Visionary, And Nationalized Visual Identity

Style families are centralized in `MAP_OVERLAY_STYLE_CONFIG`:

- Current: blue Google transit context.
- Context: green Google bicycling context.
- Future: purple official future project.
- Visionary: red/pink speculative concept.
- Freight only: gray freight corridor.
- Converted passenger: blue/teal passenger conversion concept.

Registry behavior:

- Proposal records can override colors and legend labels.
- Future, visionary, freight, and converted passenger proposal layers are normalized toward thin Google-like solid strokes.
- Official future overlay only accepts proposals with `classification: official` and statuses `planned`, `funded`, or `under_construction`.
- Visionary overlays are unofficial concepts and must preserve speculative language.
- Nationalized overlays are hypothetical passenger-conversion planning over sourced freight corridors and must not read as approved service.

Related architecture docs:

- `docs/architecture/google-maps-first-policy.md`
- `docs/architecture/map-overlay-style-metadata.md`
- `docs/architecture/official-future-transit-dataset.md`
- `docs/architecture/visionary-proposal-registry.md`
- `docs/architecture/freight-rail-corridor-dataset.md`

## Strict Browser Coverage

Strict command:

```bash
npm run test:browser:required
```

This sets `PLAYWRIGHT_STRICT_MAPS=1`. In strict mode, a visible `Error Loading Google Maps` state fails instead of skipping.

Browser config:

- `playwright.config.ts`
- Test directory: `tests/browser`
- Default base URL: `http://127.0.0.1:4174`
- If `PLAYWRIGHT_BASE_URL` is unset, Playwright runs `npm run build && npm run preview -- --host 127.0.0.1 --port 4174`.
- One project: Chromium desktop.

Existing `tests/browser/route-search.spec.ts` coverage:

- Route search visible response after typed endpoints.
- Google Routes request shape and route labels.
- Bike/walk rail duration sanity.
- Bike settings popover viewport bounds.
- Future transit overlay grouped and default off.
- Layer panel group labels and legend visibility.
- Future overlay toggle state.
- Metadata Escape dismissal through synthetic event.
- Mobile metadata panel viewport bounds at 390px.
- Results close and reopen when routes are available.

Existing `tests/browser/overlay-metadata.spec.ts` coverage:

- Nationalized overlay legend and metadata panel.
- Visionary overlay legend and metadata panel.
- Present-only and Present + Future comparison mode synchronization.

Existing `tests/mapOverlayRegistry.test.js` coverage:

- Registry order.
- Default visibility.
- Comparison modes.
- Group definitions.
- Legend items.
- Style config.
- Proposal grouping.
- Official future filtering.
- Metadata details and provenance.
- Freight and converted passenger metadata.

## Missing Browser Coverage

Current browser coverage gaps:

- Real Google Maps polyline clickability for proposal overlays.
- Rendered overlay pixel or canvas checks.
- Route overlay versus scenario overlay stacking.
- Vehicle marker visibility above selected route lines.
- Zoom-level station marker visibility.
- Google attribution and native control overlap.
- Full mobile touch flow.
- Focus order through search, layer panel, metadata, and results.
- Focus return after panel close.
- Long metadata/source content on mobile.
- Layer legend truncation behavior.
- Route details timeline fields.
- Future route result display through actual search.

## Browser Verification Gaps

Operational gaps:

- Strict browser tests require a working `VITE_GOOGLE_MAPS_API_KEY`.
- Browser tests are currently DOM-heavy and synthetic-event-friendly by design; that is stable for CI but does not prove map object hit testing.
- Mobile behavior is covered by selected viewport assertions, not a separate mobile browser project.
- Map runtime warnings, billing warnings, or Places legacy warnings should be reported as environment/API follow-ups when they appear, not hidden by tests.

Recommended follow-up boundaries:

- Add browser assertions only when implementation issues change user-visible flows.
- Prefer existing synthetic metadata event seam for deterministic metadata-panel tests.
- Use targeted manual Browser checks for real map hit testing, attribution overlap, and pixel/visual stacking before adding brittle tests.
- Keep Google Maps as the only rendering runtime.
- Keep future, visionary, and nationalized overlays as planning context, not current service.
