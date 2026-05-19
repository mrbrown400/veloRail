# Official Future Transit Dataset

VR-105 adds the first bounded production batch for the Future Transit overlay. The data lives in `src/data/officialFutureTransitProposals.ts` and is registered through `TRANSIT_PROPOSAL_SOURCE_FILES` so the existing import pipeline validates it before Google Maps receives polylines or station markers.

## Scope

The first batch is intentionally small and LA-area focused. Records are included when all of these are true:

- The project is listed by Metro or another public agency as an official planned, funded, or under-construction transit project.
- The project has enough public corridor, station, or endpoint information to draw a simplified Google Maps overlay.
- The record can be represented with the current `TransitProposal` schema without changing routing behavior or the Google Maps renderer.
- The project adds useful Future Transit coverage beyond the D Line seed record.

Records are excluded from this batch when any of these are true:

- The project is an advocacy, commentary, or speculative concept rather than an agency project.
- The available source only supports a long-range rail conversion concept without a near-term official project record.
- The project requires a schema, renderer, or route-planner change outside VR-105.
- The project is already operational.

## Included Projects

| Record | Status | Source basis | Geometry policy |
| --- | --- | --- | --- |
| `metro-east-san-fernando-valley-lrt` | `under_construction` | Metro project page and Metro construction notice | Approximate Van Nuys Boulevard centerline and representative station areas. |
| `metro-southeast-gateway-line` | `planned` | Metro project page and FEIS/EIR status summary | Approximate corridor from Slauson/A Line to Artesia using published station areas. |
| `metro-k-line-extension-torrance` | `planned` | Metro project page and certified Final EIR/Hawthorne Option summary | Approximate Hawthorne Option path from Redondo Beach (Marine) to Torrance Transit Center. |
| `metro-eastside-transit-corridor-phase-2` | `planned` | Metro project page with station list and phasing | Approximate E Line extension through the named station areas. |
| `metro-noho-pasadena-brt` | `under_construction` | Metro project page and construction resources | Approximate east-west BRT corridor with representative community anchors. |
| `metro-vermont-brt` | `planned` | Metro project page and timeline | Approximate Vermont Avenue BRT corridor with major transfer anchors. |

The existing `metro-d-line-extension-westwood` seed remains in the base proposal source. It still validates as an official future record, but VR-105 does not treat it as the new batch.

## Source Watch List

Each source record includes `accessedAt: 2026-05-19`. `veloRail-d29c` adds `OFFICIAL_FUTURE_TRANSIT_REVIEW_POLICY`, `OFFICIAL_FUTURE_TRANSIT_SOURCE_WATCH_TARGETS`, and `OFFICIAL_FUTURE_TRANSIT_SOURCE_MANIFEST` so freshness metadata is visible in code review. The current policy is quarterly review, next due `2026-08-17`, stale after 120 days.

- East San Fernando Valley Light Rail Transit: https://www.metro.net/projects/east-sfv/
- ESFV construction notice coverage: https://thesource.metro.net/upcoming-directional-closures-on-van-nuys-boulevard-for-work-on-east-san-fernando-valley-light-rail-project/
- Southeast Gateway Line: https://www.metro.net/projects/southeastgateway/
- K Line Extension to Torrance: https://www.metro.net/projects/green-line-extension/
- Eastside Transit Corridor Phase 2: https://www.metro.net/projects/eastside_phase2/
- North Hollywood to Pasadena Bus Rapid Transit: https://www.metro.net/projects/noho-pasadena-corridor/
- Vermont Transit Corridor: https://www.metro.net/projects/vermont-corridor/

The watch target manifest records which source supports project status, opening year, station-list, source-URL, and geometry-note drift checks. It is intentionally offline: maintainers inspect the public sources and update checked-in facts after review.

## Approximation Policy

Google Maps is the renderer, not the source of truth for custom future transit geometry. VR-105 geometry is `geometrySource: 'approximate'` unless a source provides an explicit agency geometry product that can be represented directly.

Approximate geometry must follow these rules:

- Use `[lon, lat]` GeoJSON coordinates in the checked-in dataset.
- Keep `geometryNotes` explicit about what was approximated.
- Use `confidence.geometry` and `confidence.stations` to distinguish official project status from approximate coordinates.
- Use station `notes` when a marker represents a station area, transfer anchor, or partial station list.
- Keep official BRT records separate from speculative rail conversion concepts even when the corridor overlaps.

## Update Workflow

The repeatable workflow is documented in `docs/architecture/official-future-transit-update-workflow.md`.

- Re-check every source in `OFFICIAL_FUTURE_TRANSIT_SOURCE_WATCH_TARGETS`.
- Update `accessedAt`, status, opening years, station names, and approximation notes in `officialFutureTransitProposals.ts`.
- Run `npm run validate:official-future-transit` to catch stale review metadata, missing source URLs, unsupported Future Transit statuses, missing timeline fields, and incomplete source watch coverage.
- Run `npm run test -- tests/transitProposalValidation.test.js tests/transitProposalImport.test.js` or `npm run quality`.
- Do not move an unofficial concept into `rendering.layerGroup: 'future'`; the validator and overlay registry expect Future Transit to stay official-only.
