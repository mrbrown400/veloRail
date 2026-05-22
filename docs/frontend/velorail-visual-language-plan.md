# VeloRail Visual Language Plan

Issues: MBR-59, MBR-76
Milestone: Figma + Design System Planning
Verified: 2026-05-22 on `feature/velorail-frontend-redesign-google-maps-parity`
Scope: visual-language requirements only. No code, data reclassification, Google Maps replacement, or final visual signoff changed.

## Mode Visual Language

| Mode or concept | Visual treatment | Rules |
| --- | --- | --- |
| Bike | Bike icon, green token family, strong route visibility on the map, safety chip only when `leg.safety` exists. | Bike remains first-class in Bike + Rail. UI surfaces should prefer the design token green; map lines may need stronger contrast on dark maps. |
| Walk | Walk icon, neutral gray treatment, dashed route line, low visual weight. | Walking supports route continuity. It should not overpower rail or bike unless the route family is Walk + Rail. |
| Rail | Train icon, solid line, agency line color when `leg.color` exists, Google blue fallback. | Rail is the primary transit segment in route cards and itinerary. Do not invent line identity beyond current fields. |
| Bus | Bus icon, blue dashed treatment distinct from rail. | Use only for `transit_bus`. Do not imply richer vehicle type support until route conversion preserves it. |
| Driving | Car icon, muted comparison treatment, label as comparison-only where shown. | Driving should not appear as the default or equal product winner. It is a benchmark, not the core VeloRail promise. |
| Future route | Future rail icon or chip, future preview badge, expected opening and savings only when populated. | Display only when `route.isFuture` exists. Never present future route output as current Google Maps service. |

## Route Leg Visual Language

Route detail rows should be chronological and mode-led:

- Mode icon.
- Uppercase or compact mode label.
- Human-readable instruction.
- From and to endpoints.
- Distance and duration.
- Transit line chip when `leg.line` exists.
- Headsign when `leg.headsign` exists.
- Wait/departure/delay chip when fields exist.
- Bike safety chip only for bike legs with safety data.

Do not show:

- Fare.
- Platform or track.
- Exact arrival time from Google transit legs.
- Full stop count for Google legs unless `leg.stations` exists.
- Accessibility status.
- Crowding.
- Agency alerts.
- Turn-by-turn maneuvers.
- Live vehicle ETA unless the realtime store is populated by a real provider.

## Route Result Visual Language

VeloRail route cards should borrow Google Maps hierarchy without copying car-first priority:

1. Duration.
2. Route family label.
3. Mode sequence.
4. Summary.
5. Distance.
6. Transfer count.
7. Bike safety, future opening, or savings only when data exists.

Required distinctions:

- Bike + Rail and Walk + Rail remain first-class.
- Driving is comparison-only and visually quieter than car-free route families.
- Future preview cards must use future language and not look like active service.
- Selected cards must synchronize with selected route detail and selected map polyline.
- Same-mode Google alternatives must not be designed as current behavior until stable route IDs and route-contract support exist.

## Overlay Group Visual Language

| Overlay group | Visual treatment | Required copy and metadata |
| --- | --- | --- |
| Current transit | Native Google `TransitLayer` language and current/blue context. | Label as Google Maps current transit context. Do not restyle it as VeloRail-owned data. |
| Bicycling context | Native Google `BicyclingLayer` language and green/context tokens. | Label as bike map context, not route result or planning claim. |
| Official future | Purple token family, thin solid Google-like stroke, official future badge. | Planned, funded, or under-construction only. Must remain official-only. |
| Visionary | Red or pink token family, thin solid stroke, visionary badge. | Always pair with unofficial, concept, uncertainty, and source language. |
| Freight only | Muted slate/gray corridor treatment. | Label as freight corridor. Do not imply passenger service. |
| Passenger conversion / nationalized | Teal or blue passenger-conversion treatment under Nationalized Rail Planning. | Label as hypothetical passenger-conversion planning over sourced freight corridors, not approved service. |

Selected route overlays should remain visually above scenario overlays. Current selected route lines use high map z-index values; future work should preserve selected route priority and then define explicit z-index constants for proposal overlays, selected routes, stations, and vehicle markers.

## Metadata, Provenance, And Uncertainty

Metadata panels and InfoWindows must make the source boundary obvious:

- Google Maps renders the map and overlay primitives.
- VeloRail owns future, visionary, freight, nationalized, conversion, and scenario-planning data.
- Google Maps must not be cited as evidence for future service, visionary concepts, freight ownership, conversion suitability, or opening timelines.

Required metadata treatments:

- Badge for scenario or status family.
- Status.
- Classification.
- Confidence.
- Uncertainty.
- Geometry source.
- Opening year or phase when available.
- Disclaimer or source note when available.
- Source links with publisher/title and accessed date.

Additional freight and conversion treatments when present:

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

Uncertainty must never rely on color alone. Pair visual treatment with plain text such as official future, advocacy concept, speculative scenario, approximate geometry, manually digitized, source-derived, or high uncertainty.

## What Must Remain VeloRail-Specific

- Car-free routing priority.
- Bike + Rail and Walk + Rail route families.
- Driving as comparison-only.
- Bike safety context.
- Future route preview language.
- Official future overlays that are separate from current transit service.
- Visionary concepts with explicit speculative language.
- Freight and nationalized passenger-conversion scenarios.
- Source links, accessed dates, provenance, confidence, and uncertainty.
- Custom route and overlay rendering through Google Maps primitives.

## What Should Mimic Google Maps

- Map remains the dominant surface.
- Search stays stable, compact, and always recoverable.
- Autocomplete uses clear primary and secondary place text.
- Directions entry keeps origin and destination editable.
- Route cards use duration-first hierarchy.
- Selected route, route card, route detail, and map polyline stay synchronized.
- Layer access is compact by default and expandable on demand.
- Mobile route results use persistent bottom-sheet behavior.
- Native Google controls and attribution keep reserved space.

## Frame And Spec Rules

- Figma frames may show layout and visual hierarchy for future states, but must annotate planned versus current behavior.
- Do not design unsupported route fields as if they exist.
- Do not flatten official, visionary, freight, and conversion overlays into one generic future layer.
- Do not let map parity dilute VeloRail identity.
- Keep Google Maps visual familiarity at the interaction layer, not as a branding clone.
