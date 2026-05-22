# Current Route Results And Itinerary Contracts

Issues: MBR-57, MBR-69  
Verified: 2026-05-22 on `feature/velorail-frontend-redesign-google-maps-parity`

## Scope

This document inventories the route result and itinerary data that exists today. The redesign may improve presentation, but it must not invent route data that the current contracts and services do not provide.

## Route Data Available

The primary UI contract is `Route` in `src/types/index.ts`.

Available `Route` fields:

- `type`: display-oriented route type such as `Bike + Metro`, `Walk + Metro`, or `Driving`.
- `label`: route list label such as `Bike + Rail`, `Walk + Rail`, or `Driving`.
- `start`: resolved origin `Location`.
- `end`: resolved destination `Location`.
- `legs`: ordered `RouteLeg[]`.
- `totalDistance`: kilometers.
- `totalDuration`: seconds.
- `formattedDuration`: display string.
- `summary`: human-readable summary.
- `isFuture`: optional scenario flag.
- `expectedOpening`: optional future availability text.
- `timeSavings`: optional future-route time savings in minutes.

No current `Route` field exists for:

- fare or cost.
- alerts.
- route popularity.
- crowding.
- accessibility.
- calories.
- emissions.
- elevation summary.
- route confidence.
- route source label.
- user preference rationale.
- Google alternative route identifier.

## RouteLeg Data Available

Available `RouteLeg` fields:

- `mode`: `bike`, `walk`, `transit`, `transit_bus`, or `driving`.
- `from`: `Location` or `Station`.
- `to`: `Location` or `Station`.
- `geometry`: GeoJSON-like `LineString` with `[lon, lat]` coordinates.
- `distance`: kilometers.
- `duration`: seconds.
- `safety`: optional bike safety object with `score` and optional details.
- `line`: optional transit line name or short name.
- `routeId`: optional GTFS/static route id.
- `color`: optional line color.
- `stations`: optional station sequence.
- `waitTime`: optional wait seconds.
- `departureTime`: optional `Date`.
- `headsign`: optional text.
- `isRealtimeSchedule`: optional schedule flag.
- `isRealtime`: optional realtime flag.
- `delayText`: optional display text.
- `delayStatus`: optional `ontime`, `late`, or `early`.
- `isTransfer`: optional transfer flag.
- `tripId`: optional trip id.
- `boardingStopSequence`: optional stop sequence.

No current `RouteLeg` field exists for:

- arrival time in the UI contract.
- platform or track.
- exact stop count for Google transit legs after conversion.
- step maneuvers or turn-by-turn instructions.
- agency alerts.
- fare.
- occupancy or crowding.
- wheelchair accessibility.
- vehicle type after `multimodalRouter` conversion.
- calories or elevation profile.

## What RouteOption Can Show Today

`src/components/Results/RouteOption.tsx` can show:

- route label.
- route type.
- formatted duration.
- ordered mode sequence as icons.
- summary.
- total distance.
- transfer count derived from transit legs.
- average bike safety score when bike legs include `safety`.
- future badge when `route.isFuture` is true.
- expected opening when present.
- time savings when present.
- selected state through `aria-pressed`.

`RouteOption` should not show today:

- fare.
- arrival time.
- live vehicle status.
- delay status.
- stop count.
- headsign.
- platform.
- detailed itinerary steps.
- Google alternative-route metadata.

Current risk:

- `ResultsSidebar` marks an option selected by comparing `selectedRoute?.label === route.label`. Duplicate labels can make selection ambiguous if later routing returns multiple alternatives with the same label.

## What RouteDetails Can Show Today

`src/components/Results/RouteDetails.tsx` can show:

- selected route label.
- selected route summary.
- formatted duration.
- total distance.
- transfer count.
- bike safety score when present.
- future availability when present.
- vehicle tracking status when realtime store data is present.
- leg-by-leg list.

Leg rows can show:

- mode label and icon.
- locally derived instruction, such as `Bike to ...` or `Take A Line to ...`.
- from and to names.
- leg distance.
- leg duration.
- transit line chip.
- station count only when `leg.stations` exists.
- wait-time badge when `leg.waitTime` exists.
- live badge when wait info is backed by realtime flags.
- delay badge when `delayText` exists.
- headsign when present.
- bike safety badge when present.

`RouteDetails` should not show today:

- fare.
- platform.
- turn-by-turn directions.
- exact arrival time from Google transit legs.
- vehicle type for Google transit legs after conversion.
- Google stop count unless `leg.stations` exists.
- agency alerts.
- realtime vehicle ETA unless realtime store data is populated.

## Service Contract And Data Loss

`src/hooks/useRouting.ts` calls:

```text
compareRoutes(start, end, safety, mode, departureTime, false)
```

The final argument means future route calculation is off in the current search flow.

`src/services/routing.ts` returns up to three current route families when mode is `all`:

- Bike + Rail.
- Driving.
- Walk + Rail.

Google Routes-backed data:

- `src/services/googleRoutesService.ts` requests `path`, `distanceMeters`, `durationMillis`, and `legs`.
- `computeAlternativeRoutes` is false.
- `getFullTransitRoute` can extract Google walking and transit steps, including line name, line short name, color, vehicle type, departure/arrival stop, departure/arrival time, stop count, and headsign.

Data lost before UI:

- `src/services/multimodalRouter.ts` maps Google transit info into `RouteLeg`.
- It preserves line, color, headsign, departure time, distance, duration, geometry, and realtime-ish flags.
- It does not preserve Google arrival time, Google stop count, Google vehicle type, route id, trip id, boarding stop sequence, or station list for Google transit legs.

Fallback route data:

- `src/services/routing.ts` can populate `stations`, static `routeId`, wait time, line color, `isRealtimeSchedule`, and expected opening for future route paths.
- Its `getNextDeparture` is a simplified frequency estimate that currently returns `departureTime: null`, `headsign: null`, and `isEstimate: true`.

## Realtime And Vehicle Tracking Data

Current React realtime store:

- `trackedVehicle`: `tripId` and `routeId`.
- `vehiclePosition`: vehicle id, trip id, route id, lat/lon, bearing, label, current status, stop sequence, timestamp.
- `isTrackingActive`.
- `lastUpdate`.

Current UI:

- `VehicleTrackingStatus` renders only when the selected route has a transit leg, `trackedVehicle` exists, and `vehiclePosition` exists.
- `VehicleMarker` renders only when map state has `vehiclePosition` and `trackedVehicle`.

Current limitation:

- `useVehicleTracking.ts` is a placeholder and explicitly does not connect to GTFS-RT yet.
- `useRouting` starts tracking with `tripId || null` and `routeId || null`, but Google Routes-converted legs generally do not have `tripId`, `routeId`, or `boardingStopSequence`.

Do not present live tracking as a working current feature unless a later realtime integration issue populates the store.

## Future Route Fields

Future-route fields exist in the contract and UI:

- `route.isFuture`.
- `route.expectedOpening`.
- `route.timeSavings`.

Future route generation exists behind `includeFuture` in `compareRoutes`. The current `useRouting` path passes `includeFuture=false`, so future route options are not returned from normal search.

Boundaries:

- Future route UI is a dormant display path today.
- Future overlay visibility does not currently affect route calculation.
- Future route display should remain distinct from current Google Maps transit service.

## Unsupported Data That Should Not Be Shown

Do not show these unless a later issue expands the route model and tests it:

- Transit fares or route cost.
- Exact arrival times for current `RouteLeg` rows.
- Platform, track, entrance, or boarding door.
- Crowding, occupancy, or seat availability.
- Agency alerts or service disruptions.
- Accessibility facts.
- Detailed turn-by-turn maneuvers.
- Stop counts for Google legs after `multimodalRouter` conversion.
- Vehicle type for Google legs after conversion.
- Live vehicle ETA or stops away unless `vehiclePosition` and stop sequence data are present.
- Carbon, calories, or elevation summaries.
- Google route alternatives beyond the current one-route-per-mode contract.
- Future/visionary/nationalized route outputs as if Google Maps supports those scenarios.

## Test Coverage

Unit coverage:

- `tests/routing.test.js`: fallback bike and walk duration contracts.
- `tests/googleRoutesService.test.js`: Google Routes request and conversion behavior.
- `tests/routingComparison.test.js`: comparison metrics and scenario caveats.

Browser coverage:

- `tests/browser/route-search.spec.ts`: typed route search feedback.
- Google Routes request shape and route option labels.
- Bike/walk duration sanity.
- Results close and reopen behavior.

Coverage gaps:

- Route details timeline field rendering.
- Future route badge and future availability in results.
- Wait, departure, delay, and safety chip display.
- Vehicle tracking status.
- Duplicate-label selection risk.
- Tests that unsupported fields stay absent.
- Mobile itinerary interaction beyond panel bounds and reopen behavior.

## Implementation Risks

- A redesign that adds Google Maps-like affordances may exceed the current contract. Fares, maneuvers, platforms, alerts, and exact arrival times need data-model work first.
- Route option selection by label is fragile if later work adds alternatives with duplicate labels.
- Realtime UI exists but is not wired to a live data provider in the inspected React path.
- Driving is currently a peer option in `ModeSelect`; later product specs should decide whether it is comparison-only, de-emphasized, or removed from primary flow.
- Future route fields exist but are not active in current search. Do not design future route results as current behavior without changing `useRouting` and tests.
- Google Routes alternatives are not requested; do not design multiple Google alternatives per mode without changing service requests, UI identity, and tests.

## Safe Redesign Fields

Safe route option fields:

- Duration.
- Distance.
- Label.
- Type.
- Mode sequence.
- Transfer count.
- Summary.
- Bike safety score when present.
- Future opening/time savings when present.

Safe route detail fields:

- Leg mode.
- Leg endpoints.
- Leg distance and duration.
- Transit line/color/headsign when present.
- Wait/departure/delay when present.
- Station count only when `leg.stations` exists.
- Safety badge when present.
- Vehicle tracking only when realtime store has a vehicle position.
