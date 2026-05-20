# Transit Proposal Data Model

VR-001 adds a parallel schema for VeloRail-owned proposal data. It does not replace the current operational `TRANSIT_LINES` model used by routing.

## Location

- Types: `src/types/proposals.ts`
- Example records and Google Maps adapters: `src/data/transitProposals.ts`
- Production LA freight corridor source: `src/data/laFreightRailCorridors.ts`
- Validation helpers: `src/data/transitProposalValidation.ts`
- Import helpers and source manifest: `src/data/transitProposalImport.ts` and `src/data/transitProposalSources.ts`

## Version

The current schema version is `1.0.0`. Versioning lives on `TransitProposalDataset.schemaVersion`, so future import files can be validated before overlay rendering.

## Required Proposal Fields

- `id`: stable machine id.
- `name`: display name.
- `kind`: `line` or `corridor`.
- `status`: one of `operational`, `planned`, `under_construction`, `funded`, `vision`, `concept`, `freight_only`, or `converted_passenger`.
- `mode`: rail, BRT, freight, or unknown mode classification.
- `classification`: one of `official`, `commentary_summary`, `advocacy_derived`, or `speculative`.
- `geometry`: GeoJSON `LineString` using `[lon, lat]` coordinates.
- `provenance`: at least one source attribution with `sourceId`, `title`, and `sourceType`.
- `confidence`: overall confidence plus optional geometry, station, and status confidence.
- `uncertainty`: uncertainty level plus source notes explaining what the sources support and what VeloRail inferred.

## Optional Proposal Fields

- `stations`: station metadata with `id`, `name`, `lat`, `lon`, optional status, role, phase, opening year, existing lines, and confidence.
- `timeline`: opening year, phase, phase order, and schedule notes.
- `style`: stroke, station, legend, and z-index rendering hints.
- `rendering`: layer group, zoom range, and clickability hints.
- `freight`: owner, operator, track usage, electrification, source references, conversion scenarios, and suitability metadata.
- `notes` and `tags`: human context and filtering metadata.

## Freight Corridor Model

VR-401 keeps freight corridors in the proposal dataset instead of adding a second overlay registry. A freight corridor is a proposal record with:

- `kind: corridor`.
- `status: freight_only` for current freight corridors or `converted_passenger` for passenger conversion concepts.
- `mode: freight_rail` for freight-only corridors or `mixed_rail` when the corridor model itself represents shared freight and passenger use.
- `name` as the corridor display name.
- `geometry` as the custom corridor centerline for Google Maps polyline rendering.
- `provenance` with at least one source attribution before rendering custom non-Google rail geometry.
- `freight` metadata with `owner`, `operator`, `trackUsage`, `electrification`, optional source-id references back to `provenance`, optional `conversionScenarios`, and optional `suitability` metadata.

Freight metadata uses `unknown` when ownership, operations, usage, electrification, or suitability is not known from the checked source. The source of that uncertainty still belongs in `provenance` and source-specific notes.

### Conversion Status Fields

The schema supports two freight-related concepts:

- `freight_only`: a corridor currently represented as freight rail. Validation requires freight metadata and rejects `passenger` track usage.
- `converted_passenger`: a hypothetical or planned passenger conversion concept. Conversion concepts must identify a `conversionScenarioId` when represented as proposal records.

Freight corridor records can also include nested `conversionScenarios`. These scenarios are not official passenger lines by themselves; they document reusable assumptions for later VR-405 line generation.

### Data Source Assumptions

Google Maps may show freight rails on the basemap, but VeloRail does not treat basemap visuals as routing-ready custom geometry. Freight corridor records therefore require explicit provenance and should document whether geometry is official, surveyed, approximate, or conceptual. VR-402 should replace seed geometry with a public freight corridor dataset and carry license or terms notes forward.

## Example Records

`TRANSIT_PROPOSAL_DATASET` includes three seed examples:

- Future line: `metro-d-line-extension-westwood`, currently limited to still-future D Line Sections 2 and 3 because Section 1 opened on May 8, 2026. The line starts with a non-station connection anchor at the current Wilshire/La Cienega terminal so the future overlay joins the Google Maps current D Line cleanly.
- Visionary line: `vision-vermont-rapid-rail`
- Freight corridor: `freight-alameda-corridor`

These examples exercise the schema and renderer contract. The Alameda Corridor example includes owner/operator metadata, freight usage, unknown electrification, source-id references, suitability placeholders, and a nested `converted_passenger` scenario. They are not the authoritative future or freight datasets.

VR-105 adds the first bounded official LA-area future transit batch in `src/data/officialFutureTransitProposals.ts`. See `docs/architecture/official-future-transit-dataset.md` for source criteria, included and excluded projects, and the approximation policy.

VR-402 adds the first bounded LA freight corridor batch in `src/data/laFreightRailCorridors.ts`. See `docs/architecture/freight-rail-corridor-dataset.md` for selected public sources, license and terms notes, included corridors, known gaps, and the approximation policy. The seed `freight-alameda-corridor` remains an example record, while the VR-402 source is the production freight batch registered through the import manifest.

## Validation Strategy

`validateTransitProposalRecord` and `validateTransitProposalDataset` return structured issues. The validator explicitly catches:

- Missing geometry with `missing_geometry`.
- Missing provenance with `missing_provenance`.
- Missing status with `missing_status`.
- Missing classification with `missing_classification`.
- Missing uncertainty metadata with `missing_uncertainty`.
- Invalid status values.
- Invalid classification values.
- Invalid future or visionary layer classification boundaries.
- Missing source notes for uncertainty metadata.
- Invalid `LineString` coordinates.
- Invalid station coordinates and station statuses.
- Missing or invalid freight metadata for freight-only, converted-passenger, freight-mode, or freight-layer records.
- Freight metadata source-id references that do not point to a record in `provenance`.
- Invalid conversion scenario status, passenger target mode, assumptions, or suitability score.

`assertValidTransitProposalDataset` throws with path-specific messages and is used to validate the checked-in seed dataset at module load.

## Google Maps Integration

Proposal geometry remains source-format GeoJSON, matching existing route geometry conventions. Adapter helpers convert it when rendering:

- `proposalPathToGoogleLatLng` converts `[lon, lat]` to `{ lat, lng }`.
- `proposalStationsToGoogleMarkers` creates marker-ready station inputs.
- `proposalToGooglePolylineInput` creates polyline path and options.
- `proposalDatasetToGoogleMapInputs` returns proposal, polyline, and marker bundles for overlay work.
- `importTransitProposalDataset` and `importTransitProposalSources` validate source data before returning overlay-ready polyline and marker bundles.

The schema is compatible with Google Maps `Polyline` and marker inputs without introducing another map provider.

## Import Workflow

VR-005 adds a source import pipeline documented in `docs/architecture/transit-proposal-import-pipeline.md`. New source files should declare `schemaVersion: '1.0.0'`, use lowercase kebab-case ids, include provenance before rendering, and register through `TRANSIT_PROPOSAL_SOURCE_FILES` instead of requiring map component edits for each new line.

## Migration Notes

No existing data model is migrated in VR-001. Current routing keeps using `TRANSIT_LINES`, where active service is represented as missing status or `operating`.

When operational route data is converted into proposal data later, map `operating` to proposal status `operational`. Keep existing `Station.lat` and `Station.lon` fields, but store proposal line geometry as `[lon, lat]` so it stays aligned with existing route `LineString` geometry.

Future import work should require provenance for every proposal record before rendering non-Google custom overlays.

## Visionary Classification

VR-201 adds explicit classification and uncertainty metadata for visionary and future proposal records. See `docs/architecture/visionary-transit-classification.md` for category definitions, YouTube/commentary inclusion rules, source-note requirements, UI disclaimers, and the rule that the official future layer stays separate from unofficial visionary scenarios.
