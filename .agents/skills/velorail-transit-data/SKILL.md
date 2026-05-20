---
name: velorail-transit-data
description: Use for VeloRail future transit, visionary proposals, freight corridors, GTFS, and scenario data.
---

# VeloRail Transit Data

Use this skill for data, validation, and provenance work.

## Rules

- Keep official future projects separate from visionary or hypothetical scenarios.
- Do not treat Google Maps basemap imagery as a source for custom geometry.
- Include source notes, status, confidence, uncertainty, and review dates where the schema supports them.
- Prefer small bounded datasets over broad speculative imports.
- Update validation tests when schema or policy changes.

## Verification

Run the relevant dataset validation and `npm run quality`. For data-only tasks labeled `gate/no-browser`, browser tests are not required unless rendering behavior changed.
