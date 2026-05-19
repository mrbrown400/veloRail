# LA Freight Rail Corridor Dataset

VR-402 adds the first production freight corridor source batch for the Nationalized Rail overlay. The data lives in `src/data/laFreightRailCorridors.ts` and is registered through `TRANSIT_PROPOSAL_SOURCE_FILES`, so the existing import pipeline validates it before Google Maps receives any polylines.

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
- Keep `freight.suitability.rating: unknown` until a later issue defines conversion scoring.

## Known Gaps

- Exact subdivision segmentation, mileposts, track counts, turnouts, yard leads, and dispatching boundaries are not encoded.
- Port terminal rail geometry is schematic and intentionally avoids detailed terminal and customer tracks.
- Electrification is `unknown` because this import did not find a checked official source that can be used as a systemwide electrification inventory for the included records.
- Suitability for passenger conversion is not scored in VR-402.
- Future refresh work should decide whether to derive more precise simplified geometry from FRA NARN or Caltrans GeoJSON through a repeatable script.

## Verification

Useful checks after edits:

- `npm run test -- tests/transitProposalImport.test.js tests/mapOverlayRegistry.test.js`
- `npm run quality`

The import tests assert that the LA freight source validates, every provenance record has an access date and `License/terms:` note, freight source-id references resolve to provenance, and the Nationalized Rail overlay receives the new freight records without map component changes.
