# Map Overlay Style And Metadata

VR-003, VR-004, VR-403, and veloRail-1581 keep VeloRail overlays on Google Maps while centralizing line style, optional station marker style, legend metadata, and click metadata in the overlay registry.

## Style Config

`MAP_OVERLAY_STYLE_CONFIG` in `src/components/Map/mapOverlayRegistry.ts` maps overlay/status families to Google Maps polyline, marker, legend, and badge metadata:

- `current`: Google Maps current transit context.
- `context`: Google Maps bicycling context.
- `future`: official planned, funded, or under-construction projects.
- `visionary`: unofficial concepts and speculative scenarios.
- `freight_only`: freight corridors that do not imply passenger service.
- `converted_passenger`: passenger conversion concepts on freight corridors.

Proposal records can still override stroke colors through their existing `style` hints, but future, visionary, freight, and converted-passenger overlays are resolved to Google-like solid lines with a white casing. Station records remain in proposal metadata, but proposal overlays do not render station dots unless a record explicitly opts in with `rendering.stationMarkersVisible`.

## Metadata Interaction

Proposal polylines use Google Maps click listeners. A click opens a Google Maps `InfoWindow` and dispatches `velorail:map-overlay-metadata-selected` with normalized metadata for the React side panel.

The metadata model includes:

- proposal and object identity
- line, corridor, or station kind
- status, classification, confidence, and uncertainty labels
- opening, phase, ownership, operator, track usage, electrification, and suitability details when available
- provenance links and accessed dates
- uncertainty disclaimer or source notes

The side panel is intentionally supplemental to the Google Maps `InfoWindow`: the `InfoWindow` anchors the clicked map object, while the React panel gives source/provenance detail without replacing map hit testing.

## Freight Rendering

The nationalized rail overlay renders `freight` and `converted_passenger` proposal layer groups. Freight-only corridors use muted solid rail strokes and converted-passenger concepts use solid cased passenger-service strokes instead of dotted or dashed symbols.

Freight geometry remains VeloRail-owned proposal geometry. Google Maps renders the polylines and handles click events, but the Google basemap is not treated as a source for freight alignment, ownership, or conversion claims. For the initial LA nationalized corridors, display geometry is simplified from the public Caltrans California Rail Network feature layer already cited in proposal provenance.

## Accessibility Notes

Native Google Maps geometry remains pointer-oriented. The adjacent layer panel and metadata panel have accessible labels, close controls, and visible source text. Future work can add keyboard-selectable overlay result lists if non-pointer inspection becomes a core workflow.
