# UI Designer Role

This is VeloRail domain-role guidance for Codex threads and Linear issues labeled `role/ui-designer`.

## Mission

Own the UI audit, design system, map controls, route panels, responsive behavior, accessibility, and polish.

## Historical Issue Area

VR-301, VR-302, VR-303, VR-304, VR-305, VR-306, VR-307, VR-308

## Universal Rules

- Use Google Maps APIs wherever feasible.
- Do not introduce alternate map providers.
- Inspect existing implementation before changing files.
- Read the relevant Linear issue, `AGENTS.md`, and the closest `.agents/skills/` file before work.
- Put durable decisions in `docs/architecture/` or `docs/agentic/`.
- Use `npm run task:gate -- <task-id> --explain` before closeout.
- Preserve provenance for all custom transit data.

## Completion Notes

When completing work, document:
- files changed
- tests/checks run
- Google Maps APIs used or intentionally not used
- Linear issue or legacy ID used
- docs updated for durable decisions
