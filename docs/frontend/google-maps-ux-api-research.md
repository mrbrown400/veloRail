# Google Maps UX/API Research

Reviewed: 2026-05-22
Issues: MBR-58, MBR-71, MBR-72, MBR-73
Scope: research only. No API keys, billing settings, environment config, routing code, or map providers changed.

## Executive Recommendation

VeloRail should target Google Maps parity at the interaction and API boundary level, not as visual copying. The app should reuse Google Maps Platform capabilities where they fit the existing React, Vite, Zustand, and Google Maps JavaScript architecture, while keeping VeloRail's car-free routing, future-transit overlays, and scenario-planning identity explicit.

The highest-value follow-up work is:

1. Migrate search internals from legacy Places autocomplete services to the newer Place Autocomplete Data API while preserving VeloRail's custom `PlaceAutocomplete` UI.
2. Keep custom route result cards and `RouteOverlay` rendering, but expand the route data contract before adding Google-like same-mode route alternatives, warnings, fares, or richer transit itinerary fields.
3. Convert mobile route results, layers, and metadata into coordinated bottom-sheet states so the map remains usable and VeloRail overlays stay discoverable.
4. Adopt Map ID and Advanced Markers now as explicit follow-up setup and accessibility work because they touch map setup, styling, testing, and API configuration.

Direct Google Maps web observations were made on public Los Angeles locations on 2026-05-22 for interaction-pattern research only. They were not used as source data.

## Sources Reviewed

- [Place Autocomplete Data API](https://developers.google.com/maps/documentation/javascript/place-autocomplete-data)
- [Migrate to new Place Autocomplete](https://developers.google.com/maps/documentation/javascript/legacy/places-migration-autocomplete)
- [Places AutocompleteService reference](https://developers.google.com/maps/documentation/javascript/reference/places-autocomplete-service)
- [Place Autocomplete Data API session tokens](https://developers.google.com/maps/documentation/javascript/place-autocomplete-data)
- [Geocoding service](https://developers.google.com/maps/documentation/javascript/geocoding)
- [Maps JavaScript Routes overview](https://developers.google.com/maps/documentation/javascript/routes/overview)
- [Maps JavaScript Route reference](https://developers.google.com/maps/documentation/javascript/reference/route)
- [Routes alternative routes](https://developers.google.com/maps/documentation/routes/alternative-routes)
- [Routes transit routes](https://developers.google.com/maps/documentation/routes/transit-route)
- [Route response guide](https://developers.google.com/maps/documentation/routes/understand-route-response)
- [Maps JavaScript controls](https://developers.google.com/maps/documentation/javascript/controls)
- [Maps JavaScript interaction and gesture handling](https://developers.google.com/maps/documentation/javascript/interaction)
- [Maps JavaScript layers](https://developers.google.com/maps/documentation/javascript/layers)
- [Maps JavaScript Data layer](https://developers.google.com/maps/documentation/javascript/datalayer)
- [Advanced Markers migration](https://developers.google.com/maps/documentation/javascript/advanced-markers/migration)
- [Accessible Advanced Markers](https://developers.google.com/maps/documentation/javascript/advanced-markers/accessible-markers)
- [Map IDs overview](https://developers.google.com/maps/documentation/javascript/map-ids/mapid-over)
- [Cloud-based map styling](https://developers.google.com/maps/documentation/javascript/cloud-customization)
- [Maps JavaScript usage and billing](https://developers.google.com/maps/documentation/javascript/usage-and-billing)
- [Routes usage and billing](https://developers.google.com/maps/documentation/routes/usage-and-billing)
- [Places usage and billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)
- [API security best practices](https://developers.google.com/maps/api-security-best-practices)
- [Material bottom sheets](https://m1.material.io/components/bottom-sheets.html)
- Direct Google Maps web observation for search, directions, mode selectors, route cards, layers, and mobile route sheets.

## Parity Target Table

| Surface | Google Maps pattern | VeloRail target | Parity type | Current owner files |
| --- | --- | --- | --- | --- |
| Search entry | Stable search field with typed predictions, current-location affordance, and visible empty/error states. | Preserve custom search card but add clear, unresolved input, field error, and no-result states. | Interaction and API | `src/components/Search/SearchCard.tsx`, `src/components/Search/PlaceAutocomplete.tsx`, `src/services/geocoding.ts` |
| Directions transition | Origin/destination fields, swap direction, mode context, and explicit route action. | Make expanded route entry feel like directions mode, not just two autocomplete fields. | Interaction | `SearchCard.tsx`, `src/stores/uiStore.ts` |
| Place prediction details | Primary place text, secondary context, location bias, optional distance from origin. | Use Places New predictions and minimal place details while retaining LA service-area validation. | API and interaction | `PlaceAutocomplete.tsx`, `geocoding.ts` |
| Route cards | Duration first, mode sequence, distance/time summary, selected route state, and details affordance. | Keep VeloRail route-family cards; add only fields that exist in `Route`. | Interaction | `src/components/Results/RouteOption.tsx`, `src/types/index.ts` |
| Route itinerary | Chronological legs, walking/transit segments, line/headsign, transfer context, warnings when relevant. | Keep leg-level itinerary until model preserves arrivals, vehicle type, stop counts, warnings, and fares. | Interaction and contract | `src/components/Results/RouteDetails.tsx`, `src/services/googleRoutesService.ts`, `src/services/multimodalRouter.ts` |
| Same-mode alternatives | Google can return default plus alternatives for supported modes. | Treat as future routing-contract work; do not fake alternatives from labels alone. | API and data | `googleRoutesService.ts`, `src/stores/routeStore.ts`, `ResultsSidebar.tsx` |
| Route overlay | Selected route polyline, endpoints, segment styling, viewport fit. | Keep custom `RouteOverlay` so future and multimodal identity remain clear. | Interaction | `src/components/Map/RouteOverlay.tsx`, `src/components/Map/MapContainer.tsx` |
| Layers | Compact layers control with native transit/bicycling map details. | Collapse mobile layers behind a compact entry; keep VeloRail future/vision/passenger-conversion overlays grouped. | Interaction | `src/components/Map/MapContainer.tsx`, `src/components/Map/MapOverlayRenderer.tsx`, `src/data/mapOverlayRegistry.ts` |
| Mobile panels | Persistent bottom route sheet with collapsed, half, and full states. | Replace open/closed mobile results behavior with coordinated sheet states. | Interaction and accessibility | `ResultsSidebar.tsx`, `src/styles/google-maps-theme.css` |
| Metadata | Map selection opens contextual details without hiding core controls. | Maintain provenance, uncertainty, source links, and non-map keyboard fallback. | Interaction and content | `MapContainer.tsx`, `mapOverlayRegistry.ts` |

## API Capability Table

| Capability | Google Maps Platform support | VeloRail fit | Implementation note |
| --- | --- | --- | --- |
| Place Autocomplete Data API | Custom predictions, location bias/restriction, origin, primary types, session tokens, and `Place.fetchFields()`. | Strong fit for custom autocomplete UI. | Replace legacy `AutocompleteService` wrapper without adopting a full Google widget. |
| Places session tokens | Groups autocomplete and place details requests into a user session. | Strong fit. | Token lifecycle should start on typing and end on selection or abandonment. |
| Geocoding service | Free-text geocoding with bounds, component restrictions, place IDs, and result geometry. | Strong fit for submit-time typed endpoint resolution. | Bounds are bias, not a hard service-area guarantee. |
| Maps JavaScript Routes Library | `Route.computeRoutes`, field masks, travel modes, path, legs, and helper route objects. | Already in use. | Expand fields only when UI and billing owners accept the new surface. |
| Routes transit options | Transit modes and preferences, departure/arrival time, route alternatives where supported. | Useful for current transit, not future service. | Do not use as source of future-transit facts. |
| Native layers | `TransitLayer` and `BicyclingLayer` can be attached or detached from the map. | Already matches VeloRail's native layer model. | Layers are not queryable feature datasets. |
| Polylines, markers, InfoWindows | Base primitives for route and overlay rendering. | Already in use. | Keep custom styling for VeloRail-owned overlays. |
| Advanced Markers | Recommended marker path with richer HTML/CSS and accessibility support. | Owner decision: adopt now. | Track as setup and accessibility work with marker library and map ID changes. |
| Data layer and GeoJSON | Loads and styles GeoJSON-like feature data on the map. | Candidate for larger future or scenario datasets. | Not required for current docs milestone. |
| Map IDs and cloud styling | Enables cloud styling and some advanced marker features. | Owner decision: adopt now. | Touches Google Cloud configuration and testing, so keep it separate from route UX work. |

## API Limitation And Risk Table

| Risk | Current evidence | Why it matters | Mitigation |
| --- | --- | --- | --- |
| Legacy Places usage | `geocoding.ts` uses `AutocompleteService` and `PlacesService.getDetails`. | Google docs direct new customers toward newer Places APIs, and billing/session behavior is easier to control with the new flow. | Plan a Places New migration behind the existing service wrapper. |
| Session billing ambiguity | Current autocomplete has no session token. | Prediction and detail requests can be harder to reason about and test. | Add token lifecycle tests and minimal field masks. |
| Bounds are not service area | Geocoder bounds bias the result but do not reject out-of-area matches. | VeloRail route calculation should not silently accept unrelated locations. | Add post-geocode LA service-area validation. |
| Route alternatives are contract work | `computeAlternativeRoutes` is false and `Route` has no stable alternative ID. | UI-only alternatives would break selection and misrepresent Google capability. | Add stable IDs, source metadata, and fixture tests before enabling. |
| Transit route horizon | Google transit route availability is schedule-bound. | Future transit overlays cannot rely on live transit routing as truth. | Keep future/vision/freight scenario data VeloRail-owned with provenance. |
| Walking and biking warnings | Google routing docs require warnings for some non-driving modes. | VeloRail is car-free and will lean on these modes. | Model and display warnings before exposing richer Google route details. |
| Native layers are not data APIs | `TransitLayer` and `BicyclingLayer` render map details but do not expose route geometry. | They cannot replace VeloRail overlay data or metadata. | Keep native layers as context only. |
| Marker migration touches setup | Advanced Markers require marker library and Map ID setup. | It is not a drop-in visual-only change. | Adopt now, but track as a separate setup and accessibility issue. |
| Billing and quota drift | Places, Routes, and Maps JS bill differently and change over time. | Live tests and hidden requests can become expensive or flaky. | Use mocks for deterministic tests and strict browser smoke only when keys are configured. |
| Product observations are not source data | Google Maps web UI can change without notice. | Docs should not hard-code scraped details. | Use product observation only for interaction patterns. |

## VeloRail-Specific Divergences

- VeloRail should not optimize for car-first parity. Owner decision: Driving should be comparison-only, not a peer route result. Bike + Rail and Walk + Rail should remain first-class.
- Future transit, visionary concepts, passenger-conversion corridors, freight suitability, GTFS ingestion, and scenario generation remain VeloRail-owned data and logic. Google Maps APIs can render and contextualize them but should not be treated as their source of truth.
- VeloRail route cards should include planning provenance and uncertainty when future or scenario routes are shown. Google Maps route cards do not cover that product need.
- Photon, Nominatim, OSRM, and static station fallbacks should remain fallback-only under the Google Maps-first policy, with degraded-provider feedback where user-facing.
- Custom `RouteOverlay` rendering is valuable because route families and future overlays need visual language beyond Google default route rendering.

## Implementation Implications

- Search work should be framed as a service-wrapper migration plus UI state cleanup: session tokens, visible empty/error states, per-field validation, clear controls, origin/destination swap, and service-area validation.
- Directions work should first stabilize the route data contract: stable IDs, optional source/fallback metadata, warnings, arrival time, stop count, vehicle type, and nullable fields for fare/platform only if requested. Driving should be presented as a comparison benchmark rather than a peer route family.
- Route alternatives should not be enabled until store selection stops relying on duplicate-prone labels and tests cover same-mode alternatives.
- Mobile work should coordinate bottom surfaces rather than stacking panels. Route results, metadata, and layers currently compete for the same screen area.
- Overlay work should keep native Google layers for context and VeloRail overlays for planning data. Larger scenario datasets may justify Data layer or GeoJSON, but that is not required for this milestone.
- Map setup work should adopt Map ID and Advanced Markers now, with separate verification for marker accessibility, marker library loading, and Google Cloud configuration.
- Browser tests should use fixtures for deterministic UX and strict Google Maps smoke checks only when `VITE_GOOGLE_MAPS_API_KEY` is available.

## Owner Decisions Captured

1. Driving should be comparison-only, not a peer route result.
2. Map ID and Advanced Markers should be adopted now as a separate setup and accessibility follow-up.
3. Search validation should allow endpoints as far west as Oxnard, east as San Bernardino, north as San Fernando, and south as San Clemente. Implementation should convert those anchors into an explicit validation boundary instead of relying only on a loose rectangular bias.

## Remaining Owner Questions

1. Alternatives terminology needs a product decision:
   - VeloRail route-family alternatives are product-level route strategies such as Bike + Rail, Walk + Rail, future transit, passenger-conversion scenarios, and Driving as a comparison benchmark.
   - Google same-mode alternatives are multiple paths within one Google routing mode for the same origin and destination, such as several transit itineraries or alternate bike routes returned by `computeAlternativeRoutes`.
   - Prioritizing route-family alternatives keeps the UI focused on VeloRail's identity and is closest to the current architecture.
   - Prioritizing Google same-mode alternatives makes the app feel more like Google Maps, but requires stable route IDs, expanded route fields, and more card/detail selection complexity.
   - Supporting both is likely the long-term best UX, but it should be sequenced as route-family clarity first, then same-mode alternatives after the route contract is ready.
2. Should CI ever run live Google Maps smoke tests, or should live-key browser checks stay local/manual?
3. How should degraded providers be named in user-facing states without overexposing implementation details?
