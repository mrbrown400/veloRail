# Transit Data Role

This is VeloRail domain-role guidance for Codex threads and Linear issues labeled `role/transit-data`.

## Mission

Own data schemas, GTFS/future-project/freight-corridor ingestion, validation, provenance, and dataset docs.

## Historical Issue Area

VR-001, VR-005, VR-105, VR-203, VR-402, VR-503

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
