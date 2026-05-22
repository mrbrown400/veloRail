# Google Maps Mobile Controls And Panels Research

Reviewed: 2026-05-22
Issue: MBR-73
Scope: research only. No CSS, component, API key, billing, or environment config changed.

## Sources Reviewed

- [Maps JavaScript controls](https://developers.google.com/maps/documentation/javascript/controls)
- [Maps JavaScript interaction and gesture handling](https://developers.google.com/maps/documentation/javascript/interaction)
- [Maps JavaScript layers](https://developers.google.com/maps/documentation/javascript/layers)
- [Maps JavaScript InfoWindows](https://developers.google.com/maps/documentation/javascript/infowindows)
- [Maps JavaScript events](https://developers.google.com/maps/documentation/javascript/events)
- [Accessible Advanced Markers](https://developers.google.com/maps/documentation/javascript/advanced-markers/accessible-markers)
- [Google Maps Android directions help](https://support.google.com/maps/answer/144339/get-directions-amp-show-routes-android?co=GENIE.Platform%3DAndroid&hl=en-GB)
- [Google Maps Android layers help](https://support.google.com/maps/answer/3092439?co=GENIE.Platform%3DAndroid&hl=en-en)
- [Google Maps accessibility help](https://support.google.com/maps/answer/6396990?co=GENIE.Platform%3DAndroid&hl=en)
- [Material bottom sheets](https://m1.material.io/components/bottom-sheets.html)
- Direct Google Maps mobile web observation and local VeloRail mobile viewport observation at 390 by 844.
- Local files: `src/components/Map/MapContainer.tsx`, `src/components/Map/MapOverlayRenderer.tsx`, `src/components/Results/ResultsSidebar.tsx`, `src/components/Results/RouteDetails.tsx`, `src/data/mapOverlayRegistry.ts`, `src/styles/google-maps-theme.css`.

## Mobile Bottom Sheet Behavior

Google Maps mobile treats route information as a persistent bottom surface. The map remains visible, the selected route stays anchored, and detail can expand into a larger sheet. Material guidance makes the same distinction: persistent sheets supplement the map, while modal sheets are better for focused tasks that temporarily block map interaction.

VeloRail's current responsive behavior turns `ResultsSidebar` into a bottom panel at mobile widths, but the state is effectively open or closed. Closing the panel also clears the selected route. That is less useful than a minimized route summary that keeps route context on the map.

Recommended target:

- Collapsed state: small route summary and selected route still visible.
- Half state: route cards or selected route summary with map still usable.
- Full state: itinerary details and route metadata.
- Dismissal should minimize when appropriate, not always clear selected route.
- Sheet height should feed route-fit padding so the selected route is not hidden behind the panel.

## Map Control Layout

Google Maps Platform controls can be positioned, but some map UI such as attribution and branding remains reserved. Mobile layouts need stable interaction zones:

- Top: search and route-entry controls.
- Right edge: current-location and native map controls.
- Bottom: route result sheet.
- Secondary layer controls: compact entry point that expands only when needed.

VeloRail current gaps:

- The layer panel is visible at the bottom on mobile and competes with route results.
- Results, metadata, and layers all want the same bottom screen real estate.
- Static route-fit padding does not know the active panel height.
- Google attribution and native controls need overlap checks at mobile breakpoints.

## Layer And Control Behavior

Google Maps mobile exposes map details through a compact layers entry, then lets users toggle contextual map information such as transit or biking. VeloRail already has the right architecture split:

- Native Google `TransitLayer` and `BicyclingLayer` provide map context.
- VeloRail-owned overlays provide future, visionary, nationalized, and scenario-planning data with metadata and provenance.

Recommended target:

- Keep `mapOverlayStore` as the source of truth.
- Collapse the mobile layer panel behind a compact Layers button.
- Group layers by current context, official future, visionary, passenger conversion, and bike context.
- Keep future and scenario overlays discoverable without occupying the bottom of the screen by default.
- Avoid truncating the most important provenance, status, opening-year, or uncertainty copy.
- Use a sheet or popover state that does not conflict with the active route-result sheet.

## Route Results And Detail Mobile Behavior

Google Maps mobile keeps route selection, map overlay, and details coordinated. VeloRail can mirror this interaction pattern while staying honest about its current data contract.

Safe current mobile result fields:

- Duration.
- Distance.
- Route label and type.
- Mode sequence.
- Transfer count.
- Summary.
- Bike safety when present.
- Future preview fields only when future routing is enabled and populated.

Avoid in the mobile UI until contracts expand:

- Fare.
- Platform or track.
- Exact arrivals.
- Service alerts.
- Accessibility status.
- Crowding.
- Turn-by-turn maneuvers.
- Live tracking for Google-derived legs.

Route details should become the full route sheet state rather than a separate competing surface. Metadata panels should have a defined priority relative to route details so the user never has three bottom panels fighting for space.

## Accessibility And Touch Notes

Current accessibility strengths:

- Route cards use button semantics.
- Layer controls have visible focus styles.
- Metadata panels already surface non-visual text and source links.

Gaps to address in implementation:

- Mobile touch targets should move toward 48 by 48 CSS pixels for layer and sheet actions.
- Results, metadata, and layer sheets need focus move and focus return on close.
- Modal sheets need focus trapping; persistent sheets should preserve map access.
- Polyline-only metadata selection needs a non-map keyboard fallback list.
- `gestureHandling: "greedy"` is acceptable for a full-screen map app, but sheet scrolling must not accidentally pan the map.
- Visual keyboard appearance should not hide origin/destination fields or the active prediction list.
- Safe-area insets should be considered for bottom controls.
- Advanced Markers could improve marker accessibility, but require a map ID and marker library decision.

## Current VeloRail Responsive Gaps

| Gap | Current behavior | Impact | Recommended direction |
| --- | --- | --- | --- |
| No snap states | Mobile results are open or closed. | Users lose route context when closing. | Add collapsed, half, and full sheet states. |
| Layer panel always visible | Mobile layer panel occupies bottom screen area. | Map viewport is squeezed before the user asks for layers. | Collapse behind compact Layers control. |
| Panel competition | Results, metadata, and layers share bottom space. | Overlap and route visibility risks. | Define one bottom-surface coordinator. |
| Static map padding | Route fit uses viewport-based padding. | Selected route can hide behind an active sheet. | Tie padding to active sheet height. |
| Long layer copy | Text can truncate in compact panel. | Provenance and uncertainty become less visible. | Move detail copy into expanded layer sheet rows. |
| Keyboard handling | No explicit visual keyboard strategy. | Search fields and suggestions can be obscured. | Add mobile browser coverage for focused inputs. |
| Browser matrix | Existing browser specs are not a full mobile matrix. | Mobile regressions can slip through. | Add 390 by 844 and 430 by 932 projects or targeted tests. |

## Testability Notes

Recommended future browser coverage:

- Mobile viewport tests at 390 by 844 and 430 by 932 with touch enabled.
- Search, route sheet, layer button/sheet, native controls, and attribution do not overlap.
- Collapsed, half, and full route sheet states preserve selected route context.
- Layer sheet can open and close without clearing selected route.
- Metadata panel focus moves in and returns to the trigger on close.
- Keyboard navigation reaches route cards, layer toggles, and metadata links without requiring map clicks.
- Sheet scroll does not pan the map unintentionally.
- Strict Google Maps smoke remains conditional on a configured API key; deterministic panel behavior should use fixture state.
