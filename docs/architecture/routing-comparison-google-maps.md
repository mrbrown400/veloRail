# Routing Comparison Versus Google Maps

VR-504 adds a comparison service for evaluating VeloRail routes against a bounded Google Maps baseline. It is an analysis workflow, not a replacement for the existing route UI.

## Service Boundary

`src/services/routingComparison.ts` exposes two entry points:

- `compareVeloRailToGoogleMaps(request)`: builds VeloRail routes and Google baseline routes through injectable providers, then returns a comparison report.
- `buildRoutingComparisonReport({ query, velorailRoutes, googleBaselineRoutes })`: derives a report from already-computed route fixtures or cached results.

The default VeloRail provider calls the existing `compareRoutes(...)` workflow. The default Google baseline provider calls the existing Google Routes wrapper through `getFullTransitRoute`, `getDrivingRoute`, and `getBikeRoute`.

## Metrics

Each compared route reports:

- Total travel time in seconds and the existing formatted duration string.
- Total distance in kilometers.
- Mode split by leg mode, including distance, duration, leg count, distance share, and duration share.
- Transit transfer count, using explicit `isTransfer` flags when present and otherwise the number of transit legs after the first.
- Transit leg count.
- Scenario availability status and caveats.

When both sides have at least one route, the report compares the fastest VeloRail route with the fastest Google baseline route and returns deltas for time, distance, transfers, and per-mode split. Negative time or distance deltas mean the selected VeloRail route is lower than the selected Google baseline.

## Google API Usage

The default Google baseline is intentionally bounded to the requested `googleModes` list. The default mode list is transit, driving, and bike, which maps to at most three Google Routes calls for one origin and destination pair.

Bulk studies should inject cached or pre-approved Google baseline routes through `googleBaselineRoutes` or `googleBaselineProvider`. Tests use injected fixtures and do not require network access, browser globals, a live API key, or live Google quota.

## Scenario Caveats

Google Maps is treated as the current-service baseline. Future and hypothetical VeloRail routes are not reported as if Google independently supports those scenario assumptions.

The comparison report marks these gaps explicitly:

- A VeloRail future route gets `scenario` availability.
- A Google route in a future or hypothetical comparison gets `unsupported_by_google` availability.
- If no Google baseline can be produced, the report records a Google `unavailable` gap rather than inventing a result.

This keeps VeloRail planning assumptions visible while still allowing time, distance, mode split, and transfer metrics to be compared against current Google Routes output where API access and product terms allow.
