---
name: velorail-planning
description: Use for VeloRail task plans, migration plans, architecture decisions, and Linear issue planning.
---

# VeloRail Planning

Use this skill before changing shared data models, map-layer contracts, routing assumptions, or browser-facing architecture.

## Inputs

- Relevant Linear issue or legacy ID.
- Current files and docs that own the behavior.
- Any source/provenance constraints for custom transit data.

## Planning Format

1. State the user-facing or agent-facing outcome.
2. List the files or modules likely to change.
3. Call out Google Maps API boundaries and custom VeloRail logic.
4. Identify tests and browser checks.
5. Put durable architecture decisions in `docs/architecture/` or `docs/agentic/`.

Keep plans short enough to execute. Put active task plans in Linear issue descriptions or comments when Linear write access is available.
