# Visionary Proposal Registry

VR-202/VR-203 moves maintained visionary concepts into `src/data/visionaryTransitProposals.ts`. This keeps unofficial scenarios separate from official future transit records while still using the shared proposal schema, import pipeline, and Google Maps overlay renderer.

## Source File

- Registry module: `src/data/visionaryTransitProposals.ts`
- Default manifest registration: `src/data/transitProposalSources.ts`
- Direct validator: `validateVisionaryTransitProposalDataset`
- Overlay layer group: `visionary`

The registry currently includes `vision-la-river-rail`, a speculative VeloRail-authored example with conceptual geometry, station anchors, provenance, uncertainty metadata, editorial notes, and a source-linking policy.

## Contribution Rules

New registry records must:

- Use `classification: 'commentary_summary'`, `advocacy_derived`, or `speculative`.
- Use `status: 'vision'` or `concept`.
- Render through `rendering.layerGroup: 'visionary'`.
- Include `uncertainty.level`, `uncertainty.sourceNotes`, and a user-facing disclaimer.
- Include `confidence` metadata for overall confidence and any known geometry, station, or status confidence.
- Include `notes` with editorial guidance for how the concept should be described.
- Use `geometry.geometrySource: 'conceptual'` or `approximate`.
- Keep official planned, funded, under-construction, and operational records in official datasets.

Commentary summaries need a `commentary` provenance source. Advocacy-derived concepts need an `advocacy` provenance source. Speculative VeloRail-authored scenarios may use `internal_example` and should avoid external-source language that implies public adoption.

## Uncertainty Representation

Use uncertainty fields to separate sourced facts from VeloRail assumptions:

- `uncertainty.level`: choose `medium`, `high`, or `unknown` for most unofficial concepts. Use `low` only when source material clearly constrains the idea. Do not use `none`.
- `uncertainty.sourceNotes`: state what the source actually supports.
- `uncertainty.assumptions`: list station, alignment, mode, or service assumptions added by VeloRail.
- `uncertainty.disclaimer`: include speculative language suitable for metadata panels.

Recommended disclaimer pattern:

`Unofficial scenario. Not an approved agency project, funded project, or Google Maps transit route.`

## Source-Linking Policy

Source links must point to the record that justifies the concept, not to a basemap or convenience reference. Valid source categories are:

- `commentary`: video, article, podcast, or creator page explaining the idea.
- `advocacy`: advocacy map, campaign page, planning essay, or petition.
- `internal_example`: VeloRail-authored scenario with no external proponent.
- `other`: another non-official source that clearly explains the concept.

Do not cite Google Maps or Google Maps screenshots as evidence for custom visionary geometry. Google Maps is the renderer only. If a public agency source supports a real planned or funded project, the record belongs in the official future dataset instead of the visionary registry.

For rough geometry, provenance notes should say what was copied from the source and what VeloRail simplified, inferred, or invented for display.

## Overlay Behavior

The registry is imported through `TRANSIT_PROPOSAL_SOURCE_FILES`, converted by `importTransitProposalSources`, and filtered by `getProposalOverlayInputsByGroup('visionary')`. The Vision overlay toggle is independent from Future Transit, so turning on visionary concepts does not reveal official future projects and turning on Future Transit does not reveal unofficial scenarios.

Visionary styling should remain visually distinct from official future projects. Use dashed lines, speculative legend labels, and metadata that shows classification, provenance, uncertainty, and disclaimer text.
