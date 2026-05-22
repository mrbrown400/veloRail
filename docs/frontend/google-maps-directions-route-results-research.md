# Google Maps Directions And Route Results Research

Reviewed: 2026-05-22
Issue: MBR-72
Scope: research only. No routing logic, API key, billing, or environment config changed.

## Sources Reviewed

- [Maps JavaScript Routes overview](https://developers.google.com/maps/documentation/javascript/routes/overview)
- [Maps JavaScript Route reference](https://developers.google.com/maps/documentation/javascript/reference/route)
- [Routes alternative routes](https://developers.google.com/maps/documentation/routes/alternative-routes)
- [Routes transit routes](https://developers.google.com/maps/documentation/routes/transit-route)
- [Route response guide](https://developers.google.com/maps/documentation/routes/understand-route-response)
- [Route travel modes](https://developers.google.com/maps/documentation/routes/reference/rest/v2/RouteTravelMode)
- [Maps JavaScript Directions reference](https://developers.google.com/maps/documentation/javascript/reference/directions)
- Direct Google Maps web directions observation for public Los Angeles locations on 2026-05-22.
- Local files: `src/services/routing.ts`, `src/services/googleRoutesService.ts`, `src/services/multimodalRouter.ts`, `src/hooks/useRouting.ts`, `src/components/Results/ResultsSidebar.tsx`, `src/components/Results/RouteOption.tsx`, `src/components/Results/RouteDetails.tsx`, `src/components/Map/RouteOverlay.tsx`, `src/types/index.ts`.

## Directions And Route-Result UX Patterns

Google Maps directions patterns that matter for VeloRail:

- Travel modes are presented as compact top choices with ETA context.
- Origin and destination remain editable after results load.
- Route cards put duration first, then distance, route summary, mode sequence, and detail entry.
- Selected route detail expands into a chronological itinerary.
- Transit itineraries show walking and transit legs in order, with station names, line names, headsign/direction, and timing when available.
- Route alternatives remain visible enough that users can compare without restarting search.
- Map overlays, route cards, and itinerary selection stay synchronized.

VeloRail should borrow hierarchy and synchronization, not the car-first priority order. Bike + Rail and Walk + Rail should remain first-class route families.

## Route Alternatives Behavior

| Area | Google behavior | VeloRail current state | Recommendation |
| --- | --- | --- | --- |
| Cross-mode alternatives | Mode choices expose different travel modes with ETA context. | `compareRoutes` returns Bike + Rail, Driving, and Walk + Rail for `all`. | Keep one card per VeloRail route family for now. |
| Same-mode alternatives | Routes can return a default plus alternatives where supported. | `googleRoutesService.ts` sets `computeAlternativeRoutes: false`. | Treat as future API and data-contract work. |
| Stable selection | Google route alternatives have route metadata and indexes. | `ResultsSidebar` compares selected state by route label. | Add stable route IDs before adding same-mode alternatives. |
| Transit options | Google can show multiple transit patterns and departure windows. | VeloRail usually returns one walk+rail and one bike+rail family route. | Do not imply a frequency list until the service contract supports it. |
| Waypoints | Google directions supports extra destinations in some flows; transit has API constraints. | VeloRail has no multi-stop route contract. | Keep multi-stop out of this milestone. |

## Route Card Requirements

Safe fields already available or derivable:

- Route label and route type.
- Duration and distance.
- Mode icons and leg sequence.
- Summary text.
- Transfer count from transit legs.
- Bike safety score and notes when present.
- Future badge, opening year, and time savings only when future routing is enabled and populated.

Do not show yet without contract expansion:

- Fare.
- Platform or track.
- Service alerts.
- Accessibility status.
- Crowding.
- Exact arrival time.
- Full stop count for Google-derived transit legs.
- Turn-by-turn maneuvers.
- Emissions or calories.
- Google route labels or route tokens.

Current fragility: `ResultsSidebar` uses `selectedRoute?.label === route.label`. Same-mode alternatives can share labels, so route IDs should be added before enabling alternatives.

## Itinerary Requirements

Safe leg-level fields now:

- Mode.
- From and to labels.
- Distance and duration.
- Transit line, color, and headsign.
- Departure, wait, and delay chips only when present.
- Station count only when `leg.stations` exists.
- Bike safety only when a bike leg has safety data.

Fields that need preservation before display:

- Arrival time from Google transit steps.
- Stop count from Google transit steps.
- Vehicle type for bus, subway, rail, light rail, and related icon treatment.
- Route source or fallback source for degraded route messaging.
- Google warnings and advisories where required.
- Fare only if requested, modeled, and nullable.

The recommended near-term itinerary target is leg-level clarity. Turn-by-turn navigation should stay out of scope until a separate issue defines route-step contracts and display requirements.

## Polyline And Marker Styling Expectations

Google Maps provides route paths, viewport data, map primitives, and route helper methods. VeloRail already renders route overlays with Google Maps polylines and markers:

- `RouteOverlay` draws route segments with mode-specific styling.
- Transit line color is used when available.
- Walk and bus segments use dashed styling.
- Bike segments are high-visibility green.
- Start/end markers are custom symbols.
- Station markers render only when `leg.stations` exists.
- `MapContainer` fits the selected route with panel-aware padding.

Recommendation:

- Keep custom `RouteOverlay` as the primary renderer. It is needed for VeloRail route families, bike safety, future segments, and scenario identity.
- Do not switch wholesale to `DirectionsRenderer`, because it would reduce control over VeloRail-specific semantics and should be checked against current Google deprecation and routing guidance before any future use.
- Evaluate `Route.createPolylines()` only as an optional helper or reference for Google-derived routes after visual and contract tests prove it preserves needed segment information.
- Add warning/advisory display before exposing Google walking, bicycling, or other mode caveats in the UI.

## Google Routes And Directions Feasibility

High-confidence current fit:

- VeloRail already imports the Maps JavaScript Routes library and calls `google.maps.routes.Route.computeRoutes`.
- Current request fields support basic route cards: path, distance, duration, and legs.
- Google transit route extraction can see useful details before conversion, including line, color, headsign, departure and arrival stops, times, stop count, and vehicle type.

Needs explicit model and service work:

- Stable route IDs.
- `computeAlternativeRoutes` support and tests.
- Additional field masks for route labels, localized values, warnings, viewport, travel advisories, route tokens, and step-level detail if needed.
- Preservation of `arrivalTime`, `numStops`, and `vehicleType` into `RouteLeg`.
- Nullable source/fallback metadata for Google, OSRM, static station, future, and scenario-derived route pieces.
- Copyright or attribution handling if Google route data is manually displayed in a way that triggers display requirements.

Known API constraints:

- Transit routing is schedule-bound and not a future-transit data source.
- Transit routing has constraints around intermediate waypoints.
- Walking and bicycling modes may require visible user warnings depending on API response and Google guidance.
- Routing preferences should not be applied indiscriminately across bike, walk, and transit modes.

## Current VeloRail Data Contract Constraints

| Gap | Current blocker | Implementation implication |
| --- | --- | --- |
| Google-like transit arrival rows | `RouteLeg` does not preserve arrival time. | Add `arrivalTime` before displaying arrival rows. |
| Google transit stop counts | `TransitLegInfo.numStops` is not preserved into rendered legs. | Preserve it or do not show stop count. |
| Vehicle-specific icons | `vehicleType` is extracted then dropped. | Preserve for accurate bus, subway, rail, and light-rail icons. |
| Fare display | Fare is not requested or modeled. | Keep fare absent until a nullable fare contract exists. |
| Route warnings | Warnings/advisories are not requested or modeled. | Add before showing Google mode caveats. |
| Same-mode alternatives | No stable route IDs and alternatives disabled. | Requires service, store, selection, and browser test updates. |
| Live transit tracking | Store exists, but Google-derived legs lack `tripId`, `routeId`, and stop sequence. | Do not imply live tracking for Google-derived legs. |
| Future route cards | Future route fields exist, but `useRouting` passes `includeFuture=false`. | Keep future route cards dormant until route search enables them. |
| Turn-by-turn detail | No route-step display contract. | Keep details leg-level for now. |

## Testability Notes

Recommended implementation tests:

- Unit test that alternatives remain disabled until a future issue opts in.
- Unit test route conversion for arrival time, stop count, vehicle type, warnings, and fare absence.
- Store test for stable route IDs before enabling duplicate-label alternatives.
- Browser fixture test for route card selection and selected overlay synchronization.
- Browser fixture test for route details timeline rows with known leg data.
- Browser test that unsupported fields are absent when data is missing.
- Strict live Google smoke only for request-shape and map-render checks when `VITE_GOOGLE_MAPS_API_KEY` is configured.

Do not rely on live Google route responses for deterministic route-result UI assertions.
