# VR-304 Route Results Panel

VR-304 refines the existing route results panel without changing routing logic.

## Layout

The panel now separates route search states from route options:

- loading state while route comparisons are running
- error state when the routing store exposes an error
- empty state before any route is calculated
- option list plus selected route details once routes exist

Route option cards show the route label, duration, route type, mode sequence, distance, transfer count, and bike safety score when available. Future routes keep a Future Route Preview badge and opening estimate.

## Segment Details

Selected route details summarize total distance, transfers, bike safety, future availability, live vehicle status, and each leg. Leg rows use stable mode icons, origin/destination names, distance, duration, line chips, stop counts, wait-time badges, delay badges, headsigns, and bike safety badges when that data exists.

The implementation only reads fields already present on `Route` and `RouteLeg`; unavailable cost or score fields are not invented.

## Data Assumptions

- `Route.totalDistance` is displayed as kilometers because existing route services store distance in kilometers.
- Transfer count uses transit leg count unless a leg is explicitly marked as a transfer.
- Bike safety averages available bike-leg safety scores.
- Realtime labels only display when route legs already carry wait, departure, delay, or tracking fields.

## Verification Targets

Browser coverage should verify that route search still produces visible feedback/results and that the route panel states remain readable at common desktop widths. Mobile and broader accessibility refinements are intentionally left to VR-306 and VR-307.
