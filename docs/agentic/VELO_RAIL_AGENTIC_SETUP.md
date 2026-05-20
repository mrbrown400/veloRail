# VeloRail Codex-Native Setup

VeloRail now uses Codex, Linear, GitHub, repo docs, and repo-local Codex skills as the active agent workflow.

## Active Systems

- Linear: authoritative task and project tracker.
- GitHub: branches, commits, pull requests, and review.
- Codex app: local implementation threads and worktrees.
- `.agents/skills/`: repeatable Codex workflows.
- `docs/agentic/` and `docs/architecture/`: durable project decisions.

Hidden legacy stores are migration inputs only:
- `.seeds/` preserves the closed legacy backlog.
- `.mulch/` preserves historical expertise records.
- `.canopy/` preserves historical planning prompts.
- `.overstory/` preserves old orchestration state.
- `.claude/` and removed Claude guidance are not active Codex entrypoints.

## Linear Migration

The new Linear project is:

```text
Project: VeloRail Codex Migration
URL: https://linear.app/velorail/project/velorail-codex-migration-ca2f0949f90c
ID: 5a4d452d-5016-4e8d-bd3f-e6f0736e9bbd
```

The archived backlog has been imported into that project as 51 Done issues. The local mapping lives in `.linear/migration.json`.

To inspect or rerun the token-based fallback importer:

```bash
npm run linear:import -- --dry-run
LINEAR_API_KEY=... npm run linear:import -- --apply --team-id <linear-team-id>
```

The dry run reports issue counts, priorities, labels, dependency edges, duplicate IDs, and missing dependency targets. The apply mode creates a new Linear project named `VeloRail Codex Migration` unless `--project-name` is supplied.

The current Linear team discovered for this account is:

```text
Team: VeloRail
Key: VEL
ID: ff1e6e46-6ad8-4201-906a-7dc687f6354a
```

All imported legacy tasks are historical because `.seeds/issues.jsonl` currently contains only closed work. Reopen or create new Linear issues for future active work rather than treating the archived backlog as open.

## Gate And Close Commands

Use task-oriented commands:

```bash
npm run task:gate -- <task-id> --explain
npm run task:close -- <task-id> --reason "..."
```

During migration, `<task-id>` can be either a Linear identifier or a legacy ID such as `VR-304`. The scripts read `.linear/migration.json` when it exists and fall back to `.seeds/issues.jsonl` as an archive source.

Browser-facing tasks still require strict browser verification. Existing browser tests keep legacy `@VR-*` tags until they are deliberately retagged, so migration metadata preserves `browserGateTag`.

## Knowledge Replacement

Mulch replacement:
- Stable VeloRail facts live in `docs/agentic/` and `docs/architecture/`.
- Repeatable workflows live in `.agents/skills/`.
- Cross-repo personal memory can use Mem, but VeloRail-specific rules stay in this repo.

Canopy replacement:
- Active task plans live in Linear issue descriptions or comments.
- Durable architecture decisions live in repo docs.
- Reusable planning behavior lives in `.agents/skills/velorail-planning/SKILL.md`.

GitNexus replacement:
- Use `docs/agentic/repo-map.md` plus `npm run agent:repo-map`.
- Use Codex exploration, `rg`, TypeScript references, and GitHub context for live code navigation.
- Do not refresh GitNexus after commits.

Overstory replacement:
- Use Codex app worktrees and threads for concurrent local work.
- Use Codex subagents only when explicitly requested and scoped.
- Do not use Overstory mail, groups, agent manifests, or worker closeout rituals.
