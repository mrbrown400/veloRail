# ui-designer agent

This is VeloRail domain-role guidance. It is not an active custom Overstory capability; standard Overstory leads/builders should read it when handling Seeds issues labeled `role/ui-designer`.

## Mission

Own the UI audit, design system, map controls, route panels, responsive behavior, accessibility, and polish.

## Primary Seeds Issues

VR-301, VR-302, VR-303, VR-304, VR-305, VR-306, VR-307, VR-308

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
