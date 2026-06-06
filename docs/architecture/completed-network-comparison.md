# Completed Network Comparison

VR-104 adds a comparison state model for the map layer panel without changing routing. The comparison mode is UI state layered over the existing Google Maps overlay registry and `mapOverlayStore` visibility map.

## State Model

The comparison mode has two values:

| Mode | Future overlay state | Meaning |
| --- | --- | --- |
| `present-only` | `future-projects: false` | Current Google Maps transit context without the official Future Transit overlay. |
| `present-plus-future` | `future-projects: true` | Current Google Maps transit context plus official planned, funded, or under construction project overlays. |

`present-only` is the default because future layers must stay opt in. Setting the comparison mode updates only the `future-projects` overlay. Toggling `future-projects` directly also updates the comparison mode, so the mode display and existing Future Transit toggle cannot drift apart.

The current Google transit layer remains the native Google Maps `TransitLayer`. The comparison mode does not merge current, visionary, nationalized, or future scenario state.

## Legend Behavior

The layer panel shows the active comparison label next to the active overlay count. The legend repeats the selected mode and, when future context is enabled, shows this service caveat:

> Future service is official planned, funded, or under construction overlay context, not current Google Maps operational service.

Individual legend entries still come from the shared overlay style registry. Official future projects keep their own line colors, patterns, confidence text, and provenance metadata.

## Routing Limitation

VR-104 does not alter route calculation. Google Maps remains the current operational service baseline for routing, and app-owned Future Transit overlays are visual context only. Any future routing comparison that uses planned or hypothetical services must be handled by a separate routing issue with explicit caveats and tests.

## MBR-98 Completed-Network Baseline Snapshot

This is the durable baseline artifact for MBR-98 and the parent rail-gap analysis. It is a comparison inventory, not a routing feature. Candidate rail or freight corridors should be screened against this baseline before any checked-in scenario data is added or promoted.

### Source Boundary

- **Current visible baseline:** the map's default `Current` layer is a Google Maps `TransitLayer`, enabled by default through `CURRENT_TRANSIT_OVERLAY_ID`. Google may render current Metro, Metrolink, Amtrak, busway, and other transit context that is not explicitly represented in VeloRail's checked-in `TRANSIT_LINES` station arrays.
- **Current explicit routing data:** `src/data/transitLines.ts` is VeloRail-owned route/station data used by internal routing and station helpers. It is not a complete public-source snapshot of every Google-visible current service.
- **Official completed-network baseline:** use `present-plus-future`: current Google transit context plus the official Future Transit overlay. This means candidates are compared against projects that are planned, funded, or under construction in VeloRail's official future dataset even when those projects are not available to Google routing today.
- **Scenario overlays:** visionary and passenger-conversion overlays are not official service, but they are part of the MBR-98 audit context because candidate screening should avoid adding freight conversions that merely duplicate an existing VeloRail scenario unless the gap value is clearer than the current scenario.
- **No Google geometry scraping:** Google Maps can render the base/current layer, but VeloRail analysis must cite agency, repo, or scenario provenance for any custom future, freight, or visionary geometry.


### External Source Checkpoints

The baseline inventory is repo-first, but MBR-98 also web-checked the following public pages on 2026-06-06 to avoid treating stale checked-in data as a real network gap:

| Source | Used for | Boundary note |
| --- | --- | --- |
| `https://www.metro.net/riding/how-ride-rail/` | Current Metro A/B/C/D/E/K line names, endpoint descriptions, and station-count context. | Rider page confirms current operations at a summary level only; VeloRail still needs explicit checked-in data or GTFS before using these facts for custom routing. |
| `https://www.metro.net/projects/westside/` | D Line Extension Section 1 open status and continuing construction for Sections 2/3. | Project page supports current/future status separation; geometry remains VeloRail/agency-derived overlay context, not Google-scraped geometry. |
| `https://www.metro.net/projects/sepulvedacorridor/` | Sepulveda Valley-Westside LPA/current planning status. | Official future context only; not current routing service. |
| `https://metrolinktrains.com/about/agency/program-delivery-engineering/programs-projects/score/` | Metrolink SCORE as regional rail capacity context. | SCORE improves existing regional rail corridors; VeloRail does not yet maintain an explicit Metrolink baseline dataset. |

### Current Operational Inventory

| Baseline item | Checked-in representation | Screening note |
| --- | --- | --- |
| Metro B/Red subway: Union Station to North Hollywood | `TRANSIT_LINES.Red` station array. | Treat as a high-capacity north-south/east-west trunk through Hollywood and the southeast Valley when screening parallel freight concepts. |
| Metro D/Purple subway: Union Station to Wilshire/La Cienega | `TRANSIT_LINES.Purple` includes Section 1 stations through Wilshire/La Cienega. | Treat Wilshire to La Cienega as current operational baseline; future sections to Century City/Westwood remain future baseline until checked in as current. |
| Metro A/Blue light rail: Downtown LA to Long Beach in checked-in data | `TRANSIT_LINES.Blue`; legacy name and downtown station list. | Current agency pages describe the A Line as Pomona to Long Beach; checked-in data misses the north/east extension and Regional Connector through-running, so freight concepts near Pasadena/San Gabriel Valley cannot be treated as gaps from this array alone. |
| Metro C/Green light rail: Redondo Beach to Norwalk in checked-in data | `TRANSIT_LINES.Green`; current agency pages now describe C Line as Norwalk to LAX/Metro Transit Center. | Checked-in data is stale for the 2024/2026 C/K reconfiguration; use Google current layer or updated agency sources for operational screening, not only this array. |
| Metro E/Expo light rail: 7th St/Metro Center to Santa Monica in checked-in data | `TRANSIT_LINES.Expo`; does not include the Regional Connector east to East LA. | Checked-in data misses the current East LA-to-Santa Monica through service; do not mistake that omission for a candidate gap. |
| Metro Gold legacy East LA segment | `TRANSIT_LINES.Gold`; legacy standalone Gold/L naming. | Operationally this is now part of the current A/E post-Regional Connector network; use as legacy explicit geometry only. |
| Metro K Line: Expo/Crenshaw to Aviation/Century in checked-in data | `TRANSIT_LINES["K Line"]`. | Checked-in data is stale for the current K/C service pattern and Redondo Beach connection; do not use it alone to call a South Bay corridor a gap. |
| Metrolink and intercity rail | Visible where Google Maps current transit layer renders it; not represented in `TRANSIT_LINES`. | Regional corridors parallel to Metrolink should be marked likely duplicate unless they serve distinct station markets, frequency, or transfer functions not covered by the current/future regional rail context. |

### Official Future / Completed-Network Inventory

These records come from `OFFICIAL_LA_FUTURE_TRANSIT_DATASET` and are the explicit future corridors used by `present-plus-future` comparison.

| Corridor | Status in repo | Completed-network assumption for screening | Likely duplicate checks |
| --- | --- | --- | --- |
| East San Fernando Valley Light Rail Transit | `under_construction`, light rail. | Van Nuys Boulevard corridor from the G Line area toward San Fernando Road/Sylmar becomes served by an official north Valley rail spine. | Freight or rail concepts in the east Valley must show a different market than Van Nuys/San Fernando Road or a better Metrolink/Metro transfer purpose. |
| Southeast Gateway Line | `planned`, light rail. | Slauson/A Line through southeast LA County toward Artesia is treated as a future official southeast corridor. | Randolph/Slauson-adjacent or West Santa Ana Branch-parallel candidates need careful overlap notes and should not be promoted from vague freight evidence. |
| K Line Extension to Torrance | `planned`, light rail. | South Bay/Redondo/Torrance access is part of the completed network. | South Bay freight concepts should identify port, Harbor Gateway, or east-west access not already served by K/C/South Bay assumptions. |
| K Line Northern Extension | `planned`, light rail. | Crenshaw/La Brea/Fairfax/West Hollywood/Hollywood access is part of the completed network. | North-south central LA concepts near La Brea/Fairfax/Crenshaw are likely duplicate unless they reach different job centers or transfer nodes. |
| Sepulveda Transit Corridor Valley-Westside | `planned`, heavy rail. | Van Nuys Metrolink/G Line to E Line Expo/Sepulveda is treated as the official future Sepulveda Pass spine. | Valley-Westside rail proposals paralleling Sepulveda need to be marked duplicate unless they cover a separate branch or missing east-west access. |
| Sepulveda Transit Corridor Westside-LAX | `planned`, unknown mode/long-range. | The completed baseline reserves a future Westside-to-LAX Sepulveda continuation, but with lower confidence than the Board-selected Valley-Westside segment. | LAX/Westside concepts should separate near-term gap value from long-range official overlap. |
| Eastside Transit Corridor Phase 2 | `planned`, light rail. | East LA/Whittier-area extension beyond Atlantic is part of future official context. | Eastside freight or rail concepts should prove a distinct market from Atlantic-to-Whittier/Eastside access. |
| North Hollywood to Pasadena BRT | `under_construction`, BRT. | NoHo-Burbank-Glendale-Pasadena east-west BRT service is part of the completed comparison network. | Rail concepts across the same corridor are duplicate for access unless the recommendation argues rail capacity/speed is the issue rather than coverage. |
| Vermont Transit Corridor BRT | `planned`, BRT. | Vermont north-south BRT is the official near-term baseline while separate heavy-rail ideas remain visionary. | Vermont rail concepts should be treated as upgrade scenarios, not uncovered-corridor gaps. |

### Visionary and Passenger-Conversion Context

| Context layer | Included checked-in records | Baseline treatment |
| --- | --- | --- |
| Visionary concepts | `src/data/visionaryTransitProposals.ts` plus the seed visionary example in `src/data/transitProposals.ts` through the proposal import manifest. | Keep visually and analytically distinct from official future projects. A candidate may overlap a visionary concept, but the duplicate label should say it duplicates a VeloRail/advocacy scenario, not official service. |
| Freight corridor source context | Alameda Corridor, BNSF LA-San Bernardino, Union Pacific LA-Inland Empire, and Pacific Harbor Line records in `src/data/laFreightRailCorridors.ts`. | These are sourced freight records, not passenger service. They can support right-of-way context only. |
| Passenger-conversion scenario context | Generated converted-passenger records from freight corridors with explicit conversion scenarios. | These are hypothetical default-off planning overlays. Screening should distinguish ROW suitability from post-expansion gap value. |

### Duplicate-Service Flags for Candidate Screening

Use these flags before recommending any new rail-gap candidate:

| Flag | Applies when | Default recommendation |
| --- | --- | --- |
| `duplicates-current-metro` | Candidate closely parallels current Metro B/D/A/C/E/K access rendered by Google or explicit `TRANSIT_LINES`. | De-emphasize unless it serves a station market Metro misses or materially improves transfer access. |
| `duplicates-current-metrolink-or-intercity` | Candidate follows an existing regional passenger rail market visible in current Google transit context. | De-emphasize unless the concept is about local infill, frequency, or an all-day urban service not represented by current regional service. |
| `duplicates-official-future` | Candidate overlaps an official future corridor listed above. | Do not add as a new gap; at most classify as an alternative alignment or upgrade study with explicit source support. |
| `duplicates-visionary-or-conversion` | Candidate repeats a VeloRail visionary or passenger-conversion record. | Do not create another overlay record; update the existing record's screening notes if the evidence improves. |
| `clear-gap-study` | Candidate remains useful after current, future, Metrolink/intercity, visionary, and passenger-conversion context are checked. | Keep for MBR-99/MBR-100 recommendation with source confidence and boundary notes. |
| `uncertain-source-boundary` | Candidate depends on vague freight ownership, approximate geometry, or unverified track status. | Keep in research backlog; do not render as passenger conversion. |

### Known Blind Spots in Checked-In Data

- `TRANSIT_LINES` uses legacy line names (`Red`, `Purple`, `Blue`, `Green`, `Gold`, `Expo`) alongside `K Line`, while current agency-facing names are A/B/C/D/E/K. Screening notes must translate legacy names to current labels.
- `TRANSIT_LINES` does not represent Metrolink, Amtrak, municipal busways, all current Google-visible transit services, current GTFS schedules, or service frequency by time of day beyond simple static frequencies.
- `TRANSIT_LINES.Blue` does not include the current A Line's Pomona/San Gabriel Valley side, and `TRANSIT_LINES.Expo` plus `TRANSIT_LINES.Gold` do not model the post-Regional Connector A/E through-running pattern, even though Google/Metro current context does.
- `TRANSIT_LINES.Green` and `TRANSIT_LINES["K Line"]` do not fully reflect the latest C/K/LAX/Redondo service pattern described by current Metro rider pages.
- The official future dataset was reviewed on 2026-05-20 and should be rechecked before facts are changed; the baseline snapshot was web-checked on 2026-06-06 for known operational changes such as D Line Section 1 opening.
- Official future geometries are simplified VeloRail overlay centerlines, not engineering alignments.
- Freight and nationalized rail records are freight/source or hypothetical-conversion context only; they do not prove passenger feasibility, station access, dispatching capacity, public ownership, or environmental clearance.

### Candidate Screening Baseline Summary

For MBR-99 and MBR-100, the completed-network baseline is:

1. Google Maps current transit layer as the visible current-context renderer.
2. VeloRail `TRANSIT_LINES` only where explicit current routing/station data is needed, with the blind spots above.
3. Official Future Transit records listed in this document through `present-plus-future` comparison.
4. Existing visionary and passenger-conversion overlays as separate non-official context to avoid duplicate VeloRail concepts.
5. Metrolink/intercity context where visible in the Google current layer or cited by a candidate source, but not as checked-in VeloRail route data yet.

A new rail-gap candidate should be considered non-redundant only if it still fills a market after all five baseline layers are considered.
