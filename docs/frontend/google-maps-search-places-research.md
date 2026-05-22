# Google Maps Search, Places, And Geocoding Research

Reviewed: 2026-05-22
Issue: MBR-71
Scope: research only. No search code, API keys, billing settings, or environment config changed.

## Sources Reviewed

- [Place Autocomplete Data API](https://developers.google.com/maps/documentation/javascript/place-autocomplete-data)
- [Migrate to new Place Autocomplete](https://developers.google.com/maps/documentation/javascript/legacy/places-migration-autocomplete)
- [Places Autocomplete Web Service](https://developers.google.com/maps/documentation/places/web-service/place-autocomplete)
- [Places AutocompleteService reference](https://developers.google.com/maps/documentation/javascript/reference/places-autocomplete-service)
- [Place Autocomplete Data API session tokens](https://developers.google.com/maps/documentation/javascript/place-autocomplete-data)
- [Geocoding service](https://developers.google.com/maps/documentation/javascript/geocoding)
- [Map geolocation sample](https://developers.google.com/maps/documentation/javascript/examples/map-geolocation)
- Direct Google Maps web observation for public Los Angeles search queries on 2026-05-22.
- Local files: `src/components/Search/SearchCard.tsx`, `src/components/Search/PlaceAutocomplete.tsx`, `src/services/geocoding.ts`, `src/stores/routeStore.ts`, `src/stores/uiStore.ts`.

## Search And Autocomplete UX Patterns

Google Maps search patterns that matter for VeloRail:

- A stable search input remains visible during map exploration.
- Typed predictions show a primary name and secondary geographic context.
- The user can clear the current query without manually selecting all text.
- Search and directions are related but distinct states: search locates a place, directions ask for origin and destination.
- Directions mode has origin and destination fields, current-location affordance, travel-mode context, and a reverse-direction action.
- Empty, unresolved, and permission-denied states are visible near the field that caused them.
- Current location is user-initiated and paired with clear permission/error feedback.
- Query biasing should make likely LA results easier to choose without hiding the possibility that the typed text is invalid for VeloRail.

VeloRail should copy the state clarity and prediction hierarchy, not the full Google search shell. The search card still needs to foreground car-free route planning and future-transit context.

## Places And Geocoding API Capabilities

| Capability | Google support | VeloRail use |
| --- | --- | --- |
| Custom autocomplete UI | Place Autocomplete Data API can return suggestions for custom-rendered controls. | Preserve `PlaceAutocomplete` and route-search styling. |
| Location bias | Autocomplete and geocoding can bias results toward an area. | Keep LA-centered suggestions and geocoding. |
| Location restriction | Autocomplete Data API can restrict prediction geography in some request shapes. | Consider for route endpoints after owner defines service boundary. |
| Origin context | Autocomplete can take an origin for distance-aware prediction context. | Useful after start location is known. |
| Primary type filtering | Places requests can narrow prediction categories. | Use cautiously; VeloRail needs stations, landmarks, and addresses. |
| Session tokens | Autocomplete sessions can group predictions and place-detail selection. | Needed for billing clarity and lifecycle tests. |
| Minimal place fields | `Place.fetchFields()` can request only needed fields. | Request display name, formatted address, location, viewport, and place ID unless more is justified. |
| Submit-time geocoding | Geocoder resolves free text into coordinates with geometry and metadata. | Keep current typed endpoint resolution, but add service-area validation. |
| Component restrictions | Geocoder can narrow by country and related constraints. | Use for US/California bias, not as the only LA validation. |

## Current VeloRail Gap Table

| Area | Current state | Gap or risk | Recommended direction |
| --- | --- | --- | --- |
| Places implementation | `geocoding.ts` uses legacy `AutocompleteService` and `PlacesService.getDetails`. | Legacy path is not the best long-term Google Maps-first surface. | Wrap Places New Autocomplete Data API behind the current service boundary. |
| Session lifecycle | No autocomplete session token is created or completed. | Billing and request grouping are opaque. | Add token lifecycle to prediction and selection flow. |
| No-result state | `PlaceAutocomplete` has a no-results element, but the dropdown closes when `searchResults.length` is zero. | Users do not see the empty state. | Keep the dropdown open for active queries with zero results. |
| Field errors | `SearchCard` has one shared `searchMessage`. | Origin and destination failures are not localized. | Add field-level unresolved/error/loading states. |
| Clear control | Users must manually edit text. | Less efficient than Google-style search clearing. | Add per-field clear affordances. |
| Swap direction | Expanded start/end fields have no reverse action. | Directions parity gap. | Add origin/destination swap once state semantics are explicit. |
| Current location | `useGeolocation` may request on mount and can refresh through the button. | Permission timing may feel more aggressive than Google Maps. | Make location use clearly user-initiated and explain denied/unavailable states. |
| Query bias | Search uses LA center/radius and geocoder bounds. | Bounds bias does not guarantee in-area results. | Validate final coordinates against the accepted VeloRail service area. |
| Fallback providers | Photon/Nominatim fallback silently. | Useful resilience, but can blur Google Maps-first behavior. | Keep fallback-only, with degraded feedback when routing quality changes. |
| Selection state | Typed text and selected `Location` can diverge. | Submit-time geocoding helps, but unresolved input is not explicit. | Track selected place versus raw input per field. |

## Recommended Changes To `SearchCard`

- Add per-field clear controls for start and destination.
- Add origin/destination swap in expanded directions mode.
- Keep submit-time geocoding for typed text, but show lookup state per field.
- Distinguish selected place, typed unresolved text, and resolved geocode fallback.
- Keep `Use my location` as an explicit action and surface permission-denied or unavailable state next to the origin field.
- Preserve VeloRail mode choices and car-free framing. Do not let a Google-like search shell make Driving feel like the primary product mode.

## Recommended Changes To `PlaceAutocomplete`

- Keep the custom React component so VeloRail can own mode, safety, future-transit, and route-entry context.
- Migrate the service layer to Places New Autocomplete Data API behind `searchPlaces`.
- Add session-token lifecycle across query, prediction, and selected place details.
- Keep the list open for active empty results and show a visible no-results row.
- Add explicit loading and service-error rows that are distinguishable from no results.
- Add listbox and option semantics, active descendant state, and keyboard coverage for Arrow, Enter, Escape, Tab, and blur.
- Consider secondary context rows with formatted address or area. Add distance/context only when origin is available and the data is reliable.

## Recommended Changes To `geocoding.ts`

- Replace legacy autocomplete internals with a wrapper that can call `AutocompleteSuggestion.fetchAutocompleteSuggestions`.
- Fetch details through `suggestion.placePrediction.toPlace().fetchFields()` with minimal fields.
- Preserve `placeId`, provider, confidence/source metadata, display label, and coordinates.
- Keep Google Geocoder first for free-text submit resolution.
- Add post-resolution service-area validation because bounds and biasing do not reject every out-of-area match.
- Keep Photon and Nominatim as fallback-only resilience. If fallback results are used, expose that as degraded confidence for route planning.
- Add cache keys that distinguish provider, query, and bias/restriction context so future boundary changes do not reuse stale assumptions.

## Testability Notes

Recommended unit coverage:

- Places New prediction normalization.
- Session-token lifecycle: start on query, reuse through selection, reset on clear/abandonment.
- Zero results remain visible.
- Service error differs from zero results.
- Google geocoder success, no result, and fallback result.
- Service-area validation accepts and rejects known fixture coordinates.
- Raw typed input versus selected `Location` state.

Recommended browser coverage:

- Destination-only collapsed search can resolve typed unselected text.
- Expanded origin/destination fields show per-field loading and errors.
- Clear controls reset text and selected location.
- Swap exchanges start and destination values.
- Geolocation denied/unavailable is visible and does not block manual entry.
- No-results state is visible in the dropdown.
- Provider-degraded feedback appears when fallback fixtures are injected.

Strict live Google Maps tests should remain small and conditional on `VITE_GOOGLE_MAPS_API_KEY`. Deterministic search behavior should use mocked Google, Photon, and Nominatim boundaries.
