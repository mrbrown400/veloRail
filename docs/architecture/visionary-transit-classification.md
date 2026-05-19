# Visionary Transit Classification

VR-201 defines how VeloRail separates official projects from commentary summaries, advocacy-derived concepts, and speculative scenario records. The goal is to let users explore visionary transit ideas without implying that unofficial concepts are approved, funded, or present in Google Maps transit data.

## Categories

Every proposal record must set `classification` to one of these values:

- `official`: Agency-published, agency-approved, funded, under-construction, operational, public-plan, or freight-owner records. These may appear in official or future layers when their `status` and provenance support that treatment.
- `commentary_summary`: A summary of a transportation commentator's stated idea, including YouTube or video commentary. The record should represent what the commentator proposed, not VeloRail's endorsement.
- `advocacy_derived`: A concept derived from an advocacy group, campaign map, public petition, or planning essay that is not an official agency commitment.
- `speculative`: A VeloRail-authored or scenario-authored concept, inferred corridor, generated passenger service, or "what if" idea without a named external proponent.

## Required Metadata

All proposal records must include:

- `classification`: one of the categories above.
- `provenance`: at least one source with `sourceId`, `title`, and `sourceType`.
- `uncertainty.level`: `none`, `low`, `medium`, `high`, or `unknown`.
- `uncertainty.sourceNotes`: a short explanation of what the source supports and what VeloRail inferred.
- `confidence`: existing confidence metadata for overall record, geometry, stations, and status.

Unofficial records, meaning `commentary_summary`, `advocacy_derived`, and `speculative`, must also include at least one provenance `note` explaining how the idea was derived.

## Inclusion Rules

Official records can use `official_project`, `public_agency`, `public_plan`, or `freight_owner` sources and may use `operational`, `planned`, `under_construction`, `funded`, `freight_only`, or `converted_passenger` statuses when those statuses are supported by the source.

Commentary-summary records require at least one `commentary` source. For YouTube or other video commentary, the source note should include the video title, publisher or channel, access date, and, when available, the relevant timestamp or segment. VeloRail should summarize the concept conservatively and avoid adding extra stations, alignments, or service claims unless those additions are labeled as VeloRail assumptions.

Advocacy-derived records require at least one `advocacy` source. If VeloRail adapts an advocacy map, the source notes must state what was copied from the source and what was normalized, simplified, or inferred for Google Maps rendering.

Speculative records may use `internal_example`, `other`, `commentary`, or `advocacy` sources, but the record must describe the assumptions that make it speculative. Generated passenger services over freight corridors are speculative until a separate source supports them as official.

## Layer Separation

The `future` layer is reserved for official records. Validation rejects non-official classifications in `rendering.layerGroup: 'future'`.

The `visionary` layer is for commentary-summary, advocacy-derived, and speculative records. Validation rejects `classification: 'official'` on `vision`, `concept`, or `visionary` records.

Unofficial concepts must use `status: 'vision'` or `status: 'concept'`. They must not use `operational`, `planned`, `under_construction`, or `funded`, because those statuses read as agency commitments.

## Dedicated Registry

VR-202/VR-203 adds `src/data/visionaryTransitProposals.ts` as the production registry for new visionary concepts. The seed `vision-vermont-rapid-rail` record remains in `src/data/transitProposals.ts` as schema sample data, but new maintained concepts should be added to the dedicated registry and registered through `TRANSIT_PROPOSAL_SOURCE_FILES`.

The registry has stricter checks than the shared proposal validator:

- Records must render through `rendering.layerGroup: 'visionary'`.
- Records must use `classification: 'commentary_summary'`, `advocacy_derived`, or `speculative`.
- Records must use `status: 'vision'` or `concept`.
- Geometry must be `conceptual` or `approximate`.
- Provenance must use `commentary`, `advocacy`, `internal_example`, or `other`.
- Google Maps URLs must not be used as source evidence for visionary proposal geometry.
- `notes` must include editorial guidance for display and review.

Use `validateVisionaryTransitProposalDataset` when checking the registry directly. The default import manifest still runs the shared transit proposal validation before returning Google Maps-ready overlay inputs.

## UI Requirements

Visionary UI surfaces must display classification, source title or publisher, uncertainty level, and disclaimer text near the overlay metadata. The label should use terms such as "Unofficial scenario", "Commentary summary", "Advocacy concept", or "Speculative VeloRail scenario".

Recommended disclaimer wording for unofficial records:

> Unofficial scenario. Not an approved agency project, funded project, or Google Maps transit route.

Official future records should still show source and confidence metadata, but they should not be mixed into visionary scenario controls. Future overlay controls should name the agency source or project status instead of using visionary wording.

## Google Maps Role

Google Maps is the rendering surface for these overlays. Google Maps is not the source authority for custom visionary geometry unless a Google API explicitly provides that proposal data. Source notes must point to the agency, commentary, advocacy, or VeloRail scenario source that justified the record.
