# LA Freight Rail Corridor Dataset

VR-402 adds the first production freight corridor source batch for the Nationalized Rail overlay. VR-404 and VR-405 extend that batch with a default-off hypothetical passenger-conversion planning layer. The source freight data lives in `src/data/laFreightRailCorridors.ts`; generated passenger records are created by `src/services/freightPassengerConversion.ts` and registered through `TRANSIT_PROPOSAL_SOURCE_FILES`, so the existing import pipeline validates everything before Google Maps receives any polylines.

## Scope

The first batch is intentionally bounded to LA basin freight corridors that are useful overlay inputs and have enough public source support to draw simplified linework:

- Public agency or freight-owner evidence identifies the corridor, operator, terminal role, or rail network connection.
- Public GIS or agency data supports the existence of freight rail alignment in the region.
- The current `TransitProposal` freight model can represent the record without changing the Google Maps renderer.
- Geometry can be represented as approximate `[lon, lat]` `LineString` coordinates with explicit uncertainty notes.

Records are excluded when the source evidence only supports a passenger concept, a historical or abandoned right-of-way, a detailed yard layout without public source terms, or a corridor that would require a new renderer or routing model.

## Included Records

| Record | Owner/operator metadata | Source basis | Geometry policy |
| --- | --- | --- | --- |
| `la-freight-alameda-corridor` | Owner: Alameda Corridor Transportation Authority. Operator: BNSF Railway / Union Pacific Railroad. | ACTA overview, Port of Los Angeles rail page, FRA NARN. | Approximate San Pedro Bay to downtown centerline, not ACTA engineering geometry. |
| `la-freight-bnsf-los-angeles-san-bernardino` | Owner/operator: BNSF Railway. | BNSF facility listings, BNSF network maps, Caltrans California Rail Network. | Approximate regional centerline from Hobart/Commerce toward San Bernardino. |
| `la-freight-union-pacific-los-angeles-inland-empire` | Owner/operator: Union Pacific Railroad. | UP California guide, UP system map, FRA NARN. | Approximate east-west LA basin to Inland Empire corridor. |
| `la-freight-pacific-harbor-line-port-complex` | Owner: port rail infrastructure owners. Operator: Pacific Harbor Line. | PHL company profile, UP PHL short-line page, Port of Los Angeles rail page. | Schematic port-terminal loop; it abstracts detailed yard and terminal tracks. |

The existing `freight-alameda-corridor` seed remains in `src/data/transitProposals.ts` for schema examples. VR-402 does not edit the seed file because the production batch is a separate source file and must keep source registration decoupled from map components.

## Passenger Conversion Layer

The layer panel places the Nationalized Rail work with the other scenario controls as `Passenger Conversion`. Its accessible label and hover text use this disclaimer wording: "Hypothetical passenger-conversion planning over sourced freight corridors; not approved service." The overlay remains independent from Future Transit and Visionary Concepts and is off by default.

The conversion model is deterministic and intentionally simple:

- Freight records stay `status: freight_only` and `rendering.layerGroup: freight`.
- Selected freight records carry nested `freight.conversionScenarios` with `stationAssumptions`, `assumptions`, and `sourceFreightCorridorId`.
- `createFreightPassengerConversionDataset()` emits separate `status: converted_passenger`, `classification: speculative`, `rendering.layerGroup: converted_passenger` line records.
- Converted records inherit source freight geometry, owner, operator, electrification, provenance links, and VR-406 suitability scores.
- Converted records add an `internal_example` provenance source that explains the generation step and repeats that source documents support freight corridors only.

Generated records in the current batch:

| Converted record | Source corridor | Station assumptions |
| --- | --- | --- |
| `alameda-corridor-south-alameda-passenger-conversion` | `la-freight-alameda-corridor` | San Pedro Bay terminal, South Alameda/Slauson placeholder, downtown rail yards interface. |
| `bnsf-la-san-bernardino-passenger-conversion` | `la-freight-bnsf-los-angeles-san-bernardino` | Hobart/Commerce terminal, intermediate transfer placeholder, San Bernardino freight gateway. |
| `up-la-inland-empire-passenger-conversion` | `la-freight-union-pacific-los-angeles-inland-empire` | LA River rail yards, San Gabriel Valley interface, Inland Empire gateway. |

Pacific Harbor Line remains freight context only because the current source batch supports terminal/switching freight use and explicitly does not support passenger conversion.

## Feedback Candidates

User feedback called out existing track or right-of-way around South Alameda Street and Randolph Street. The current checked-in data supports a South Alameda planning placeholder through the sourced Alameda Corridor record, so VR-404/VR-405 generates the `alameda-corridor-south-alameda-passenger-conversion` record from that source corridor.

Randolph Street remains documented as a candidate to investigate, but it is not rendered as its own line in this batch. The current source records are regional freight corridors and do not yet provide enough segment-level, source-linked data to distinguish a Randolph Street corridor from surrounding BNSF/UP regional trackage without risking an unsupported passenger-service implication.

## Suitability Scoring

VR-406 adds `src/services/freightCorridorSuitability.ts`, a deterministic heuristic scoring pass applied before the default manifest imports freight records. The score is stored in `freight.suitability.score` with `rating`, factors, method, missing-data notes, and `suitabilityNotes`.

The current method is `vr-406-transparent-heuristic-v1`. It weights right-of-way continuity, regional reach, station potential, passenger conversion evidence, freight conflict risk, and electrification readiness. Missing demand, employment, freight-volume, dispatching, grade-crossing, and capital-cost data is recorded explicitly and prevents the score from being treated as feasibility analysis.

## Candidate Route Generation

VR-500 adds `src/services/freightRouteCandidates.ts`, which builds a simple corridor graph from endpoints and midpoints, then emits deterministic review candidates from corridors with conversion scenarios. Candidates are export/review data with `reviewStatus: needs_review`; they are not official service records and are not automatically added to the map as approved routes.

The review workflow requires checking freight ownership, dispatching, passenger access, grade crossings, and capital constraints before any generated candidate can become a maintained overlay scenario.

VR-501 and VR-502 extend each candidate with two additional review signals:

- `populationDensityScore` from `src/services/populationDensityScoring.ts`
- `bikeAccessScore` from `src/services/bikeRailScoring.ts`

Population scoring uses `vr-501-market-anchor-heuristic-v1`, an approximate market-anchor screen over broad LA areas such as Central LA, South LA, San Gabriel Valley, Inland Empire gateways, and San Pedro Bay. The documented follow-up source options are U.S. Census ACS tract density and SCAG employment or activity-center data. These source options are not bundled in this pass, so candidate output records missing Census tract population, employment density, walkshed population, equity priority areas, and observed ridership.

Bike-rail scoring uses `vr-502-bike-rail-access-heuristic-v1`, an offline station-spacing and urban-anchor heuristic. It does not make live Google Bicycling or Directions calls in deterministic tests. Future reviewed refreshes may use Google Maps Bicycling, local low-stress bike-network data, station bike parking, segment-level elevation, and safety inputs.

## Initial LA Nationalized Scenario

VR-407 adds `src/data/laNationalizedRailScenario.ts` to package the first bounded scenario. It includes the generated Alameda Corridor, BNSF LA to San Bernardino, and Union Pacific LA to Inland Empire converted-passenger records, and excludes Pacific Harbor Line as freight context only.

## Source Watch List

Each source record includes `accessedAt: 2026-05-19` and a `License/terms:` note. Re-check these sources before refreshing ownership, operators, line names, or geometry:

- Alameda Corridor Transportation Authority: https://www.acta.org/
- Port of Los Angeles rail supply chain page: https://portoflosangeles.org/business/supply-chain/rail
- FRA North American Rail Network Lines: https://catalog.data.gov/dataset/north-american-rail-network-lines-24470
- Caltrans California Rail Network ArcGIS layer: https://caltrans-gis.dot.ca.gov/arcgis/rest/services/chrailroad/california_rail_network/MapServer/0
- BNSF facility listings: https://bnsf.com/ship-with-bnsf/support-services/facility-listings.page
- BNSF rail network maps: https://bnsf.com/ship-with-bnsf/maps-and-shipping-locations/rail-network-maps.page
- Union Pacific in California guide: https://www.up.com/content/dam/upcom/corp-comm/documents/us-guide/pdf-california--usguide.pdf
- Union Pacific system map: https://www.up.com/content/upcom/us/en/about-us/maps.html
- Pacific Harbor Line company profile: https://www.anacostia.com/our-companies/phl/
- Union Pacific PHL short-line profile: https://www.up.com/shipping/short-line/lines/phl

## Source And License Notes

FRA NARN is the cleanest reusable public-data source found in this pass because data.gov lists it with a U.S. public domain label. The checked-in dataset still does not copy full NARN geometry. It stores VeloRail-simplified linework and cites NARN as supporting ownership, trackage-rights, and network reference data.

Caltrans California Rail Network is useful because the ArcGIS layer describes passenger and freight railroad alignment statewide and exposes fields such as `ROW_OWNER`, `FREIGHT_OP`, and `SUBDIVISIO`. The service page has blank copyright text, so VR-402 uses it as public agency reference metadata and keeps geometry approximate.

Freight-owner and port pages are cited for corridor identity, terminal role, route miles, facility anchors, and operator/owner evidence. Their public web pages are not treated as open GIS linework. Notes explicitly say that VeloRail is citing facts and not copying proprietary map artwork.

Google Maps is only the renderer. Do not use the Google basemap as evidence for rail ownership, operations, line names, or corridor geometry.

## Approximation Policy

All VR-402 records use `geometrySource: 'approximate'`. Approximate geometry must follow these rules:

- Store checked-in linework as GeoJSON `[lon, lat]` coordinates.
- Keep `geometryNotes` specific about which corridor is approximated.
- Keep `confidence.geometry` lower than `confidence.status` when sources support the corridor but not exact checked-in geometry.
- Use `freight.trackUsage: mixed` when public context supports freight corridors that also carry passenger service.
- Keep suitability scores tied to the documented heuristic and update `missingData` when better source inputs are added.

## Known Gaps

- Exact subdivision segmentation, mileposts, track counts, turnouts, yard leads, and dispatching boundaries are not encoded.
- Port terminal rail geometry is schematic and intentionally avoids detailed terminal and customer tracks.
- Electrification is `unknown` because this import did not find a checked official source that can be used as a systemwide electrification inventory for the included records.
- Suitability for passenger conversion is a transparent triage score only. It does not model demand, operations, cost, or public approval.
- Generated station records are assumptions for overlay rendering and metadata. They are not official station plans.
- Randolph Street needs a future source pass before it can become a separate rendered corridor.
- Future refresh work should decide whether to derive more precise simplified geometry from FRA NARN or Caltrans GeoJSON through a repeatable script.

## Verification

Useful checks after edits:

- `npm run test -- tests/transitProposalImport.test.js tests/mapOverlayRegistry.test.js`
- `npm run quality`

The import tests assert that the LA freight source validates, every provenance record has an access date and `License/terms:` note, freight source-id references resolve to provenance, converted passenger records link back to source corridors, and the Nationalized Rail overlay receives both freight and passenger-conversion records without a second map renderer.
