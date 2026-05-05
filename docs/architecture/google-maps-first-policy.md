# Google Maps First Architecture Policy

VeloRail uses Google Maps Platform as the default rendering, routing, and location integration surface. New map or route features must start from the Google Maps JavaScript API, Google Maps SDK wrappers already in the repo, and Google Directions or Places capabilities before adding custom geospatial logic or another network service.

This policy keeps the app centered on Google Maps while allowing LA-specific transit planning data where Google does not expose future, freight, agency, or scenario geometries.

## Current Google Maps Usage

The repository currently uses these Google Maps APIs and SDK features:

- `@react-google-maps/api` loads the Maps JavaScript API in `src/App.tsx` with the `places` and `geometry` libraries.
- `GoogleMap` and `useGoogleMap` provide the React map surface in `src/components/Map/MapContainer.tsx` and `src/components/Map/RouteOverlay.tsx`.
- `google.maps.MapOptions`, `ColorScheme.DARK`, `ControlPosition`, and `LatLngBounds` configure the map and fit routes to the viewport.
- `google.maps.TransitLayer` and `google.maps.BicyclingLayer` provide first-party transit and bicycling map layers.
- `google.maps.Polyline`, `Marker`, `InfoWindow`, and `SymbolPath.CIRCLE` render route legs, station dots, start and end markers, and vehicle markers.
- `google.maps.places.AutocompleteService` and `PlacesService.getDetails` provide primary place search and coordinate lookup in `src/services/geocoding.ts`.
- `google.maps.Geocoder` provides primary address geocoding with LA bounds in `src/services/geocoding.ts`.
- `google.maps.DirectionsService` provides bike, driving, walking, and transit routing in `src/services/googleRoutesService.ts` and the legacy compatibility wrapper `src/google_directions.js`.
- Directions requests use `BICYCLING`, `DRIVING`, `WALKING`, and `TRANSIT` travel modes, metric units, traffic-aware driving durations, and rail-focused transit options where available.
- `google.maps.geometry.encoding.decodePath` decodes Google polylines when available.
- `@googlemaps/js-api-loader` remains in the legacy `src/google_map.js` path for loading `maps`, `places`, and `geometry`.
- `VITE_GOOGLE_MAPS_API_KEY` is the required API key setting, and `CONFIG.GOOGLE_ROUTES_ENABLED` keeps Google routing enabled by default.

## Default Decision Rules

- Rendering: Use Google Maps as the base map. Render custom route lines, station markers, vehicle markers, and planning overlays as Google Maps overlays.
- Routing: Use Google Directions through the existing services for bike, walk, drive, transit, and mixed-mode routing whenever it can express the trip.
- Location search: Use Google Places and Google Geocoding first. Fallback providers may remain only for resilience when Google is unavailable or not configured.
- Styling: Prefer Google Maps built-in layer behavior for first-party transit and bicycling visibility. Custom styling must not hide or replace Google transit semantics unless the feature explicitly requires an overlay.
- Provider additions: Do not introduce alternate map providers. A non-Google data or routing service must be documented as a fallback or a feature-gap exception, not a replacement surface.

## Allowed Custom Logic Exceptions

Custom geospatial or transit logic is allowed only for these cases:

- Custom overlay data: Future lines, agency planning alternatives, local bike safety overlays, station annotations, or other LA-specific shapes may be stored locally or fetched from documented sources. They must render through Google Maps overlays such as polylines, markers, or data layers.
- GTFS parsing: Static GTFS and GTFS-RT data may be fetched, parsed, cached, and queried when Google does not expose the specific schedule, vehicle, delay, stop mapping, or agency feed details required by the feature.
- Freight-corridor datasets: Freight rail corridors, shared-use right-of-way, ports, yards, or goods-movement datasets may be custom datasets when Google does not provide the planning geometry or operating metadata. They must include source, license or terms, retrieval date, and transformation notes.
- Simulation logic: Scenario modeling, future service assumptions, frequency estimates, transfer heuristics, vehicle movement interpolation, and visionary rail plans may be computed locally when they are not claims about current Google routing. UI copy and data models must identify them as estimated, simulated, planned, or scenario-based.

## Provenance Requirements

Every non-Google custom transit overlay or dataset must document:

- Source name and URL or file origin.
- Publisher or agency.
- Retrieval date or feed timestamp.
- License, terms, or usage constraint when known.
- Transformation steps from source geometry or tabular data into VeloRail data structures.
- Confidence level when data is planned, inferred, manually digitized, or simulated.

Existing examples include LA Metro and Metrolink GTFS feeds, Swiftly and Metrolink GTFS-RT feeds, local `TRANSIT_LINES` data, and future project entries such as Sepulveda Transit Corridor and East San Fernando Valley.

## Review Checklist

Before merging map, transit, route, or scenario work:

- Confirm Google Maps remains the base rendering surface.
- Confirm Google Directions, Places, Geocoding, Transit Layer, Bicycling Layer, or Google overlays were used where feasible.
- Confirm any non-Google provider is a documented fallback or feature-gap exception.
- Confirm custom transit overlays include source and provenance metadata.
- Confirm GTFS, freight, and simulation logic is labeled separately from Google first-party routing or map data.
- Run the repo quality gate and document any failure.
