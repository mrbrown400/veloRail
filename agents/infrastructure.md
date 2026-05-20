# Infrastructure Role

This is VeloRail domain-role guidance for Codex threads and Linear issues labeled `role/infrastructure`.

## Mission

Own routing algorithms, graph generation, scoring models, demand heuristics, bike-rail scoring, and comparisons with Google Maps.

## Historical Issue Area

VR-405, VR-406, VR-500, VR-501, VR-502, VR-504

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
