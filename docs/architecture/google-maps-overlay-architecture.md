# Google Maps Overlay Architecture

VR-002 centralizes map overlay registration around Google Maps overlay objects. The base map remains `@react-google-maps/api` and every app-owned scenario layer renders with Google Maps `Polyline`, `Marker`, `InfoWindow`, or first-party map layers.

## Contract

Overlay definitions live in `src/components/Map/mapOverlayRegistry.ts`. Each definition declares:

- `id`: stable key for state and UI controls.
- `label` and `description`: control copy and accessible labels.
- `scenario`: current, future, visionary, nationalized, or context.
- `order`: deterministic registration and control ordering.
- `defaultVisible`: initial centralized visibility state.
- `create(map)`: Google Maps factory returning `setVisible` and `dispose` lifecycle hooks.

`MapOverlayRenderer` owns the lifecycle. It creates overlays after Google Maps loads, applies current visibility, updates visibility without recreating the map, and disposes Google Maps listeners and overlay references on unmount.

## Layer State

`src/stores/mapOverlayStore.ts` is the single visibility source for map overlays. The map control buttons read the registry order and toggle visibility by overlay id. This keeps current, future, visionary, nationalized, and bicycling layers independent instead of coupling visibility to local component state. The Future Transit control is default off and intentionally groups official future alignments under one toggle so the map-layer contract stays stable.

## Sample Overlays

The current layer uses Google Maps `TransitLayer`. The future, visionary, and nationalized layers render imported proposal adapter output through Google Maps polylines:

- Future: official planned, funded, or under-construction proposals such as the D Line Extension Sections 2 and 3 seed proposal.
- Visionary: Vermont Avenue Rapid Rail seed concept.
- Nationalized: Alameda Corridor freight seed corridor.

Proposal geometry remains GeoJSON `[lon, lat]` in the data model and is converted to Google `{ lat, lng }` paths by the existing adapter helpers.

Future proposal metadata is exposed through Google Maps `InfoWindow` content. Line clicks include status, mode, confidence, classification, timeline, and the first provenance source with a reachable URL when the source record includes one. Station records remain in the data model for planning metadata, but they are not rendered as individual map dots by default.

## Performance Assumptions

The initial samples are small enough to instantiate when the map loads. Larger LA-wide overlay sets need additional gates before they are added:

- Keep layer groups independently toggleable and default heavy datasets off.
- Use `minZoom` and `maxZoom` metadata to avoid drawing detailed geometry too early.
- Simplify or tile long corridors before rendering thousands of vertices.
- Prefer viewport-aware loading or Google Maps `Data` layer for large feature collections.
- Batch station markers or cluster them before adding dense regional station sets.
