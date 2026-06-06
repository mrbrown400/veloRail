# Rail-Gap Freight Corridor Screening

MBR-99 screens the checked-in LA freight and passenger-conversion candidates against the completed-network baseline before any additional passenger-conversion display work. The goal is to identify corridors that fill non-redundant car-free travel gaps, while keeping freight-only evidence separate from hypothetical passenger-service assumptions.

> Final MBR-100 recommendations are published in `docs/architecture/rail-gap-recommendations.md`. Treat this screening document as the candidate evidence table and the MBR-100 recommendation document as the go/no-go handoff for follow-up implementation work.

## Baseline And Source Policy

The completed-network baseline is `present-plus-future` from `docs/architecture/completed-network-comparison.md`: current Google Maps transit context plus official planned, funded, or under-construction overlays. It does not merge in visionary or nationalized scenarios, and it does not change routing.

Screening inputs:

- Checked-in freight records from `src/data/laFreightRailCorridors.ts` and the generated passenger-conversion review layer from `src/services/freightPassengerConversion.ts`.
- Official future context from `src/data/officialFutureTransitProposals.ts`, especially Southeast Gateway, K Line extensions, Sepulveda, Eastside Phase 2, Vermont BRT, and regional-transfer notes.
- Repo docs for freight provenance, suitability scoring, and completed-network policy.
- External source refresh only where the checked-in source note needed current context:
  - Alameda Corridor Transportation Authority, `https://www.acta.org/`, rechecked 2026-06-05. ACTA describes the corridor as a freight link from the ports to transcontinental railroads and lists 60 miles of track and daily container/train activity.
  - Port of Los Angeles rail page, `https://www.portoflosangeles.org/business/supply-chain/rail`, rechecked 2026-06-05. The port describes the Alameda Corridor as a 20-mile freight expressway and notes BNSF Hobart/Commerce and UP East Los Angeles yards as the main intermodal anchors north of the ports.
  - Metro West Santa Ana/Southeast Gateway release, `https://www.metro.net/about/media-relations/l-a-metro-board-approves-route-for-initial-segment-for-west-santa-ana-branch-project-and-union-station-as-northern-terminus/`, rechecked 2026-06-05. Metro describes the 19.3-mile Southeast Gateway/West Santa Ana Branch project, 12 stations, Southeast LA coverage, and transfers to the C Line, A Line, and regional network.
  - Metro K Line Northern Extension FAQ, `https://www.metro.net/documents/2025/09/frequently-asked-questions.pdf/`, rechecked 2026-06-05. Metro frames K Line North as a north-south regional network-gap project linking C, E, D, and B rail lines and major activity centers.
  - Metro Rail Network Integration Study fact sheet, `https://www.metro.net/documents/2025/01/rail-network-integration-study-english-fact-sheetpdf/`, rechecked 2026-06-05. Metro identifies regional transfer integration focus areas, including Van Nuys, Burbank, and Norwalk/Santa Fe Springs with C Line Norwalk.
  - Pacific Harbor Line company profile, `https://www.anacostia.com/our-companies/phl/`, rechecked 2026-06-05. It supports PHL's port terminal railroad role, not passenger service.

Google Maps remains a renderer and current transit context only. This screen does not use Google basemap linework, satellite imagery, or map labels as evidence for rail geometry, ownership, operations, or station feasibility.

## Scoring Rubric

Scores use a 1-5 screen for each dimension. A higher score means better passenger-conversion value except for implementation uncertainty, where a higher score means lower uncertainty. The scores are qualitative triage and are not feasibility, ridership, cost, environmental, or operations findings.

| Dimension | 1 | 3 | 5 |
| --- | --- | --- | --- |
| Redundancy | Mostly duplicates completed-network rail/BRT | Partly overlaps, partly unique | Serves a clearly uncovered travel market |
| Market served | Narrow freight/industrial market | Some residential/job anchors | Multiple underserved residential/job/activity anchors |
| Transfer value | Few plausible passenger transfers | One useful transfer or terminal | Multiple strong transfer interfaces |
| Station plausibility | Yard/industrial access only | A few possible stations but unresolved access | Clear station anchors or existing passenger stops |
| Bike/walk access | Poor walkshed/bikeway conditions likely | Mixed access | Strong low-car first/last-mile fit |
| Implementation certainty | Severe freight/capacity/governance barriers | Major unresolved barriers | Comparatively plausible reuse path |
| Provenance confidence | Weak or segment-ambiguous source basis | Official freight source but passenger assumptions weak | Strong source basis for the screened fact pattern |

## Candidate Buckets

### Clear gap

These corridors appear to address a completed-network gap, but they still need the passenger-conversion caveats shown in the recommendations.

| Candidate | Scores | Completed-network overlap note | Source/provenance note | Recommendation |
| --- | --- | --- | --- | --- |
| Alameda Corridor / South Alameda passenger-conversion concept (`la-freight-alameda-corridor` -> `alameda-corridor-south-alameda-passenger-conversion`) | Redundancy 4; market 3; transfer 3; station plausibility 2; bike/walk 2; implementation certainty 1; provenance 4. Existing VR-406 heuristic: about 69/100, medium. | Non-redundant as a San Pedro Bay / South Alameda / downtown freight-right-of-way gap because the completed future network does not provide a direct passenger rail spine from the port complex or Wilmington/Carson industrial edge to downtown. It overlaps conceptually with Southeast Gateway's Southeast LA access goals, K Line South Bay access, K Line North's north-south gap closure, and Vermont BRT's South LA spine, so it should not be presented as broadly solving South LA mobility by itself. | Freight facts are strong: ACTA and the Port of Los Angeles support a dedicated freight expressway between the ports and downtown rail yards, and the checked-in record cites ACTA, the Port of LA, FRA NARN, and Caltrans. Passenger facts are weak: the South Alameda station and downtown interface are VeloRail assumptions only, not approved Metro, Metrolink, railroad, or port service. | Keep as the only current `clear gap` candidate, but show it as a high-friction gap-study corridor: default-off, dashed, explicitly labeled freight ROW / hypothetical passenger conversion, and never as approved service. Promote only if a follow-up adds station-access, freight-conflict, and equity/access evidence. |

### Likely redundant

These corridors score well as rail rights-of-way but mostly duplicate completed-network or existing regional rail markets.

| Candidate | Scores | Completed-network overlap note | Source/provenance note | Recommendation |
| --- | --- | --- | --- | --- |
| BNSF Los Angeles to San Bernardino passenger-conversion concept (`la-freight-bnsf-los-angeles-san-bernardino` -> `bnsf-la-san-bernardino-passenger-conversion`) | Redundancy 1; market 3; transfer 4; station plausibility 3; bike/walk 3; implementation certainty 2; provenance 4. Existing VR-406 heuristic: about 75/100, high, because it has a long continuous ROW and station assumptions. | Likely redundant because LA-to-Inland-Empire passenger markets are already represented by Metrolink San Bernardino, Riverside, 91/Perris Valley, Orange County, and Inland Empire-Orange County services in the current Google/Metrolink context, with future transfer improvements focused on integration rather than another parallel freight conversion. It may still have value as an intermodal-transfer or reliability study, but not as a new passenger-conversion line in the map layer. | Freight facts are supported by BNSF facility/network references and Caltrans rail network data in the checked-in record. Passenger-service assumptions are generated VeloRail review assumptions and do not establish approved service. | De-emphasize or hide from the default passenger-conversion overlay. If shown, place it in a `redundant / existing regional rail market` subcategory with a tooltip explaining that high ROW suitability is not the same as gap value. |
| Union Pacific Los Angeles to Inland Empire passenger-conversion concept (`la-freight-union-pacific-los-angeles-inland-empire` -> `up-la-inland-empire-passenger-conversion`) | Redundancy 1; market 3; transfer 3; station plausibility 3; bike/walk 2; implementation certainty 1; provenance 4. Existing VR-406 heuristic: about 75/100, high, because it has long continuous ROW and station assumptions. | Likely redundant because the LA-to-Riverside/Inland Empire travel market is already covered by Metrolink Riverside and overlapping regional rail service patterns in the current transit baseline, while future-network work emphasizes transfer integration. It does not fill a new LA County car-free gap after the completed network is considered. | Freight facts are supported by Union Pacific and FRA/Caltrans sources in the checked-in record. Passenger conversion remains hypothetical and likely faces high freight dispatching/governance uncertainty. | De-emphasize in passenger-conversion display. Retain as freight context and as a possible future operations/reliability study only if new evidence shows unique service to unserved station markets, such as a sourced Ontario/Pomona/San Gabriel Valley access concept. |

### Needs more evidence

These records should remain freight context or research prompts until segment-level sources show a passenger gap and plausible access points.

| Candidate | Scores | Completed-network overlap note | Source/provenance note | Recommendation |
| --- | --- | --- | --- | --- |
| Pacific Harbor Line San Pedro Bay Port Rail Complex (`la-freight-pacific-harbor-line-port-complex`) | Redundancy 3; market 1; transfer 1; station plausibility 1; bike/walk 1; implementation certainty 1; provenance 4. Existing VR-406 heuristic: about 40/100, low. | It marks an uncovered port-terminal geography, but the checked-in shape is terminal/switching trackage rather than a passenger travel corridor. The completed network still lacks San Pedro Bay passenger rail, yet PHL yard/terminal tracks are not enough to define a useful passenger line. | Freight facts are supported by PHL, Port of LA, UP short-line, and Caltrans references. No checked source supports passenger conversion, and the current dataset intentionally has no conversion scenario for this record. | Keep freight-only and do not generate a passenger-conversion line. Display as low-contrast freight context when the freight overlay is enabled; omit from passenger-conversion unless a later source-backed San Pedro/Wilmington/Long Beach access concept is separated from terminal switching tracks. |
| Randolph Street / Slauson-adjacent feedback corridor | Redundancy 2; market 3; transfer 3; station plausibility 2; bike/walk 3; implementation certainty 1; provenance 1. No VR-406 score because it is not a checked-in corridor record. | Potentially interesting because it may touch South LA east-west markets and transfer opportunities near A Line/Southeast Gateway/Vermont corridors, but it is also near planned Southeast Gateway and existing bus/rail spines. Without segment-level geometry and ownership evidence, VeloRail cannot tell whether it fills a unique gap or duplicates the completed network. | The freight dataset notes Randolph Street as a feedback candidate that was not rendered because current source records are too regional to distinguish it safely from surrounding BNSF/UP trackage. | Keep as a research backlog item only. Do not render as passenger conversion until a source pass identifies ownership, active/abandoned status, safe station anchors, and completed-network overlap. |

## Display Recommendations

1. Split passenger-conversion candidates by review bucket instead of using a single visual priority. Suggested groups: `Clear gap study`, `Redundant / de-emphasized`, and `Needs evidence / freight context only`.
2. Default the `likely redundant` group off, even when the passenger-conversion overlay is enabled. Users can still inspect the freight ROW, but the map should not imply that every long freight corridor is a high-value passenger gap.
3. Use lower opacity, thinner stroke, and a `parallel to existing regional rail` tooltip for BNSF and UP Inland Empire candidates. Their VR-406 suitability scores are ROW-quality triage, not gap-value scores.
4. Keep Pacific Harbor Line freight-only unless a separate passenger-access concept is sourced. Do not let terminal switching tracks inherit passenger-conversion styling.
5. For the Alameda/South Alameda clear-gap candidate, require metadata that lists both facts side by side: `freight fact: ACTA/Port freight corridor` and `passenger assumption: VeloRail hypothetical station/service concept`.
6. Future scoring should add an explicit `gapValue` or `completedNetworkOverlap` field separate from `freight.suitability.score`, so long continuous freight corridors do not outrank smaller corridors that fill a real post-expansion gap.

## Follow-Up Implementation Candidates

- Add a `completedNetworkOverlap` review note to generated passenger-conversion candidates, populated from this document until a structured schema exists.
- Add a display filter or style rule that reduces prominence for `likely redundant` candidates in the passenger-conversion overlay.
- Source-pass Randolph Street only if MBR-100 chooses it as a follow-up; do not render it from current regional freight records.
