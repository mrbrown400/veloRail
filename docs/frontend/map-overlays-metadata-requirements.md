# Map Overlays And Metadata Requirements

Issues: MBR-78, MBR-60
Milestone: Unified Product/Design Specification
Verified: 2026-05-26 on `feature/velorail-frontend-redesign-google-maps-parity`
Scope: implementation-ready map and overlay requirements only. No map code, overlay data, provider, Figma file, or QA execution changed.

## Outcome

The redesigned map UI should keep Google Maps as the base surface while making VeloRail's planning layers understandable, discoverable, and verifiable. Users should be able to turn layers on and off, compare present and official future context, inspect metadata, and understand whether a feature is current service, official future service, visionary concept, freight-only corridor, or hypothetical passenger conversion.

## Google Maps Default Controls Vs Custom Controls

Google Maps owns:

- Base map rendering.
- Gestures and viewport behavior.
- Native zoom and map controls where enabled.
- Attribution.
- Current transit context through `TransitLayer`.
- Bicycling context through `BicyclingLayer`.
- Map object events, polylines, markers, advanced markers when adopted, and InfoWindows where feasible.

VeloRail owns:

- Compact layer entry.
- Layer panel or sheet.
- Overlay group toggles.
- Present Only and Present + Future comparison modes.
- Legend.
- Metadata panel or sheet.
- Future, visionary, freight, nationalized, and passenger-conversion copy, warnings, and provenance.

Do not create another map runtime, tile system, or overlay visibility store.

## Map Controls

Desktop requirements:

- Preserve Google zoom controls and attribution-safe space.
- Keep map gestures native to Google Maps.
- Place app controls so they do not cover Google attribution, native controls, search, route results, selected route details, or metadata.
- Keep layer controls discoverable without dominating the map.
- Keep selected-route fit padding aware of side panels and metadata.

Mobile requirements:

- Collapse layers behind a compact Layers entry by default.
- Keep native controls and attribution unobstructed at 390 by 844 and 430 by 932.
- Coordinate route results, layer controls, and metadata through one bottom-surface model.
- Sheet scroll must not unintentionally pan the map.
- Active sheet height must inform route fit padding.

Map setup follow-up:

- Map ID and Advanced Markers are approved direction but should be handled as separate setup/accessibility work if needed.
- Advanced Marker migration must include marker library loading, Map ID configuration, marker accessibility, and Browser checks.

## Layer Panel

Layer controls must show:

- Current comparison mode.
- Active overlay count.
- Group labels and active counts.
- Toggle states with `aria-pressed`.
- Legend access.
- Source or provenance notice where needed.
- Long descriptions in expanded rows, legend, metadata, or sheet content instead of truncation-only text.

Active and selected state rules:

- Do not rely on color alone.
- Pair color with label, icon, line pattern, badge, count, pressed state, or explanatory text.
- Maintain visible focus styles.
- Preserve button semantics for toggles.

## Overlay Groups

| Group | Runtime/source | Default | Required treatment |
| --- | --- | --- | --- |
| Current | Google `TransitLayer` | On | Label as current Google Maps transit context. Do not treat as VeloRail-owned data. |
| Bike context | Google `BicyclingLayer` | Off | Label as Google bicycling map context. Do not imply route result or planning claim. |
| Official future | VeloRail proposal overlays rendered by Google Maps primitives | Off, or on through Present + Future | Official-only planned, funded, or under-construction. Must not read as current service. |
| Visionary | VeloRail proposal overlays rendered by Google Maps primitives | Off | Unofficial concept or advocacy-derived. Must show uncertainty and source language. |
| Nationalized Rail Planning | VeloRail freight and passenger-conversion overlays rendered by Google Maps primitives | Off | Hypothetical passenger-conversion planning over sourced freight corridors. Must not imply approved passenger service. |

Bike context can live inside Current or as a compact context control, but the label must make clear it is Google bicycling context rather than a Bike + Rail route result.

## Comparison Modes

Requirements:

- Present Only means current Google Maps transit with official future overlay off.
- Present + Future means current Google Maps transit with official future project context on.
- Changing comparison mode updates `future-projects` visibility through `mapOverlayStore`.
- Toggling `future-projects` updates comparison mode through `mapOverlayStore`.
- Unknown overlay IDs remain ignored by the store.
- Visionary and Nationalized Rail Planning overlays remain opt-in and do not silently join Present + Future.

## Legend

Legend should:

- Be available from layer controls.
- Explain current transit, bike context, official future, visionary, freight-only, and passenger-conversion treatments.
- Pair stroke color with line pattern and text.
- Avoid hiding critical classification or uncertainty behind ellipsis.
- Use a labelled region when expanded.
- Preserve `aria-expanded` and `aria-controls` from the current model or equivalent semantics.

## Metadata Panel

Metadata opens when a user selects a VeloRail-owned proposal line, corridor, station, or equivalent feature. The metadata panel must make the source boundary obvious:

- Google Maps renders geometry.
- VeloRail owns future, visionary, freight, nationalized, conversion, and scenario-planning data.
- Google Maps is not evidence for future service, freight ownership, conversion suitability, opening timelines, or visionary concepts.

Required fields when available:

- Badge.
- Title.
- Subtitle.
- Status.
- Classification.
- Confidence.
- Uncertainty.
- Geometry source.
- Opening year or phase.
- Station role and station notes.
- Freight owner.
- Freight operator.
- Track usage.
- Electrification.
- Suitability rating and score.
- Suitability method.
- Missing scoring data.
- Source corridor.
- Conversion scenario.
- Station assumptions.
- Disclaimer.
- Source links with publisher, title, URL, source type, note, and accessed date when present.

Layout:

- Desktop may use a side or floating panel that does not obscure selected route, search, native controls, or Google attribution.
- Mobile uses the shared bottom-surface coordinator and does not stack over route detail or layer sheet without clear priority.
- Header keeps title, badge, and close action accessible.
- Long sources and details scroll inside the panel or sheet without panning the map.

Focus and keyboard:

- Opening metadata moves focus to the panel heading or first useful focus target.
- Closing metadata returns focus to the triggering control or safe fallback.
- Escape closes metadata.
- Add a keyboard-accessible overlay feature list, table, or equivalent non-map path before map polyline clicks are the only way to inspect metadata.
- Source links are keyboard reachable.

## Source And Provenance Display

Source display must include, when available:

- Publisher.
- Source title.
- URL.
- Source type.
- Accessed date.
- Note.
- Geometry source.
- Classification and confidence.
- Uncertainty.
- Disclaimer.

Future and scenario claims must not cite Google Maps as the source unless the claim is specifically about map rendering. Google Maps can be the rendering surface while VeloRail remains responsible for proposal facts and provenance.

## Future, Visionary, And Nationalized Warnings

Required warning language categories:

- Official future project: planned, funded, or under construction; not current service.
- Visionary concept: unofficial, speculative, advocacy-derived, or concept-level; not approved service.
- Nationalized Rail Planning: hypothetical passenger-conversion planning over sourced freight corridors; not approved passenger service.
- Freight-only corridor: freight corridor context; not passenger service.
- Approximate geometry: manually digitized, source-derived, or otherwise approximate when applicable.

Warnings may appear in legend, metadata, and expanded layer rows. High-risk overlays should not rely on metadata-only warnings if users can toggle them on from the layer panel.

## Route Overlay Interaction Requirements

- Selected route polylines and markers stay visually above proposal overlays.
- Route overlays must remain tied to `routeStore.selectedRoute`.
- Route overlays should not be confused with future or scenario overlays.
- Route fit padding accounts for active search, result, layer, and metadata panels.
- Later implementation should define TypeScript constants for proposal overlay z-indexes, selected route casing/line, station markers, and vehicle markers before changing stacking behavior.
- Decide separately whether `VehicleMarker.tsx` should remain below selected route lines.

## Mobile Control Placement Expectations

- Compact Layers entry should be reachable without covering search, route summary, native controls, or Google attribution.
- Layer sheet must not clear `selectedRoute`.
- Metadata close restores prior route or layer surface when one existed.
- Active sheet height informs route fit padding.
- Touch targets for primary controls should be at least 48 by 48 CSS pixels.
- Sheet content scrolls independently from the map.

## Visual Language Requirements

| Overlay or route concept | Treatment | Constraint |
| --- | --- | --- |
| Current transit | Google current context. | Do not cite as proposal source data. |
| Bicycling context | Green/context treatment. | Do not confuse with Bike + Rail route result. |
| Official future | Official future badge and solid Google-like stroke. | Only official planned, funded, or under-construction proposals. |
| Visionary | Visionary badge and clear speculative language. | Must show unofficial/concept/uncertainty language. |
| Freight only | Muted corridor treatment. | Must say freight corridor and avoid passenger-service implication. |
| Passenger conversion | Conversion treatment under Nationalized Rail Planning. | Must say hypothetical planning, not approved service. |
| Selected route | High-priority route line above proposal overlays. | Preserve selected route visual priority and fit padding. |

## Testing Implications

Future implementation issues should include:

- Unit tests for overlay registry order, defaults, group definitions, comparison modes, official future filtering, metadata details, and provenance fields.
- Browser tests for layer grouping, active counts, legend open/close, comparison mode synchronization, overlay toggle states, metadata open/close, source-link visibility, Escape close, and focus return.
- Mobile viewport checks for layer sheet, metadata sheet, route sheet priority, native control overlap, and Google attribution overlap.
- Manual Browser checks for real map hit testing and visible polyline/marker stacking where deterministic synthetic events are insufficient.

Recommended commands:

- `npm run quality`
- `npm run task:gate -- <issue-id> --explain`
- `npm run test:browser:required -- --grep @<issue-id>`

## Acceptance Criteria

- Google Maps remains the rendering and gesture surface.
- Overlay visibility stays grounded in `mapOverlayStore`.
- Map controls, Google default controls versus custom controls, layer panel, overlay groups, comparison modes, legend, metadata panel, provenance, warnings, route overlay interaction, and mobile placement are specified.
- Official, visionary, freight, and conversion boundaries are preserved.
- Metadata requirements include provenance, uncertainty, confidence, disclaimers, and source links.
- Requirements are ready for implementation issue breakdown without Figma.
