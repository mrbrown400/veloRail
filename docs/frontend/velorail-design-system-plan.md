# VeloRail Design System Plan

Issues: MBR-59, MBR-75
Milestone: Figma + Design System Planning
Verified: 2026-05-22 on `feature/velorail-frontend-redesign-google-maps-parity`
Scope: code-facing design-system requirements only. No CSS, component, route, or store implementation changed.

## Current Token Inventory

The active token layer is `src/styles/design-system.css`. The active app stylesheet is `src/styles/google-maps-theme.css`, which aliases `--gm-*` variables to `--vr-*` tokens and owns the current app layout classes.

| Token family | Current coverage | Notes for redesign |
| --- | --- | --- |
| Color | Base surface, muted surface, hover, selected, text, border, accent, success, warning, danger, bike, rail, future, overlay scenario colors and backgrounds. | Extend rather than replace. Add missing walk, bus, driving-comparison, start, destination, provider-degraded, and state-surface tokens. |
| Typography | Roboto/Arial stack, 2xs through xl sizes, regular/medium/semibold weights, tight/normal line heights. | Keep compact Google-like scale. Do not introduce hero-scale type inside map panels. |
| Spacing | 4, 8, 12, 16, 20, 24, and 32 px steps. | Enough for most surfaces. Add named panel/sheet inset tokens if repeated across search, results, layers, and metadata. |
| Shape | 4, 8, 12 px and pill radius. | Keep cards at 8 px unless sheet or map-control conventions require 12 px. |
| Elevation | Raised, floating, panel shadows, focus ring. | Add sheet/modal elevation tokens and stronger border tokens for overlapping map surfaces. |
| Layering | Map overlay, floating panel, popover, side panel z-index tokens. | Split by search, autocomplete, layer panel, bottom sheet, metadata, and modal. Google map object z-index still needs TypeScript constants. |
| Layout | Sidebar width. | Add layer panel width, metadata panel width, sheet heights, panel insets, and touch target minimum. |

Current shared primitives:

- `Button` and `IconButton`: variants, sizes, icon slots, full width, and `aria-pressed`.
- `Chip`: neutral, accent, success, warning, danger, and future tones.
- `Card` and `Panel`: semantic surface wrappers.
- `ToggleChip`: map toggle button over `Button`.
- `icons.tsx`: local SVG icons marked `aria-hidden` when used decoratively.

## Proposed Token Additions

Add tokens in `design-system.css` first, then alias only the values needed by `google-maps-theme.css`.

| Token group | Proposed names | Purpose |
| --- | --- | --- |
| Mode colors | `--vr-color-walk`, `--vr-color-bus`, `--vr-color-driving-comparison`, `--vr-color-start`, `--vr-color-destination` | Makes route modes and endpoint markers consistent across cards, itinerary rows, and map overlays. |
| State surfaces | `--vr-color-surface-error`, `--vr-color-surface-warning`, `--vr-color-surface-success`, `--vr-color-surface-info`, `--vr-color-provider-degraded` | Replaces repeated literal error/warning backgrounds and supports degraded-provider feedback. |
| Route drawing | `--vr-route-casing-light`, `--vr-route-casing-dark`, `--vr-route-bike`, `--vr-route-walk`, `--vr-route-bus`, `--vr-route-driving` | Aligns route card chips with `RouteOverlay` colors while keeping map object z-index in TypeScript. |
| Sizing | `--vr-control-height-sm`, `--vr-control-height-md`, `--vr-control-height-lg`, `--vr-touch-target-min`, `--vr-panel-inset`, `--vr-layer-panel-width`, `--vr-metadata-panel-width` | Normalizes inputs, buttons, map controls, and panels. Mobile controls should target 48 px minimum. |
| Sheets | `--vr-sheet-peek-height`, `--vr-sheet-half-height`, `--vr-sheet-max-height`, `--vr-sheet-handle-width` | Supports collapsed, half, and full mobile route/layer/metadata sheets. |
| Elevation and borders | `--vr-shadow-sheet`, `--vr-shadow-modal`, `--vr-border-subtle`, `--vr-border-strong` | Prevents ad hoc shadows and borders across floating map surfaces. |
| Motion | `--vr-motion-fast`, `--vr-motion-panel`, `--vr-ease-standard` | Keeps panel, sheet, hover, and focus transitions consistent and reducible. |
| Layering | `--vr-z-search-panel`, `--vr-z-layer-panel`, `--vr-z-autocomplete`, `--vr-z-bottom-sheet`, `--vr-z-metadata-panel`, `--vr-z-modal` | Clarifies stacking among app panels without changing Google Maps overlay object ordering. |

## Component Styling Plan

| Surface | Reuse or extend | Requirements |
| --- | --- | --- |
| Search card | Extend `Card` plus `.search-card` | Add planned variants for desktop floating panel and mobile sheet. Support field-level states, clear controls, swap control, and keyboard-safe autocomplete placement. |
| Autocomplete | Extend `PlaceAutocomplete` classes | Add combobox/listbox/option styling, active descendant state, loading, error, and visible no-results state. Prediction text should support primary and secondary lines. |
| Buttons and map controls | Extend `Button`, `IconButton`, `ToggleChip` | Add durable variants for map control, sheet action, quiet/danger, and segmented selected states. Keep native button semantics. |
| Chips | Extend `Chip` tones | Add mode, source/provenance, uncertainty, provider-degraded, official future, visionary, freight, and passenger conversion tones. Do not rely on color alone. |
| Route cards | Extend `RouteOption` classes | Duration-first hierarchy, selected state, comparison-only driving treatment, future preview treatment only when `route.isFuture` exists, and no unsupported fields. |
| Route details | Extend `RouteDetails` classes | Leg-level timeline with mode identity, endpoints, line/headsign/wait/delay/safety only when data exists. |
| Results panel | Extend `Panel` and `.results-sidebar` | Desktop side panel remains. Mobile needs planned sheet variants: collapsed, half, full. Closing behavior must distinguish minimize from clear. |
| Layer controls | Extend `MapContainer` layer classes | Compact mobile entry, grouped expanded rows, active counts, legend access, provenance notices, and wrapping for long labels/descriptions. |
| Metadata panel | Extend `Panel` and metadata classes | Source/provenance-first layout, sticky header, focus entry/return, source links, uncertainty text, and mobile sheet behavior. |
| Bike settings | Extend existing popover | Keep as popover on desktop. On mobile, ensure viewport bounds, focus return, and 48 px controls. |

## CSS Classes Likely Affected Later

Primary app classes:

- `.search-card`, `.search-form`, `.search-header`, `.search-inputs`, `.search-input-wrapper`, `.search-input`, `.search-input-icon`, `.location-btn`, `.location-status`, `.search-options`, `.search-feedback`.
- `.autocomplete-dropdown`, `.autocomplete-item`, `.autocomplete-loading`, `.autocomplete-no-results`, `.autocomplete-error`.
- `.bike-settings`, `.bike-settings-toggle`, `.bike-settings-panel`, `.setting-*`.
- `.results-sidebar`, `.results-sidebar-reopen`, `.sidebar-*`, `.route-results-state`, `.route-options`, `.route-option*`, `.route-mode-step*`.
- `.route-details*`, `.route-leg*`, `.route-line-chip`, `.wait-time-badge`, `.safety-badge`, `.delay-badge`.
- `.map-layer-panel*`, `.map-layer-group*`, `.layer-btn*`, `.map-layer-legend*`.
- `.map-overlay-metadata*`, `.map-overlay-info-window*`.
- `.vr-button*`, `.vr-chip*`, `.vr-card`, `.vr-panel`.

## Z-Index And Elevation Constraints

Current CSS z-index tokens are broad:

- `--vr-z-map-overlay: 10`
- `--vr-z-floating-panel: 100`
- `--vr-z-popover: 150`
- `--vr-z-side-panel: 200`

Future CSS layering should order surfaces as:

1. Google basemap and native controls.
2. App overlay panels that should sit below active metadata.
3. Search panel.
4. Layer panel.
5. Autocomplete and popovers.
6. Desktop side panel or mobile bottom sheet.
7. Metadata panel or sheet.
8. Modal-only surfaces, if any.

Google Maps object z-index must be handled in TypeScript, not CSS custom properties. Current selected route lines use 9000 to 9002, while proposal overlays use lower calculated z-indexes and `VehicleMarker` can sit below selected route lines. A later implementation issue should define constants for proposal overlays, selected routes, station markers, and vehicles before changing map stacking.

## Responsive Breakpoints

Keep current CSS breakpoint structure unless MBR-60 approves a broader responsive strategy:

- Default desktop.
- `max-width: 768px` for mobile/tablet panels.
- `max-width: 480px` for compact mobile density.

Design and test targets:

- 390 by 844 for narrow mobile.
- 430 by 932 for larger phone.
- 768 px width for transition behavior.
- Desktop 1440 by 900 for panel coexistence.

Plain CSS custom properties cannot drive media query values directly. If the project wants named breakpoints later, document the literal values in a shared design note or expose matching TypeScript constants where component logic needs them.

Mobile surfaces need one bottom-surface coordination model. Route results, metadata, and layers must not independently occupy the same bottom viewport. Active sheet height should feed `MapContainer` route-fit padding instead of relying only on static viewport padding.

## Accessibility And Focus Requirements

- Add field-level `aria-invalid` and `aria-describedby` for origin and destination errors.
- Autocomplete should use combobox/listbox/option semantics, active descendant, Arrow, Enter, Escape, Tab, blur, and visible no-results behavior.
- Loading messages should use `role="status"` and errors should use `role="alert"` where appropriate.
- Persistent sheets should move focus on open and return focus on close. Only modal sheets should trap focus.
- Metadata opening should move focus to the panel or first heading and return focus to the trigger or safe fallback.
- Add a keyboard-accessible overlay feature list or equivalent non-map path for metadata, because polylines are pointer-oriented.
- Mobile tap targets should be at least 48 by 48 CSS pixels for primary controls.
- Respect reduced motion for sheet and panel transitions.
- Do not encode status, classification, confidence, uncertainty, or active overlay state by color alone.

## Implementation Sequencing

1. Add additive `--vr-*` tokens and compatibility aliases. Update token inventory tests.
2. Extend shared primitives without changing app behavior.
3. Normalize search, field, and autocomplete states.
4. Normalize route card and route detail styling using current safe `Route` fields only.
5. Add bottom-sheet tokens and a bottom-surface coordinator.
6. Apply layer and metadata styling, focus behavior, and long-content handling.
7. Add targeted browser coverage for focus order, mobile overlap, route sheet states, layer sheet behavior, and metadata close/return.

## Non-Goals

- Do not replace the existing design system.
- Do not add Tailwind, MUI, Angular, or another framework.
- Do not add unsupported route data to satisfy a visual design.
- Do not create a second overlay visibility model outside `mapOverlayStore`.
- Do not treat Figma as source of truth for Google Maps API capabilities or VeloRail data provenance.
