# Responsive, Accessibility, And UI States

Issues: MBR-79, MBR-60
Milestone: Unified Product/Design Specification
Verified: 2026-05-26 on `feature/velorail-frontend-redesign-google-maps-parity`
Scope: implementation-ready responsive, accessibility, and state requirements only. No CSS, component, browser test, Figma file, or QA execution changed.

## Outcome

Implementation should be testable before launch because every major VeloRail UI surface has a defined layout mode, keyboard/focus contract, and state matrix. The redesign should not defer accessibility, mobile overlap, loading, empty, error, or degraded provider states until final QA.

## Responsive Model

Keep the current breakpoint structure unless a later implementation issue proves a broader strategy is required:

- Desktop default.
- `max-width: 768px` for tablet and mobile panel behavior.
- `max-width: 480px` for compact mobile density.

Required planning and verification viewports:

| Viewport | Purpose |
| --- | --- |
| 1440 by 900 | Desktop map, search, results, layer panel, and metadata coexistence. |
| 768 px width | Transition behavior from side panels to bottom surfaces. |
| 430 by 932 | Larger phone route search, route sheet, layers, and metadata. |
| 390 by 844 | Narrow phone overlap, touch targets, keyboard-safe search, attribution safety. |

CSS custom properties cannot directly drive media query values. If named breakpoints become necessary, document literal values in a shared design note or expose matching TypeScript constants where component logic needs them.

## Desktop State Inventory

Required desktop states:

- Loaded map with collapsed search and current transit context.
- Expanded directions with origin, destination, current location, swap, clear, time, mode, bike settings, and route action.
- Autocomplete closed, loading, results, no results, service error, and keyboard-highlighted result.
- Route calculation loading.
- Results side panel with route options.
- Selected route detail.
- Results closed with route reopen affordance.
- Layer panel or compact layer control with active counts.
- Legend open.
- Metadata panel open, closed, and long-content scrolling.
- Map load error or API-limited blocker.
- Degraded-provider message when fallback affects confidence.

Desktop constraints:

- Search, results, layers, metadata, native controls, and attribution must not overlap incoherently.
- Selected route fit padding accounts for side panels.
- Focus return works after closing autocomplete, results, legend, layers, and metadata.

## Mobile State Inventory

Required mobile states:

- Default map with compact search entry.
- Search sheet with active field and autocomplete above the visual keyboard.
- Collapsed route sheet with selected route summary.
- Half route sheet with route options.
- Full route sheet with itinerary detail.
- Layer sheet or popover opened from compact Layers entry.
- Metadata sheet with provenance and source links.
- Bike settings sheet or popover when needed.
- No route, route error, field error, provider error, and degraded fallback states.
- Closed state where map controls and attribution remain visible.

Mobile constraints:

- Only one bottom surface can be active at a time unless a nested control is clearly modal.
- Closing full route should usually move to half or collapsed rather than clearing route context.
- Clearing a route is an explicit action.
- Metadata close restores the prior route or layer state when one existed.
- Layer sheet must not clear `selectedRoute`.
- Active sheet height informs selected-route map padding.
- Primary touch targets should be at least 48 by 48 CSS pixels.

## Bottom Sheet Requirements

Managed surfaces:

- Search sheet.
- Autocomplete dropdown within search sheet.
- Route results sheet.
- Route detail sheet.
- Layer sheet or popover.
- Metadata sheet.
- Bike settings popover or sheet.

Implementation note for MBR-95:

- `src/stores/uiStore.ts` is the source of truth for the active mobile bottom surface through `activeBottomSurface`.
- Route sheet visibility and `collapsed` / `half` / `full` state are store-owned; route results, selected route, endpoints, and route clearing remain in `routeStore` or explicit route actions.
- Search surface dominance is store-owned through `searchMode` plus `activeBottomSurface`; typed values, resolving state, field errors, degraded-provider messaging, and focus refs remain local to `SearchCard`.
- Layer sheet open/close state is store-owned so it can yield to metadata, bike settings, search, or route surfaces without clearing overlay visibility or comparison mode from `mapOverlayStore`.
- Metadata dominance is store-owned, while the selected overlay metadata payload, trigger refs, Google Maps instance, and map viewport refs remain local to `MapContainer`.
- Bike settings reports `bike-settings` as the active surface while open, but speed/weight values and persistence stay local/service-owned in `BikeSettings` and `bikeDurationService`.
- Legend open state remains local to `MapContainer` because it is nested inside the layer surface and closes before the layer sheet.

Required sheet states:

| State | Use | Map behavior |
| --- | --- | --- |
| Closed | No active bottom surface. | Map uses default padding. |
| Search | Endpoint entry or repair. | Map remains visible; keyboard-safe layout. |
| Collapsed route | Selected route summary. | Selected route remains visible. |
| Half route | Route options or summary. | Map remains usable. |
| Full route | Itinerary detail. | Selected route fit accounts for sheet height. |
| Layer | Toggle groups, legend, active counts. | Does not clear selected route. |
| Metadata | Source/provenance/detail review. | Selected feature remains visible where feasible. |

Priority rules:

1. Active text entry and autocomplete stay visible above the visual keyboard.
2. Route detail can use full sheet state when the user is reviewing an itinerary.
3. Metadata can temporarily take priority when opened from an overlay, but closing restores prior route or layer state.
4. Layer controls open from a compact entry and do not occupy bottom space by default.
5. Modal surfaces can trap focus; persistent route and layer sheets should preserve map access.

## Keyboard Requirements

Search and autocomplete:

- Inputs have explicit labels or accessible names.
- Field errors use `aria-invalid` and `aria-describedby`.
- Autocomplete uses combobox/listbox/option semantics.
- Active option state is communicated through `aria-activedescendant` or equivalent.
- Arrow keys move through predictions.
- Enter selects an active prediction or submits only when unambiguous.
- Tab follows normal focus flow without trapping the user.
- Escape closes autocomplete before larger panels.

Route results:

- Route cards use native button semantics or equivalent.
- Selected state uses `aria-pressed` or equivalent.
- Keyboard selection updates route card, route detail, and route overlay together.
- Results region has an accessible label.
- Timeline rows use semantic grouping or list structure.

Map controls and metadata:

- Toggle buttons expose pressed state.
- Legend exposes expanded state and a labelled region.
- Metadata panel exposes a labelled region and close button.
- Overlay metadata is available through a keyboard path that does not require clicking a polyline.
- Source links are keyboard reachable.

## Escape Behavior

Escape closes active UI in this priority order:

1. Active autocomplete list.
2. Active popover or modal nested inside a sheet.
3. Metadata panel or sheet.
4. Legend.
5. Layer sheet or panel.
6. Full route sheet to half or collapsed route sheet.
7. Search sheet to collapsed search when no required field repair is active.

Escape should not clear route results, selected route, endpoint values, or overlay visibility unless the focused control explicitly represents a clear action.

## Aria-Live Status And Error Behavior

Use status semantics for:

- Autocomplete loading.
- Origin or destination resolving.
- Route calculation in progress.
- Layer or metadata loading if introduced.
- Current-location pending state.

Use alert semantics for:

- Field validation errors.
- Autocomplete provider error.
- Geocode failure.
- Outside service area.
- Route calculation failure.
- No route when it is the result of a submitted search.
- Google Maps API/key/library load blocker.

Avoid noisy announcements for purely visual state such as hover, map pan, or background overlay rendering.

## Route Card Selection Behavior

Requirements:

- Route cards are keyboard reachable.
- Selecting a card updates `routeStore.selectedRoute`.
- Selected route detail reflects the same route.
- `RouteOverlay` renders the same selected route.
- Selected state uses more than color and communicates pressed or selected state to assistive technology.
- Stable route IDs are required before duplicate or same-mode alternatives are enabled.
- Closing results should preserve recoverable route context when a reopen affordance exists.

## Focus Management

Opening behavior:

- Search sheet focuses the active endpoint field.
- Results side panel or sheet focuses a heading or first route card after route calculation when it does not interrupt typing.
- Route detail focuses the detail heading or close/back control.
- Layer panel or sheet focuses the heading or first toggle.
- Metadata panel or sheet focuses the heading or first useful control.

Closing behavior:

- Autocomplete returns focus to the field.
- Results close returns focus to route summary/reopen or search fallback.
- Layer close returns focus to the Layers trigger.
- Metadata close returns focus to the triggering feature control or safe fallback.
- Modal nested controls restore focus to their opener.

Focus trapping:

- Trap focus only for modal sheets or dialogs.
- Persistent route, layer, and metadata surfaces should not trap focus when map access remains available.

## UI State Matrix

| Surface | State | Required UI | Verification notes |
| --- | --- | --- | --- |
| App | Map loading | Centered loading state. | Existing app-level state can remain. |
| App | Map load error | Error Loading Google Maps and key/library guidance. | Strict browser gate should fail in this state. |
| App | Loaded | Map, search, layer controls, and optional results. | DOM and visual checks. |
| Search | Collapsed | Destination field, location status, route action. | Missing origin expands search. |
| Search | Expanded | Origin, destination, current location, time, mode, bike settings, safety, route action. | Desktop and mobile variants. |
| Search | Field unresolved | Field-specific state after raw typing. | Selected location and raw input are distinct. |
| Search | Field loading | Field-specific lookup progress. | `role="status"` where practical. |
| Search | Field error | Field-specific error and recovery. | `aria-invalid`, `aria-describedby`. |
| Autocomplete | Closed | No dropdown. | Below threshold or dismissed. |
| Autocomplete | Loading | Loading row remains open. | Keyboard stays in field. |
| Autocomplete | Results | Primary and secondary prediction text. | Active descendant and selection tests. |
| Autocomplete | No results | Visible no-results row. | Current hidden no-results gap must be fixed. |
| Autocomplete | Service error | Visible provider error row. | Distinct from no matches. |
| Routing | Resolving places | Origin or destination lookup message. | No route data implied. |
| Routing | Calculating | Route calculation message. | Results can show loading state. |
| Routing | Error | Route search failed with recovery. | `role="alert"` where appropriate. |
| Routing | No routes | Dedicated no-route state. | Do not only close sidebar. |
| Results | Empty | No routes calculated yet. | Default before search. |
| Results | Loading | Calculating route options. | Keeps map visible. |
| Results | Options | Route cards and selected state. | Safe current fields only. |
| Results | Detail | Selected itinerary. | Leg-level fields only. |
| Results | Closed with routes | Reopen affordance. | Does not clear route unless explicit. |
| Route overlay | Selected route | Start/end markers and leg polylines. | Above proposal overlays. |
| Layers | Default | Compact or panel view with active count. | Current transit on by default. |
| Layers | Legend open | Labelled legend region. | `aria-expanded`, `aria-controls`. |
| Layers | Overlay toggled | Store-owned visible state. | Active count updates. |
| Metadata | Closed | No panel. | Escape or close button. |
| Metadata | Open | Badge, title, details, disclaimer, sources. | Focus moved into panel. |
| Metadata | Long content | Scrollable details/sources. | Does not pan map unintentionally. |
| Provider | Degraded | User-facing degraded-confidence state. | Only when fallback affects quality. |
| Offline/API limited | Blocker or degraded message. | Exact blocker recorded in QA. |

## Browser Test Requirements

Docs-only milestone:

- `npm run task:gate -- MBR-60 --explain`
- `git diff --check`

Implementation issues:

- `npm run quality`
- `npm run task:gate -- <issue-id> --explain`
- `npm run test:browser:required -- --grep @<issue-id>` for browser-facing work.

Required future browser assertions:

- 390 by 844 and 430 by 932 mobile route sheet states.
- 768 px transition behavior.
- Desktop 1440 by 900 panel coexistence.
- Search field focus and autocomplete keyboard behavior.
- Clear, swap, current-location, and field error states.
- Route card selected state and route overlay synchronization.
- Layer sheet open/close without clearing selected route.
- Metadata focus move and focus return.
- No overlap with Google controls or attribution.
- Reduced-motion behavior for sheet transitions where automated checks are practical.

Manual Browser review should record:

- URL and viewport.
- Whether Google Maps loaded.
- Flow exercised.
- Visible overlap, clipped text, hidden action, focus trap, or route-search stall.
- Exact blocker and follow-up issue when not fixed in scope.

## Acceptance Criteria

- Desktop and mobile state inventories are explicit.
- Bottom sheet requirements cover search, route, layer, metadata, and bike settings.
- Keyboard, Escape, aria-live, route-card selection, and focus behavior are specified.
- Loading, empty, error, partial, selected, collapsed, reopened, degraded, and API-limited states are covered.
- Browser test requirements are ready for implementation and QA issues without Figma.
