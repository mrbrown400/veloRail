# VR-305 Map Interaction UX

VR-305 keeps the Google Maps surface as the primary interaction model and standardizes the app-owned controls around it.

## Interaction Rules

- Map layer controls are toggle buttons with `aria-pressed`, a stable focus ring, a visible active rail, and a state dot.
- The legend is opened from the layer panel header and is labelled as the visible layer legend.
- Proposal lines, stations, and corridors continue to use Google Maps click events. A click opens the native info window and publishes the same metadata to the React metadata panel.
- The metadata panel is dismissible by the close button or Escape. On mobile and tablet widths it becomes a bottom panel, and the layer panel is hidden while metadata is open so the two panels do not stack over the map.
- Route results can be closed after a route search. If route options still exist, a compact reopen button restores the results panel without rerunning the search.
- Route fit bounds now reserve left-side space for the desktop results panel and bottom space for the mobile results sheet.

## Current Inventory

- Overlay controls: `MapContainer` renders grouped current, future, visionary, and nationalized toggle controls from the overlay registry.
- Overlay metadata: Google Maps objects dispatch `velorail:map-overlay-metadata-selected`; `MapContainer` renders the side or bottom metadata panel.
- Route results: `ResultsSidebar` owns loading, error, empty, option list, selected-route details, close, and reopen states.
- Search and map-adjacent controls: `SearchCard` exposes route-search busy and feedback status to assistive technology.

## Accessibility Gaps

Google Maps base map features, native map gestures, native marker focus order, and native info-window focus are still controlled by the Maps runtime. The app-owned fallback is the labelled metadata panel, documented control labels, marker titles, and browser coverage for panel keyboard dismissal.

## Verification

Browser coverage now includes `@VR-305` assertions for visible route-search feedback, metadata Escape dismissal, and nationalized metadata display.
