# Official Future Transit Update Workflow

The official Future Transit dataset is a reviewed public-source snapshot, not an automated feed. Maintainers must inspect agency sources, update checked-in records, and run local validation before a changed record can render in the Future Transit overlay.

## Cadence

- Review every official future record at least every 90 days.
- Treat source reviews older than 120 days as stale.
- Refresh immediately when Metro or another public agency announces a status, opening-year, phase, station-list, project-name, or source-URL change.
- Do not promote advocacy, commentary, or speculative concepts into `rendering.layerGroup: 'future'`.

Current metadata lives next to the dataset:

- `OFFICIAL_FUTURE_TRANSIT_REVIEW_POLICY`
- `OFFICIAL_FUTURE_TRANSIT_SOURCE_WATCH_TARGETS`
- `OFFICIAL_FUTURE_TRANSIT_SOURCE_MANIFEST`

## Refresh Command

Run the offline freshness gate before and after any official future dataset change:

```bash
npm run validate:official-future-transit
```

For deterministic review or tests, pin the validation date:

```bash
npm run validate:official-future-transit -- --as-of 2026-05-20
```

This command validates the checked-in dataset, source watch manifest, source review dates, official-only Future Transit boundary, required status/timeline/station review fields, and Google Maps overlay conversion. It does not fetch source pages and does not rewrite data.

## Source Monitor

Use the source monitor to catch changed Metro pages before the quarterly manual review:

```bash
npm run monitor:official-future-transit -- --update-snapshot
npm run monitor:official-future-transit -- --fail-on-change --update-snapshot
```

The monitor fetches every `OFFICIAL_FUTURE_TRANSIT_SOURCE_WATCH_TARGETS` URL plus broad discovery targets in `OFFICIAL_FUTURE_TRANSIT_DISCOVERY_TARGETS`, normalizes page text, stores local fingerprints under `.velorail-monitor/`, and reports changed pages. It does not automatically rewrite `officialFutureTransitProposals.ts`; changed pages still require human review of the official source before updating project facts.

## Source Watch Targets

| Proposal | Source target | Review focus |
| --- | --- | --- |
| `metro-east-san-fernando-valley-lrt` | Metro project page | Construction status, opening year, station count, named station areas, geometry notes. |
| `metro-east-san-fernando-valley-lrt` | Metro construction notice | Active construction status and source URL availability. |
| `metro-southeast-gateway-line` | Metro project page | Design status, completion year, station count, station areas, C Line infill notes. |
| `metro-k-line-extension-torrance` | Metro project page | Approved option, funding status, completion year, station count, terminal station. |
| `metro-k-line-northern-extension` | Metro project page | Planning status, selected LPA, station count, opening range, transfer lines. |
| `metro-sepulveda-transit-corridor-valley-westside` | Metro project page | LPA status, selected Valley-Westside route, phasing, environmental review status. |
| `metro-sepulveda-transit-corridor-valley-westside` | Metro LPA media release | Board action, underground heavy rail mode, transfer connections, major station anchors. |
| `metro-sepulveda-transit-corridor-westside-lax` | Metro Measure M board report | Long-range Westside-LAX segment, opening window, source URL availability. |
| `metro-eastside-transit-corridor-phase-2` | Metro project page | Federal review status, opening-year range, phasing, six planned station areas. |
| `metro-noho-pasadena-brt` | Metro project page | Construction phase, 2028 service target, station count, corridor communities. |
| `metro-vermont-brt` | Metro project page | LPA and NEPA status, 2028 BRT target, transfer anchors, rail-conversion boundary. |

Discovery targets:

| Target | Review focus |
| --- | --- |
| Metro project listing | New official rail, BRT, or transit corridor projects that are not yet in the dataset. |
| LA Metro The Source projects feed | Board actions, milestone announcements, new public review periods, and project-name changes. |

## Human Review Steps

1. Open each URL listed in `OFFICIAL_FUTURE_TRANSIT_SOURCE_WATCH_TARGETS`.
2. Compare the source against the checked-in proposal record:
   - `status`
   - `timeline.openingYear`
   - `timeline.phase`
   - `timeline.scheduleNotes`
   - station names, station count, or representative station anchors
   - source URL and source title
   - `geometry.geometryNotes` and approximation notes
3. Update `src/data/officialFutureTransitProposals.ts` only after the source supports the changed fact.
4. Update `accessedAt`, `lastReviewedAt`, and `nextReviewDue` in the same edit.
5. Keep `confidence` and `uncertainty` honest when official project status is high confidence but station coordinates or line geometry remain approximate.
6. If a project opens for service, retire it from the Future Transit overlay instead of leaving it as an operational future record.

## Adding A Record

1. Add at least one official project, public agency, or public plan source.
2. Add the proposal to `OFFICIAL_LA_FUTURE_TRANSIT_DATASET` with `classification: 'official'` and `rendering.layerGroup: 'future'`.
3. Use only `planned`, `funded`, or `under_construction` for renderable official future records.
4. Include `timeline`, provenance `url`, provenance `accessedAt`, and station records or representative anchors.
5. Add a matching watch target that covers `project_status`, `opening_year`, `station_list`, and `source_url`.
6. Run `npm run validate:official-future-transit` and the focused proposal tests.

## Retiring A Record

Remove or move a record out of the official future source when a project becomes operational, is cancelled, or no longer has official support. The operational route source remains separate from this dataset; do not keep operational service in the Future Transit overlay for historical context.

## Verification

Use focused checks while editing:

```bash
npm run validate:official-future-transit -- --as-of 2026-05-20
npm run monitor:official-future-transit -- --snapshot /tmp/velorail-official-future-sources.json --update-snapshot
npm run test -- tests/transitProposalValidation.test.js tests/transitProposalImport.test.js
```

Before closing an implementation task, run:

```bash
npm run quality
```
