# Current Search And Route Entry Flow

Issues: MBR-57, MBR-68  
Verified: 2026-05-22 on `feature/velorail-frontend-redesign-google-maps-parity`

## Scope

This document maps the current search input, place lookup, route submit, feedback, and route calculation flow. It documents existing behavior and redesign gaps only.

## File-Level Flow Map

```text
src/main.tsx
  -> imports active styles and renders App

src/App.tsx
  -> useLoadScript({ libraries: ['places', 'geometry', 'routes'] })
  -> MapContainer(onMapLoad={(map) => initGooglePlaces(map)})
  -> SearchCard
  -> ResultsSidebar

src/components/Search/SearchCard.tsx
  -> owns input text, submit progress text, validation feedback
  -> writes routeStore.searchParams
  -> calls geocode() for typed text not selected from suggestions
  -> calls useRouting().calculateRoutes(start, end)

src/components/Search/PlaceAutocomplete.tsx
  -> debounced searchPlaces(query)
  -> suggestion selection
  -> getPlaceDetails(place) when coordinates are missing

src/services/geocoding.ts
  -> Google Places AutocompleteService
  -> Google PlacesService.getDetails
  -> Photon fallback for suggestion search
  -> Google Geocoder
  -> Nominatim fallback for free text geocoding

src/hooks/useRouting.ts
  -> compareRoutes(start, end, safety, mode, departureTime, false)
  -> set route loading/error/results
  -> select first route
  -> expand search and open sidebar on success
  -> start vehicle tracking for first transit leg identifiers when available

src/services/routing.ts
  -> compareRoutes fan-out
  -> Google Routes-backed Bike + Rail, Driving, Walk + Rail where enabled
  -> OSRM fallback route construction where configured
```

## State Flow

`routeStore` owns:

- `searchParams.start`
- `searchParams.end`
- `searchParams.mode`
- `searchParams.safety`
- `searchParams.departureTime`
- `routes`
- `selectedRoute`
- `isLoading`
- `error`

`uiStore` owns:

- `searchMode`, either `collapsed` or `expanded`.
- `sidebarOpen`.
- `locationStatus`.
- `currentLocation`.
- `isUsingGeolocation`.

`SearchCard` owns local input and submit UI state:

- `startValue`.
- `endValue`.
- `isResolvingPlaces`.
- `searchMessage`.

Typing in either input clears the matching selected location in `searchParams`, which means submit-time geocoding is required unless the user selected a suggestion with coordinates.

## Search And Geocoding Providers

Place suggestions:

- Primary: Google `AutocompleteService`, initialized after `MapContainer` has a map instance.
- Fallback: Photon, biased around `LA_CENTER`.
- Suggestion limit defaults to five.
- Suggestions normalize into `PlaceResult` with `id`, `name`, `address`, `type`, nullable `lat/lon`, and optional `placeId`.

Place details:

- Primary: Google `PlacesService.getDetails` with `geometry`, `name`, and `formatted_address`.
- Fallback: `geocode("${place.name}, ${place.address}")`.
- If details and fallback geocode both fail, the original `PlaceResult` can still be passed up without coordinates. `SearchCard` only writes selected start/end when `lat` and `lon` are present.

Free text geocoding:

- Primary: Google Geocoder when `VITE_GOOGLE_MAPS_API_KEY` exists and Maps has loaded.
- Google geocoding is bounded around Los Angeles.
- Fallback: Nominatim, with `Los Angeles County` appended to the query.
- Results are cached by lowercased query.

Runtime note:

- Browser inspection showed Google Places warnings for `AutocompleteService` and `PlacesService` legacy migration. The current code still works with the loaded Maps runtime, but MBR-58 should research the newer Places APIs before implementation work expands search.

## Current Places And Geocoder Fallback Behavior

Current fallback order by user action:

- Focus and type two or more characters: `PlaceAutocomplete` calls `searchPlaces`.
- If Google Places is not initialized or fails: `searchPlaces` falls back to Photon.
- Select a Google suggestion without coordinates: `getPlaceDetails` calls Google details.
- If details fail: `getPlaceDetails` calls free text `geocode`.
- Submit unselected typed text: `SearchCard.resolveTypedLocation` calls `geocode`.
- If Google Geocoder fails or is unavailable: `geocode` falls back to Nominatim.

Important distinction:

- Suggestion lookup uses Photon fallback.
- Submit-time typed geocoding uses Nominatim fallback.
- Route calculation falls back to OSRM only after locations are resolved.

## Route Submission States

Submit starts in `SearchCard.handleSearch`:

1. Clears prior route error and search message.
2. Sets `isResolvingPlaces` true.
3. Resolves start from `routeStore.searchParams.start`, geolocation, or typed text.
4. Resolves destination from `routeStore.searchParams.end` or typed text.
5. Sets `searchMessage` to `Calculating routes...`.
6. Calls `calculateRoutes(start, end)`.
7. Clears `searchMessage` if routes are returned.
8. Stores caught errors in `routeStore.error`.
9. Sets `isResolvingPlaces` false.

`useRouting.calculateRoutes`:

1. Sets route loading true and clears route error.
2. Calls `compareRoutes`.
3. Stores returned routes.
4. Selects the first route when available.
5. Expands the search form.
6. Opens the results sidebar.
7. Starts realtime tracking for the first transit leg if `tripId` or `routeId` exists.
8. If no routes return, closes the sidebar and sets a no-route error.
9. On thrown errors, sets the error and returns an empty list.

Current `includeFuture` is hardcoded to `false` in `useRouting`, so search does not currently return future route options even though future route UI fields exist.

## Loading, Error, And No-Result States

Visible search states:

- `Looking up start location...`
- `Looking up destination location...`
- `Calculating routes...`
- Button text: `Looking up...`, `Calculating...`, or `Find Route`.
- Missing start error.
- Missing destination error.
- Geocode failure error with the typed query.
- Route calculation error from the caught exception.
- No routes found error from `useRouting`.

Visible results states:

- Results sidebar loading state: `Calculating route options`.
- Results sidebar error state: `Route search failed`.
- Results sidebar empty state: `No routes calculated yet`.
- Results sidebar route option and selected details state.

Current no-result gap:

- `PlaceAutocomplete` has `autocomplete-no-results` markup, but it sets `isOpen` to `searchResults.length > 0`. With zero results, the dropdown closes, so the no-results row is normally not visible.

Current no-route behavior:

- If `compareRoutes` returns no routes, `useRouting` closes the sidebar and sets the route error. The search card feedback is the main visible no-route surface.

## Test Coverage

Browser coverage:

- `tests/browser/route-search.spec.ts` verifies typed endpoints produce visible feedback or sidebar response after `Find Route`.
- It checks Google Routes JavaScript request shape does not trigger known route request errors.
- It checks route labels for Bike + Rail, Driving, and Walk + Rail when route options load.
- It checks typed input Escape behavior.

Unit coverage:

- `tests/routing.test.js` verifies fallback routing uses VeloRail walk and bike speeds instead of raw OSRM durations.
- `tests/googleRoutesService.test.js` verifies Google Routes request shape and conversion for bike, driving, and full transit routes.

Missing focused coverage:

- `SearchCard` validation branches.
- `PlaceAutocomplete` zero-result visibility.
- Google Places to Photon fallback.
- Google Geocoder to Nominatim fallback.
- Geolocation denied and unavailable UI.
- Details failure where a selected suggestion has no coordinates.
- Search mode collapsed-to-expanded transitions after validation failure.

## UX Gaps Versus Google Maps Search And Directions

Current gaps:

- No origin/destination swap.
- No multi-stop entry.
- No recent places or saved places.
- No map-click-to-fill start or destination.
- No per-field error state.
- No route preview before submit.
- No explicit "Directions" mode transition distinct from basic search.
- Manual autocomplete lacks Google Maps-style rich disambiguation and category depth.
- Collapsed mode depends on geolocation or expanding the form, which is less explicit than Google Maps directions entry.
- Driving appears beside car-free modes and needs product framing if it remains comparison-only.
- No clear UI affordance for fallback provider use or degraded search quality.

Implementation boundaries:

- Improve input states and affordances without replacing Google Maps.
- Keep Google Places and Geocoder first unless API research documents a specific Google API migration.
- Keep Photon and Nominatim as fallback paths only.
- Do not rewrite route calculation as part of search-entry redesign.
- Do not show route facts that are not in the current `Route` and `RouteLeg` contracts.
