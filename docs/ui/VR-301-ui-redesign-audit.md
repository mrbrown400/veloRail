# VR-301 UI Redesign Audit

## Purpose

VeloRail needs a more polished interface for a serious car-free routing and planning product. This audit documents the current UI surface, the main pain points, and a phased redesign direction. It intentionally does not rewrite UI components.

## Inspection Scope

- Active React entrypoint: `src/main.tsx`
- App shell: `src/App.tsx`
- Map UI: `src/components/Map/MapContainer.tsx`, `src/components/Map/RouteOverlay.tsx`, `src/components/Map/VehicleMarker.tsx`
- Search UI: `src/components/Search/*`
- Results UI: `src/components/Results/*`
- Active stylesheet: `src/styles/google-maps-theme.css`
- Supporting state: `src/stores/*`, `src/hooks/useRouting.ts`, `src/hooks/useGeolocation.ts`

Notes:

- `index.html` loads `src/main.tsx`, which imports `src/styles/google-maps-theme.css`.
- The root `style.css` and `src/style.css` appear to be legacy or inactive for the current React entrypoint.
- Runtime map inspection depends on a valid `VITE_GOOGLE_MAPS_API_KEY`; this audit is grounded in the active React code and styling.

## Current UI Inventory

### App Shell

- Full viewport application container with Google Maps as the primary surface.
- App-level loading state displays a centered spinner and "Loading VeloRail...".
- App-level map load failure displays a centered "Error Loading Google Maps" message.
- Search card is rendered above the map until route results open.
- Results sidebar slides in from the left after routes are calculated.

### Map Surface

- Google Maps is the base map through `@react-google-maps/api`.
- Default map center is Los Angeles.
- Google Maps dark color scheme is requested while preserving Google transit colors.
- Default Google UI is not fully disabled.
- Zoom controls are enabled and positioned at top right.
- Map type, Street View, and fullscreen controls are disabled.
- Gesture handling is set to `greedy`.

### Map Layer Controls

- Transit layer is enabled by default through `google.maps.TransitLayer`.
- Bicycling layer is available through `google.maps.BicyclingLayer`.
- Custom layer controls sit over the map as bottom-right pill buttons.
- Controls show "Transit" and "Biking" labels on desktop.
- Labels are hidden below 768px, leaving icon-only buttons.

### Route Overlays

- Selected routes are drawn with Google Maps polylines.
- Start and destination markers use circular Google marker symbols.
- Transit station markers are rendered for transit legs when station data exists.
- Route leg styling:
  - Transit uses the leg or line color.
  - Walk and bus legs are dashed.
  - Driving uses blue.
  - Bike uses a neon green line.
- Each line has white and dark casing underneath the main stroke.
- Map bounds fit the selected route with a hard-coded left padding of 420px.

### Vehicle Tracking

- Vehicle markers are rendered through Google Maps markers.
- Marker position animates between updates.
- Clicking a marker opens a small Google InfoWindow.
- Route details can show a live tracking status panel when vehicle and transit-leg data are available.

### Search Card

- Search card is a white Google Maps styled floating panel at top left.
- Header displays emoji bike plus rail iconography and "VeloRail".
- Collapsed search state:
  - Destination autocomplete input.
  - Location status row.
- Expanded search state:
  - Start autocomplete input.
  - Destination autocomplete input.
  - Location button on the start input.
- Time selector supports "Leave now" and "Depart at".
- Options include:
  - Mode select: All Options, Bike + Rail, Walk + Rail, Driving.
  - Bike settings popover.
  - Safety select: Balanced, Safer Route, Fastest.
- Primary route action is a full-width "Find Route" button.

### Autocomplete

- Place search is debounced.
- Dropdown supports loading, no-results, hover, highlighted, keyboard arrow navigation, Enter selection, and Escape close.
- Results show an icon, place name, and address.
- Dropdown is scoped to the search input wrapper and overlays below the active input.

### Geolocation

- Geolocation is requested on mount.
- States include pending, granted, denied, and unavailable.
- Denied or unavailable state shows an "Enter start" affordance.
- Collapsed search can expand when the location status row is clicked.

### Bike Settings

- Bike settings open from a compact "Bike" button.
- Popover includes:
  - Cruising speed slider with speed label.
  - Rider plus bike weight slider.
  - Explanatory note about elevation adjustments.
- Settings persist through `bikeDurationService`.

### Results Sidebar

- Sidebar is fixed to the left and slides in when open.
- Search card is hidden while the sidebar is open.
- Header repeats VeloRail branding and includes a close button.
- Empty open state displays "No routes calculated yet."
- Route options list displays label, duration, and summary.
- Selected route is highlighted with blue left border and selected background.
- Future routes have a special badge and amber styling.
- Selected route details show total distance, live tracking when available, and leg-by-leg instructions.

### Route Details

- Leg details show mode icon, instruction, distance, duration, wait time, headsign, and safety badge when available.
- Wait-time badges differentiate live schedule information.
- Bike legs can show safety badges: Safe, Moderate, Caution.

### Responsive Behavior

- At max-width 480px, the search card becomes viewport width minus 24px and the results sidebar becomes full width.
- At max-width 768px, layer buttons hide text labels and move closer to the bottom-right edge.
- There is no dedicated mobile bottom sheet behavior.

## Key Pain Points

### Product Framing

The product identity is too light for a serious routing product. The brand appears as small header text with emoji icons, and the search card disappears when results open. There is no persistent product signal, trip context, or planning mode indicator once the sidebar takes over.

### Workflow Clarity

The search flow mixes primary routing fields, departure time, mode filters, safety filters, and bike performance settings in a compact stack. The user can press "Find Route" with missing inputs, but validation feedback is minimal. Routing errors are stored in `routeStore.error` but are not rendered in the visible UI.

### Car-Free Mission Consistency

The mode select includes "Driving" at the same level as Bike + Rail and Walk + Rail. That weakens the product promise of mixed-mode routing that avoids cars. If driving remains available for comparison or fallback, the UI should label it explicitly as comparison-only or de-emphasize it.

### Map Control Fit

Layer controls visually float over Google Maps but are not integrated into Google Maps control positions. Their bottom-right placement can compete with Google attribution and native controls. On mobile, the labels disappear, which makes the control meanings dependent on custom SVG recognition.

### Results and Refinement

When results open, the search card is hidden. Users must close the sidebar to adjust the trip, which interrupts route comparison. The hard-coded map fit padding assumes a 408px to 420px desktop sidebar and does not adapt to the full-width mobile sidebar state.

### Visual Consistency

The active React UI uses a white Google Maps theme, while legacy dark styles remain in root `style.css` and `src/style.css`. Inline styles and emoji icons appear across active components. The result is a partial design system rather than a consistent UI language.

### Accessibility

Several interactive elements need stronger accessibility semantics:

- Route options handle Enter but not Space.
- Icon buttons and SVG buttons rely on `title` or visual-only affordances instead of explicit accessible names.
- Select controls lack visible labels tied to form controls.
- The close button uses a multiplication glyph instead of an icon with a clear accessible label.
- Popovers and side panels do not expose dialog, menu, or expanded state semantics.

### Mobile Ergonomics

Mobile behavior is mostly width adjustment. The results sidebar becomes full screen, the search card remains a top overlay, and the bike settings popover keeps a fixed 280px width. The current structure does not yet feel like a native map app with a bottom sheet and persistent route summary.

### Route Leg Comprehension

Route details are useful but text-heavy. Mode icons are emoji-based, line colors are not always paired with line labels, and transfer or wait states are not visually grouped into a scannable timeline.

### Future Route Communication

Future-route UI exists in `RouteOption`, but route calculation currently passes `includeFuture` as false. The UI treatment uses amber, which can read as a warning rather than as planning or scenario preview. Future and visionary scenarios need clearer design language before being surfaced heavily.

## Design Goals

- Keep Google Maps as the visual and interaction center.
- Make VeloRail feel like a serious planning tool, not a demo panel over a map.
- Preserve familiar Google Maps patterns for map gestures, search, zoom, and route comparison.
- Make car-free routing the default story.
- Keep route comparison visible while allowing quick trip edits.
- Make overlays explain themselves without competing with the base map.
- Support current route results and future scenario previews with distinct, consistent states.
- Improve accessibility without changing routing data contracts.

## Design Constraints

- Use Google Maps APIs and controls wherever feasible.
- Do not introduce alternate map providers or custom tile systems.
- Avoid a major UI rewrite in the audit phase.
- Preserve the existing React architecture for search, map, results, stores, and services.
- Keep route data models, map-layer contracts, and routing assumptions unchanged unless a future Linear issue explicitly captures the plan.
- Maintain support for transit, bike, walking, route safety, wait time, and live vehicle data.

## Recommended Design Direction

VeloRail should move toward a Google Maps-compatible planner shell: a restrained white surface, persistent trip summary, compact controls, clear mode hierarchy, and a results panel that behaves like a route comparison workspace. The map should stay dominant, but route intent and planning status should always be visible.

Use the following north-star structure:

- Persistent top-left route search with compact editable origin and destination.
- Results panel that can coexist with search edits.
- Map controls placed with Google Maps control conventions.
- Route list optimized for scanning: duration, mode sequence, transfers, safety, reliability, and future status.
- Route details as a timeline with line badges, station names, wait states, and safety callouts.
- Mobile results as a bottom sheet instead of a full-screen left sidebar.

## Priority Recommendations

### P0: Documented Polish Fixes

- Render route calculation errors from `routeStore.error`.
- Add missing validation states for empty origin and destination.
- Replace emoji transport markers in primary UI with a consistent icon set.
- Add accessible names and keyboard support for route options, close buttons, layer buttons, bike settings, and location controls.
- Clarify the Driving option as disabled, comparison-only, or remove it from the primary mode set.
- Remove or quarantine inactive legacy CSS after confirming it is not imported by the active React app.

### P1: Map and Search Refinement

- Keep search editable when results are open.
- Convert layer controls into a compact Google Maps-style map control group.
- Add a small active-layer summary or legend for Transit, Biking, and route overlay meaning.
- Make route fit padding responsive to actual sidebar or sheet size.
- Replace inline styling with named classes in the active theme file.
- Add clear loading and empty states for route calculation, not only map load.

### P2: Results Panel Upgrade

- Rework route options into scan-first comparison rows.
- Show mode chain, transfer count, safety level, wait/realtime status, and future status in consistent badges.
- Turn route details into a vertical trip timeline.
- Keep route refinement controls available above or inside the results panel.
- Add a route summary header that remains visible while scrolling.

### P3: Mobile Map App Behavior

- Replace full-screen mobile sidebar with a draggable or stepped bottom sheet.
- Keep map, route summary, and primary actions visible together.
- Ensure bike settings and autocomplete dropdowns fit within narrow viewports.
- Move layer controls away from Google attribution and bottom sheet collision zones.

### P4: Future Planning and Scenario UI

- Create a distinct scenario-preview visual language for under-construction, planned, visionary, and freight-conversion routes.
- Pair future route badges with opening date, confidence, source, and planning status.
- Add a toggle or scenario drawer for future overlays instead of mixing all future states into normal route options.
- Keep Google Maps transit and bicycling layers visually primary, with VeloRail scenario overlays clearly labeled as additive planning data.

## Suggested Follow-Up Issues

- VR-302: Establish active UI design system tokens and component rules.
- VR-303: Redesign search and route refinement flow.
- VR-304: Redesign results sidebar and route details timeline.
- VR-305: Redesign map layer controls and overlay legend.
- VR-306: Add mobile bottom sheet behavior.
- VR-307: Accessibility pass for map-adjacent controls and route panels.
- VR-308: Future/scenario route preview design.

## Audit Outcome

This audit satisfies VR-301 by documenting the current screens and components, capturing map controls and route states, listing pain points, defining design goals and constraints, and recommending phased work. No production UI components were rewritten as part of this task.
