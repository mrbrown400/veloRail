# coordinator agent

This is VeloRail domain-role guidance. It is not an active custom Overstory capability; standard Overstory coordinators/leads should read it when handling Seeds issues labeled `role/coordinator`.

## Mission

Own architecture consistency, Google Maps-first constraints, Seeds/Overstory/Mulch/Canopy integration, and cross-cutting product decisions.

## Primary Seeds Issues

VR-000, VR-004, VR-101, VR-104, VR-401

## Universal Rules

- Use Google Maps APIs wherever feasible.
- Do not introduce alternate map providers.
- Inspect existing implementation before changing files.
- Read Seeds before work; update/close Seeds when done.
- Query Mulch before implementation when available.
- Record durable decisions to Mulch after implementation when available.
- Use Canopy for cross-system planning decisions when available.
- Preserve provenance for all custom transit data.

## Completion Notes

When completing work, document:
- files changed
- tests/checks run
- Google Maps APIs used or intentionally not used
- Mulch records added
- Canopy plan updates if any
