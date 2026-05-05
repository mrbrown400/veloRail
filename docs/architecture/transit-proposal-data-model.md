# Transit Proposal Data Model

VR-001 adds a parallel schema for VeloRail-owned proposal data. It does not replace the current operational `TRANSIT_LINES` model used by routing.

## Location

- Types: `src/types/proposals.ts`
- Example records and Google Maps adapters: `src/data/transitProposals.ts`
- Validation helpers: `src/data/transitProposalValidation.ts`

## Version

The current schema version is `1.0.0`. Versioning lives on `TransitProposalDataset.schemaVersion`, so future import files can be validated before overlay rendering.

## Required Proposal Fields

- `id`: stable machine id.
- `name`: display name.
- `kind`: `line` or `corridor`.
- `status`: one of `operational`, `planned`, `under_construction`, `funded`, `vision`, `concept`, `freight_only`, or `converted_passenger`.
- `mode`: rail, BRT, freight, or unknown mode classification.
- `geometry`: GeoJSON `LineString` using `[lon, lat]` coordinates.
- `provenance`: at least one source attribution with `sourceId`, `title`, and `sourceType`.
- `confidence`: overall confidence plus optional geometry, station, and status confidence.

## Optional Proposal Fields

- `stations`: station metadata with `id`, `name`, `lat`, `lon`, optional status, role, phase, opening year, existing lines, and confidence.
- `timeline`: opening year, phase, phase order, and schedule notes.
- `style`: stroke, station, legend, and z-index rendering hints.
- `rendering`: layer group, zoom range, and clickability hints.
- `freight`: owner, operator, track usage, electrification, conversion scenario id, and suitability notes.
- `notes` and `tags`: human context and filtering metadata.

## Example Records

`TRANSIT_PROPOSAL_DATASET` includes three seed examples:

- Future line: `metro-d-line-extension-westwood`
- Visionary line: `vision-vermont-rapid-rail`
- Freight corridor: `freight-alameda-corridor`

These examples exercise the schema and renderer contract. They are not the authoritative future or freight datasets. VR-105 and VR-402 should replace approximate geometry with sourced production data.

## Validation Strategy

`validateTransitProposalRecord` and `validateTransitProposalDataset` return structured issues. The validator explicitly catches:

- Missing geometry with `missing_geometry`.
- Missing provenance with `missing_provenance`.
- Missing status with `missing_status`.
- Invalid status values.
- Invalid `LineString` coordinates.
- Invalid station coordinates and station statuses.

`assertValidTransitProposalDataset` throws with path-specific messages and is used to validate the checked-in seed dataset at module load.

## Google Maps Integration

Proposal geometry remains source-format GeoJSON, matching existing route geometry conventions. Adapter helpers convert it when rendering:

- `proposalPathToGoogleLatLng` converts `[lon, lat]` to `{ lat, lng }`.
- `proposalStationsToGoogleMarkers` creates marker-ready station inputs.
- `proposalToGooglePolylineInput` creates polyline path and options.
- `proposalDatasetToGoogleMapInputs` returns proposal, polyline, and marker bundles for overlay work.

The schema is compatible with Google Maps `Polyline` and marker inputs without introducing another map provider.

## Migration Notes

No existing data model is migrated in VR-001. Current routing keeps using `TRANSIT_LINES`, where active service is represented as missing status or `operating`.

When operational route data is converted into proposal data later, map `operating` to proposal status `operational`. Keep existing `Station.lat` and `Station.lon` fields, but store proposal line geometry as `[lon, lat]` so it stays aligned with existing route `LineString` geometry.

Future import work should require provenance for every proposal record before rendering non-Google custom overlays.
