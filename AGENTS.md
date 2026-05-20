# Agent Instructions

VeloRail uses Codex as the active agent workflow. Linear is the source of truth for work tracking, GitHub is the source of truth for code review, and this repo stores durable project guidance in Markdown plus repo-local Codex skills.

Legacy Overstory, Seeds, Mulch, Canopy, Claude, and GitNexus files may remain in hidden directories as migration history only. Do not start new work from `ov`, `sd`, `ml`, `cn`, `CLAUDE.md`, or GitNexus generated context.

## Project Mission

VeloRail is a Los Angeles car-free routing and transit-planning web app. It uses Google Maps APIs wherever feasible, then layers VeloRail-owned planning data on top for cases Google does not natively provide: future transit overlays, visionary concepts, freight-rail passenger conversion scenarios, GTFS ingestion, scoring, and scenario generation.

Core product goals:
- Mixed-mode routing that avoids cars.
- Future and visionary transit overlays.
- Nationalized/freight-rail passenger conversion scenarios.
- Better UI around Google Maps-centered routing and overlays.

## Active Workflow

Use a new Linear project for the Codex-native migration and future VeloRail work. The migration script creates a new project and imports the legacy Seeds backlog when a Linear API token is available:

```bash
npm run linear:import -- --dry-run
LINEAR_API_KEY=... npm run linear:import -- --apply --team-id <linear-team-id>
```

For implementation work:
- Start from the relevant Linear issue or migration task ID.
- Use GitHub branches and PRs for code review.
- Include the Linear issue key in branch names, commit messages, and PR descriptions when available.
- Use Codex app worktrees/threads for concurrent work.
- Use Codex subagents only when explicitly requested and scoped.
- Keep old `.seeds/issues.jsonl` data as archive input, not as the active tracker.

## Repo-Local Skills

Repo-local Codex skills live in `.agents/skills/`. Read the matching skill before work:

- `.agents/skills/velorail-planning/SKILL.md` for task plans, migration planning, and architecture decisions.
- `.agents/skills/velorail-task-runner/SKILL.md` for normal implementation workflow.
- `.agents/skills/velorail-map-ui/SKILL.md` for map, overlay, route result, and browser-facing UI work.
- `.agents/skills/velorail-transit-data/SKILL.md` for future, visionary, freight, GTFS, and scenario data work.
- `.agents/skills/velorail-browser-verification/SKILL.md` for strict browser verification.
- `.agents/skills/velorail-release-closeout/SKILL.md` for final verification, PR handoff, and Linear closeout.

## Google Maps-First Architecture

Use Google Maps APIs and SDK features wherever possible.

Do not introduce alternate map providers, custom tile systems, or duplicate geospatial rendering stacks unless a Linear issue explicitly requires it and the decision is documented.

Google Maps should handle base map rendering, map gestures and viewport, polylines, markers or advanced markers, map object click/hover events, and Directions/Routes comparison where API access and product constraints allow.

VeloRail may own custom logic/data for future proposal geometries, visionary proposal registries, freight corridor datasets, nationalized rail scenarios, GTFS ingestion, suitability/demand/bike-access scoring, and scenario route generation over custom data.

## Quick Reference

```bash
npm run agent:repo-map                 # Regenerate docs/agentic/repo-map.md
npm run linear:import -- --dry-run      # Preview new Linear project import
npm run task:gate -- <task-id> --explain
npm run task:close -- <task-id> --reason "..."
npm run quality
npm run test:browser:required
```

`task:gate` and `task:close` accept legacy IDs such as `VR-304` during migration. They resolve those IDs from the archived `.seeds/issues.jsonl` file so gate behavior stays stable while Linear import is in progress.

## Quality Gates

If code changed, run:

```bash
npm run quality
```

This runs Node unit tests, style linting, TypeScript static checks, and the production build.

Browser-facing issues require strict browser verification unless the task is explicitly docs/data-only:

```bash
npm run test:browser:required -- --grep @<task-id>
```

Use labels in Linear to drive gate behavior:
- `gate/browser` forces strict browser verification.
- `gate/no-browser` suppresses automatic browser verification for non-user-facing work.
- `gate/no-code` skips code/browser gates for admin or docs-only tasks.
- `gate/browser-smoke-only` allows `@smoke` browser coverage.

## Durable Knowledge

Use repo docs instead of agent-private stores:
- `docs/agentic/repo-map.md` for the codebase map.
- `docs/agentic/codex-native-migration.md` for migration status and legacy stack mapping.
- `docs/architecture/` for durable architecture decisions.

Use Mem only for cross-repo personal memory. VeloRail-specific operational rules belong in this repo.

## Completion Rules

Before handing work back:
1. Run the appropriate gate commands.
2. Update or reference the relevant Linear issue if Linear write access is available.
3. Push code through GitHub only when explicitly requested or when the task asks for PR/push completion.
4. Report any connector/token blocker directly, including the exact command that remains to run.
