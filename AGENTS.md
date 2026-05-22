# Agent Instructions

VeloRail uses Codex as the active agent workflow. Linear is the source of truth for work tracking, GitHub is the source of truth for code review, and this repo stores durable project guidance in Markdown plus repo-local Codex skills.

The old local workflow directories were removed. Do not start new work from `ov`, `sd`, `ml`, `cn`, `CLAUDE.md`, or GitNexus generated context.

## Project Mission

VeloRail is a Los Angeles car-free routing and transit-planning web app. It uses Google Maps APIs wherever feasible, then layers VeloRail-owned planning data on top for cases Google does not natively provide: future transit overlays, visionary concepts, freight-rail passenger conversion scenarios, GTFS ingestion, scoring, and scenario generation.

Core product goals:
- Mixed-mode routing that avoids cars.
- Future and visionary transit overlays.
- Nationalized/freight-rail passenger conversion scenarios.
- Better UI around Google Maps-centered routing and overlays.

## Active Workflow

Use the `VeloRail Codex Migration` Linear project and future Linear issues for active work.

For implementation work:
- Start from the relevant Linear issue or migration task ID.
- Use GitHub branches and PRs for code review.
- Include the Linear issue key in branch names, commit messages, and PR descriptions when available.
- Use Codex app worktrees/threads for concurrent work.
- Use Codex subagents only when explicitly requested and scoped.
- Use `.linear/migration.json` to resolve imported legacy IDs.

## Repo-Local Skills

Repo-local Codex skills live in `.agents/skills/`. Read the matching skill before work:

- `.agents/skills/velorail-planning/SKILL.md` for task plans, migration planning, and architecture decisions.
- `.agents/skills/velorail-task-runner/SKILL.md` for normal implementation workflow.
- `.agents/skills/velorail-map-ui/SKILL.md` for map, overlay, route result, and browser-facing UI work.
- `.agents/skills/velorail-transit-data/SKILL.md` for future, visionary, freight, GTFS, and scenario data work.
- `.agents/skills/velorail-browser-verification/SKILL.md` for strict browser verification.
- `.agents/skills/velorail-release-closeout/SKILL.md` for final verification, PR handoff, and Linear closeout.
- `.agents/skills/velorail-harness-curation/SKILL.md` before adding or evaluating new skills, MCP servers, code-indexers, memory stores, or orchestration tools.

## Harness Curation

Phase 1 keeps the VeloRail harness intentionally small. Use external agentic-engineering repos as references or template sources unless a Linear issue explicitly asks for a bounded pilot.

Approved Phase 1 uses:
- Use `github/spec-kit` as a reference for issue specs, acceptance criteria, and implementation-plan shape.
- Use the Agent Skills specification as the shape for repo-local `SKILL.md` files.
- Use `ComposioHQ/awesome-codex-skills` only as a discovery catalog. Review individual skills before adopting them.
- Use Superpowers selectively when its workflow skill fits the task, especially planning, parallel investigation, debugging, review, and verification.
- Consider `1st1/lat.md` only as a static Markdown pilot if it improves `docs/agentic/repo-map.md` without adding a daemon, database, MCP server, or broad hook layer.

Static Phase 1 assets:
- `docs/agentic/templates/linear-issue-spec.md` for Linear issue specs and acceptance criteria.
- `docs/agentic/templates/implementation-plan.md` for task plans that need more structure than a short Linear comment.
- `docs/agentic/skills-portability.md` for Agent Skills-style `SKILL.md` review.
- `docs/agentic/codex-skill-discovery.md` for reviewing external skill catalogs before adoption.
- `docs/agentic/repo-map-lattice.md` for the static `lat.md`-style repo relationship pilot.
- `docs/agentic/codex-cloud-setup.md` for Codex cloud setup, runtime pins, environment variables, and verification commands.

Do not add a new agentic harness daemon, MCP server, database, or orchestration UI to VeloRail by default. That policy does not ban product data storage or normal app infrastructure when a feature requires it. New harness runtimes increase security surface, setup drift, cloud/local mismatch, and workflow overlap with Codex worktrees, Linear, GitHub, repo docs, and Playwright gates. Put global experiments in a separate Codex harness first, then adopt into VeloRail only after a benchmark proves value.

## Google Maps-First Architecture

Use Google Maps APIs and SDK features wherever possible.

Do not introduce alternate map providers, custom tile systems, or duplicate geospatial rendering stacks unless a Linear issue explicitly requires it and the decision is documented.

Google Maps should handle base map rendering, map gestures and viewport, polylines, markers or advanced markers, map object click/hover events, and Directions/Routes comparison where API access and product constraints allow.

VeloRail may own custom logic/data for future proposal geometries, visionary proposal registries, freight corridor datasets, nationalized rail scenarios, GTFS ingestion, suitability/demand/bike-access scoring, and scenario route generation over custom data.

## Quick Reference

```bash
npm run agent:repo-map                 # Regenerate docs/agentic/repo-map.md
npm run task:gate -- <task-id> --explain
npm run task:close -- <task-id> --reason "..."
npm run quality
npm run test:browser:required
```

`task:gate` and `task:close` accept legacy IDs such as `VR-304` during migration. They resolve those IDs from `.linear/migration.json` so gate behavior stays stable while Linear identifiers replace old task IDs.

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
- `docs/agentic/repo-map-lattice.md` for static relationships between workstreams, owner files, docs, and gates.
- `docs/agentic/codex-native-migration.md` for migration status and legacy stack mapping.
- `docs/agentic/phase-1-codex-harness.md` for the current strict harness adoption policy.
- `docs/agentic/codex-cloud-setup.md` for reproducible Codex cloud environment setup.
- `docs/architecture/` for durable architecture decisions.

Files under `docs/agentic/legacy/` are historical migration exports only. Do not treat old Seeds, Mulch, Canopy, Overstory, or GitNexus instructions inside those files as active workflow.

Use Mem only for cross-repo personal memory. VeloRail-specific operational rules belong in this repo.

## Completion Rules

Before handing work back:
1. Run the appropriate gate commands.
2. Update or reference the relevant Linear issue if Linear write access is available.
3. Push code through GitHub only when explicitly requested or when the task asks for PR/push completion.
4. Report any connector/token blocker directly, including the exact command that remains to run.
