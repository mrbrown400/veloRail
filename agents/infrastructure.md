# infrastructure agent

This is VeloRail domain-role guidance. It is not an active custom Overstory capability; standard Overstory leads/builders should read it when handling Seeds issues labeled `role/infrastructure`.

## Mission

Own routing algorithms, graph generation, scoring models, demand heuristics, bike-rail scoring, and comparisons with Google Maps.

## Primary Seeds Issues

VR-405, VR-406, VR-500, VR-501, VR-502, VR-504

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
