# Rail-Gap Recommendations And Implementation Follow-Ups

MBR-100 publishes the decision record for the MBR-97 post-expansion rail-gap analysis. It converts the MBR-98 completed-network baseline and MBR-99 corridor screening into durable recommendations, then defines only the implementation work that is concrete enough to open as follow-up Linear issues.

## Decision Summary

Do **not** add more checked-in passenger-conversion tracks by default. The current source set supports one high-friction `clear gap study` candidate, two `likely redundant` passenger-conversion candidates that should be de-emphasized, and two freight/research items that need more evidence before any passenger rendering.

| Bucket | Candidate | Go / no-go decision | Default display behavior | Evidence boundary |
| --- | --- | --- | --- | --- |
| Clear gap study | Alameda Corridor / South Alameda passenger-conversion concept (`la-freight-alameda-corridor` -> `alameda-corridor-south-alameda-passenger-conversion`) | **Go for cautious study display only.** Keep as the only current clear-gap candidate because the completed-network baseline still lacks a direct San Pedro Bay / South Alameda / downtown passenger spine. | Keep in passenger-conversion inventory, but mark as hypothetical freight-ROW reuse, default-off or lower-priority within the converted-passenger overlay, dashed or otherwise study-coded, and never described as approved service. | Freight facts are supported by ACTA, Port of Los Angeles, FRA NARN, and Caltrans references already carried by the dataset. Passenger stations, service pattern, and downtown interface are VeloRail assumptions requiring explicit uncertainty language. |
| Likely redundant | BNSF Los Angeles to San Bernardino passenger-conversion concept (`la-freight-bnsf-los-angeles-san-bernardino` -> `bnsf-la-san-bernardino-passenger-conversion`) | **No-go for promotion as a gap.** Keep as freight/right-of-way context, not a default passenger-conversion priority. | Hide from default detail lists or show in a `redundant / existing regional rail market` group with lower opacity, thinner stroke, and a tooltip explaining that ROW suitability is not completed-network gap value. | Freight ownership/network facts are supported by BNSF, FRA, and Caltrans references in the checked-in record. Passenger conversion is a VeloRail-generated assumption and overlaps existing Metrolink/Inland Empire regional markets in the completed baseline. |
| Likely redundant | Union Pacific Los Angeles to Inland Empire passenger-conversion concept (`la-freight-union-pacific-los-angeles-inland-empire` -> `up-la-inland-empire-passenger-conversion`) | **No-go for promotion as a gap.** Retain for freight context and possible future operations/reliability study only if new sources identify unserved station markets. | Hide from default detail lists or show in the same de-emphasized redundant group as BNSF. | Freight role is supported by Union Pacific, FRA, and Caltrans references. Passenger conversion remains hypothetical and duplicates the LA-to-Inland-Empire passenger market after current and completed-network regional rail context is considered. |
| Needs evidence / freight context only | Pacific Harbor Line San Pedro Bay Port Rail Complex (`la-freight-pacific-harbor-line-port-complex`) | **No-go for passenger-conversion generation.** Keep freight-only. | Low-contrast freight context when the freight overlay is enabled; omit from converted-passenger lists. | PHL, Port of LA, UP short-line, and Caltrans sources support terminal/switching freight operations. They do not define a passenger travel corridor or stations. |
| Needs evidence / research backlog | Randolph Street / Slauson-adjacent feedback corridor | **No-go for rendering.** Source-pass only before future consideration. | Do not render as passenger conversion. Mention only as a research backlog item until segment-level evidence exists. | Current data is too regional to distinguish ownership, active/abandoned status, safe station anchors, or overlap with Southeast Gateway, A Line, Vermont BRT, and other completed-network services. |

## Recommended Passenger-Conversion Display Policy

1. Split current passenger-conversion items into review buckets rather than relying on the existing freight suitability score alone: `Clear gap study`, `Redundant / de-emphasized`, and `Needs evidence / freight context only`.
2. Keep Alameda/South Alameda visible only with its freight fact and passenger assumption side by side. The UI should make clear that ACTA/Port sources support freight ROW facts, while VeloRail owns the hypothetical passenger station/service assumptions.
3. Remove BNSF and UP Inland Empire concepts from default detail lists for high-value passenger-conversion gaps. If users opt into a full conversion inventory, show these corridors with reduced prominence and a `parallel to existing regional rail` explanation.
4. Keep Pacific Harbor Line freight-only. Do not let terminal switching trackage inherit converted-passenger line styling.
5. Do not promote Randolph Street or any similar user-feedback corridor until a source pass identifies segment ownership, track status, passenger-access anchors, and completed-network overlap.
6. Add a structured `completedNetworkOverlap` or `gapReview` field before future scoring/UI work treats freight suitability as a passenger-gap ranking. The MBR-99 screen showed that long, continuous freight rights-of-way can score well as ROW candidates while still being low-value passenger gap overlays.

## Parent Issue Closure Note

Use this summary when closing MBR-100 or updating MBR-97:

> MBR-100 closes the rail-gap analysis loop with a no-broad-additions decision. Alameda/South Alameda remains the only current clear-gap study candidate, but only as a default-off, explicitly hypothetical freight-ROW passenger-conversion study. BNSF LA-San Bernardino and UP LA-Inland Empire are redundant after the completed-network and existing regional rail context are considered, so they should be de-emphasized or removed from default passenger-conversion detail lists. Pacific Harbor Line stays freight-only, and Randolph Street stays research-only until segment-level provenance and station/access evidence exists. Implementation follow-ups are limited to structured gap-review metadata and converted-passenger display de-emphasis; no speculative corridor is promoted without source/provenance and uncertainty language.

## Approved Follow-Up Issue Drafts

Linear write access was not available in this agent environment, so these issue bodies are ready to paste into Linear as child follow-ups under MBR-97/MBR-100. They are intentionally scoped to concrete data/UI changes with file boundaries, source boundaries, tests, and browser expectations.

### Follow-Up 1: Add completed-network gap-review metadata to passenger-conversion records

**Outcome**

Add structured metadata that separates freight ROW suitability from completed-network passenger-gap value, then surface that metadata in converted-passenger records and metadata panels.

**Context**

- Related issues: MBR-97, MBR-99, MBR-100.
- Relevant files:
  - `src/types/proposals.ts`
  - `src/data/transitProposalValidation.ts`
  - `src/data/laFreightRailCorridors.ts`
  - `src/services/freightPassengerConversion.ts`
  - `src/components/Map/mapOverlayRegistry.ts`
  - `tests/transitProposalValidation.test.js`
  - `tests/transitProposalImport.test.js`
  - `tests/mapOverlayRegistry.test.js`
  - `tests/browser/overlay-metadata.spec.ts`
- Source/provenance constraints:
  - Populate initial review values from `docs/architecture/rail-gap-corridor-screening.md` and this document only.
  - Do not use Google Maps basemap linework, satellite imagery, or map labels as source evidence.
  - Do not change corridor geometry or promote passenger service status.

**Requirements**

- Add a typed optional field such as `freight.gapReview` or `completedNetworkOverlap` with bucket, overlap summary, display recommendation, source boundary, reviewed date, and related analysis doc path.
- Seed the field for Alameda, BNSF, UP Inland Empire, and Pacific Harbor Line based on this MBR-100 decision record.
- Ensure generated converted-passenger records inherit the source freight record's review metadata where applicable.
- Show gap-review details in converted-passenger metadata panels without replacing existing suitability, provenance, or uncertainty fields.

**Acceptance Criteria**

- Alameda metadata labels it as `clear gap study` and preserves the freight-fact/passenger-assumption boundary.
- BNSF and UP metadata label them as `redundant / de-emphasized` and explain the completed-network overlap.
- Pacific Harbor Line remains freight-only and does not generate a converted-passenger record.
- Validation rejects malformed gap-review buckets or missing source-boundary text when the field is present.
- No corridor geometry, official/future classification, or conversion approval language changes.

**Verification**

- `npm run task:gate -- <new-task-id> --explain`
- `npm run quality`
- `npm run test:browser:required -- --grep @<new-task-id>` because the metadata panel is browser-facing.

### Follow-Up 2: De-emphasize redundant passenger-conversion corridors in overlay UI

**Outcome**

Use the gap-review metadata to keep low-value current passenger-conversion corridors out of the default high-value detail path while preserving opt-in freight/right-of-way context.

**Context**

- Related issues: MBR-97, MBR-99, MBR-100.
- Relevant files:
  - `src/components/Map/mapOverlayRegistry.ts`
  - `src/components/Map/MapOverlayControls.tsx`
  - `src/components/Map/MapOverlayLegend.tsx`
  - `src/components/Map/MapOverlayMetadataPanel.tsx`
  - `tests/mapOverlayRegistry.test.js`
  - `tests/browser/overlay-metadata.spec.ts`
  - Add or update a focused browser spec tagged with the new Linear issue key.
- Source/provenance constraints:
  - The UI must read checked-in review metadata rather than recomputing corridor value from unsourced map observations.
  - This issue should not create new corridor records, edit corridor geometries, or change official/visionary/freight classification boundaries.

**Requirements**

- Add converted-passenger display grouping or styling so `redundant / de-emphasized` records do not look equivalent to the Alameda clear-gap study.
- Prefer lower opacity/thinner stroke and explanatory legend/metadata text over deletion, unless product review decides to hide redundant records from the default detail list entirely.
- Keep an opt-in path to inspect BNSF and UP as freight/right-of-way context.
- Keep Pacific Harbor Line out of converted-passenger styling.

**Acceptance Criteria**

- Alameda remains inspectable as a hypothetical clear-gap study with explicit uncertainty language.
- BNSF and UP either do not appear in the default converted-passenger detail list or appear under a de-emphasized redundant group with lower-prominence styling and a `parallel to existing regional rail` explanation.
- The legend or metadata panel communicates that freight suitability score is not completed-network gap value.
- Tests prove no freight-only PHL record is rendered as converted passenger.

**Verification**

- `npm run task:gate -- <new-task-id> --explain`
- `npm run quality`
- `npm run test:browser:required -- --grep @<new-task-id>` because overlay controls, legend, styling, and metadata are browser-facing.

## Deferred Research Only

Do not open implementation issues for the following until better sources are identified:

- **Randolph Street / Slauson-adjacent corridor source pass.** This needs segment-level ownership, active/abandoned status, station-access anchors, and completed-network overlap research before implementation. A future issue should be research-only unless it includes specific data sources and a no-render acceptance criterion.
- **Pacific Harbor Line passenger conversion.** This should remain freight-only unless a separate source-backed passenger-access concept for San Pedro, Wilmington, or Long Beach is found that is not just terminal switching trackage.
