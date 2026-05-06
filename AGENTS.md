# Agent Instructions

This project uses **Overstory** for multi-agent orchestration, **sd** (Seeds) for issue tracking, **ml** (Mulch) for durable project expertise, and **cn** (Canopy) for git-native prompt management.

Overstory and Seeds are different layers:
- **Overstory** coordinates agents, worktrees, mail, logs, merges, and swarm roles.
- **Seeds** stores the actual work items, dependencies, status, and issue IDs that Overstory agents claim and close.

Run `sd prime` for Seeds basics, `ml prime` for project expertise, `cn prime` for prompt workflow context, and `ov status` to inspect active agents.

## Project Mission

VeloRail is a Los Angeles car-free routing and transit-planning project. It uses Google Maps APIs wherever feasible, then layers VeloRail-owned planning data on top for cases Google does not natively provide: future transit overlays, visionary concepts, freight-rail passenger conversion scenarios, GTFS ingestion, scoring, and scenario generation.

Core product goals:
- Mixed-mode routing that avoids cars.
- Future and visionary transit overlays.
- Nationalized/freight-rail passenger conversion scenarios.
- Better UI around Google Maps-centered routing and overlays.

## Google Maps-First Architecture

Use Google Maps APIs and SDK features wherever possible.

Do not introduce alternate map providers, custom tile systems, or duplicate geospatial rendering stacks unless a Seeds issue explicitly requires it and the decision is documented.

Google Maps should handle base map rendering, map gestures and viewport, polylines, markers or advanced markers, map object click/hover events, and Directions/Routes comparison where API access and product constraints allow.

VeloRail may own custom logic/data for future proposal geometries, visionary proposal registries, freight corridor datasets, nationalized rail scenarios, GTFS ingestion, suitability/demand/bike-access scoring, and scenario route generation over custom data.

## Role Guidance

VeloRail domain roles are guidance only. They are **not** active custom Overstory capabilities in this repo.

- Keep using standard Overstory capabilities: `coordinator`, `lead`, `builder`, `scout`, `reviewer`, and `merger`.
- Use Seeds labels such as `role/cartographer`, `role/transit-data`, `role/scenario`, `role/ui-designer`, and `role/infrastructure` to route work.
- Before dispatching or implementing a role-labeled issue, read the matching file in `agents/`.
- Use `velorail-agent-roles.json` as the role-to-issue assignment map.
- Do not add domain roles to `.overstory/agent-manifest.json` unless the harness is updated and tested for custom task-scoped capabilities.

## Quick Reference

```bash
sd ready              # Find available work
sd show <id>          # View issue details
sd update <id> --status in_progress  # Claim work
npm run issue:gate -- <id> --explain  # Preview close gates
npm run issue:close -- <id> --reason "..."  # Complete work after gates pass
sd sync               # Stage and commit Seeds changes
ov status             # Inspect active agents and worktrees
ml prime              # Load Mulch project expertise
ml learn              # Discover session insights worth recording
ml doctor             # Validate Mulch expertise store
cn prime              # Load Canopy prompt workflow context
cn list               # List managed prompts
cn doctor             # Validate Canopy prompt store
npx gitnexus analyze  # Refresh GitNexus after commits or before GitNexus-driven navigation
```

## Quality Gates

If code changed, run:

```bash
npm run quality
```

This runs the Node unit tests, style linting, TypeScript static checks, and the production build.

Seeds issues must be closed through the repo-owned gate:

```bash
npm run issue:gate -- <id> --explain
npm run issue:close -- <id> --reason "<summary>"
```

Direct `sd close` and `sd update --status closed` are blocked for Overstory agents. Browser-facing issues automatically require strict Playwright verification. Use `gate/browser` to force browser verification, `gate/no-browser` to suppress automatic browser verification, `gate/no-code` for admin/scout/docs-only closures, and `gate/browser-smoke-only` when existing `@smoke` browser coverage is enough.

## GitNexus Freshness

At session start, run:

```bash
npx gitnexus status
```

If GitNexus reports the index is stale, run `npx gitnexus analyze` before relying on GitNexus code navigation, impact analysis, or execution flows. Do not run a refresh in the middle of unrelated dirty generated-doc edits unless the current task needs GitNexus.

The harness also refreshes GitNexus after commits:
- `.beads/hooks/post-commit` runs `scripts/gitnexus-analyze-after-commit.sh` for normal Git commits because local `core.hooksPath` points to `.beads/hooks`.
- `.overstory/hooks.json` invokes the same script after agent `git commit` tool calls.
- The refresh snapshots and restores generated GitNexus context files so routine stats-only updates do not leave `AGENTS.md` or `CLAUDE.md` dirty after every commit. Run `npx gitnexus analyze` manually when you intentionally want to refresh tracked GitNexus context text.

## Idempotent Work Rules

Before changing agentic setup files:
1. Inspect the repo.
2. Find existing `.seeds`, `.overstory`, `AGENTS.md`, `agents/`, Mulch, and Canopy files.
3. Preserve existing setup unless the task explicitly requires a change.
4. If a file exists, merge missing sections rather than replacing it.
5. If a config schema is uncertain, create a proposed config file or documentation note instead of breaking the current setup.

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - `npm run quality`
3. **Update issue status** - Close finished work with `npm run issue:close`, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   sd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

<!-- gitnexus:start -->
# GitNexus MCP

This project is indexed by GitNexus as **veloRail** (851 symbols, 2153 relationships, 65 execution flows).

## Always Start Here

1. **Read `gitnexus://repo/{name}/context`** — codebase overview + check index freshness
2. **Match your task to a skill below** and **read that skill file**
3. **Follow the skill's workflow and checklist**

> If step 1 warns the index is stale, run `npx gitnexus analyze` in the terminal first.

## Skills

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
