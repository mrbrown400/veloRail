# VR-303 Layer Panel

## Scope

VR-303 replaces the flat map-layer chip row with a compact panel inside the existing Google Maps surface. It keeps the overlay registry and `mapOverlayStore` as the only layer visibility contract.

## Control Hierarchy

- Current: native Google Transit plus native Google Bicycling context.
- Future: official planned, funded, and under-construction transit projects.
- Visionary: unofficial concept overlays.
- Nationalized: freight and passenger-conversion corridors.

Each group reports its active count and each layer button uses `aria-pressed` plus a visible active rail and state dot. Scenario overlays remain default off unless their registry entry changes.

## Legend

The panel includes a collapsed legend affordance. Legend rows are derived from the current registry, native Google layer labels, and proposal `style.legendLabel`, color, and pattern metadata so the UI follows the checked-in data instead of a separate hard-coded legend.

## Verification Targets

- Browser coverage: `@VR-303` in `tests/browser/route-search.spec.ts`.
- Registry coverage: group ordering and legend metadata in `tests/mapOverlayRegistry.test.js`.
- Required gates: `npm run quality`, `npm run test:browser`, and `npm run task:gate -- VR-303 --explain`.
