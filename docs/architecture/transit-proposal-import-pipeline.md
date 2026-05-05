# Transit Proposal Import Pipeline

VR-005 adds a data import path for VeloRail-owned transit proposals. The importer keeps source data separate from map components: source files validate into `TransitProposalDataset` records, then convert to Google Maps-ready polyline and marker inputs.

## Files

- Import helpers: `src/data/transitProposalImport.ts`
- Default source manifest: `src/data/transitProposalSources.ts`
- Shared schema and examples: `src/data/transitProposals.ts`
- Shared validator: `src/data/transitProposalValidation.ts`

## Source Format

Each proposal source file should export a dataset shaped like `TransitProposalDataset`:

```ts
{
  schemaVersion: '1.0.0',
  updatedAt: 'YYYY-MM-DD',
  migrationNotes: ['optional context'],
  proposals: [/* TransitProposal records */]
}
```

The importer accepts `unknown` input so source files fail at the validation boundary instead of silently entering the renderer. `schemaVersion` must match the current `TRANSIT_PROPOSAL_SCHEMA_VERSION`.

## Validation Rules

The pipeline fails fast before overlay conversion. Validation checks include:

- Dataset version and `updatedAt` date format.
- Unique proposal ids across the merged import.
- Lowercase kebab-case proposal, station, and source ids.
- Supported proposal status, kind, mode, confidence, and source type values.
- GeoJSON `LineString` geometry with at least two `[lon, lat]` coordinates.
- Longitude between -180 and 180, latitude between -90 and 90.
- At least one provenance record per proposal.
- Unique station ids within each proposal.

Validation errors are path-specific so source maintainers can find the bad field quickly.

## Provenance Requirements

Every proposal requires at least one provenance entry with:

- `sourceId`: stable lowercase kebab-case id.
- `title`: human-readable source title.
- `sourceType`: one of the supported proposal source types.

Use `publisher`, `url`, `accessedAt`, and `note` whenever available. If geometry is approximate or conceptual, set `geometry.geometrySource` and `geometry.geometryNotes` so future overlays can disclose uncertainty.

## Overlay Output

`importTransitProposalDataset(source, { sourceName })` returns:

- `dataset`: the validated typed dataset.
- `overlays`: records containing the original proposal, a Google Maps polyline input, and station marker inputs.

`importTransitProposalSources(sourceFiles)` validates each source file, merges records, validates the combined dataset for duplicate ids, and then emits the same overlay-ready output.

## Adding A New Proposal Source

1. Add a new source file that exports a `TransitProposalDataset` with `schemaVersion: '1.0.0'`.
2. Keep geometry in `[lon, lat]` order, not Google Maps `{ lat, lng }` order.
3. Add source/provenance fields before adding the proposal to the manifest.
4. Register the source in `TRANSIT_PROPOSAL_SOURCE_FILES`.
5. Run `npm run quality`.

Map components should consume imported overlay output instead of importing individual proposal records. Adding another line or corridor should require a source file and manifest update, not changes to core map rendering code.
