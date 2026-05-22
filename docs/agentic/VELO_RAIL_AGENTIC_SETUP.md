# VeloRail Codex-Native Setup

VeloRail now uses Codex, Linear, GitHub, repo docs, and repo-local Codex skills as the active agent workflow.

## Active Systems

- Linear: authoritative task and project tracker.
- GitHub: branches, commits, pull requests, and review.
- Codex app: local implementation threads and worktrees.
- `.agents/skills/`: repeatable Codex workflows.
- `docs/agentic/` and `docs/architecture/`: durable project decisions.

The old hidden workflow directories have been removed from the repo. Do not recreate them for active work.

## Phase 1 Harness Curation

Phase 1 keeps VeloRail's Codex harness small and repo-native. The starred-repo review found that the useful additions are mostly references, not installed runtimes:

- `github/spec-kit`: use as a reference for issue specs, acceptance criteria, and planning shape.
- `agentskills/agentskills`: use as the standard shape for repo-local `SKILL.md` files.
- `ComposioHQ/awesome-codex-skills`: use as a discovery catalog only; review individual skills before adoption.
- Superpowers: when available, use its Codex plugin selectively for planning, debugging, parallel investigation, review, and verification.
- `1st1/lat.md`: consider only as a static Markdown pilot if it improves `docs/agentic/repo-map.md` without adding runtime infrastructure.

Before adding any new agentic tool, read `.agents/skills/velorail-harness-curation/SKILL.md`.

Do not add a new agentic harness daemon, MCP server, database, or orchestration UI to VeloRail by default. This does not ban product data storage or normal app infrastructure when a feature requires it. VeloRail should only adopt a new harness runtime after a bounded benchmark proves it fills a gap that Codex, Linear, GitHub, Browser/Chrome, Playwright, repo docs, and existing skills do not already cover.

The Phase 1 static assets are:

- `docs/agentic/phase-1-codex-harness.md`
- `docs/agentic/codex-cloud-setup.md`
- `docs/agentic/templates/linear-issue-spec.md`
- `docs/agentic/templates/implementation-plan.md`
- `docs/agentic/skills-portability.md`
- `docs/agentic/codex-skill-discovery.md`
- `docs/agentic/repo-map-lattice.md`

## Codex Cloud

Use `docs/agentic/codex-cloud-setup.md` when configuring Codex cloud for this repo. It records the Node runtime pin, setup script, environment variables, internet-access posture, and verification commands.

The setup script is:

```bash
bash scripts/codex-cloud-setup.sh
```

Repo-scoped Codex defaults live in `.codex/config.toml`. Keep runtime, MCP, code-index, and orchestration additions out of that file unless a Linear issue and the harness-curation workflow approve them.

## Mem And Repo Map

`docs/agentic/repo-map.md` is the local, checked-in codebase map. It is useful because Codex can read it in local and cloud workspaces without credentials, services, or private memory access. Regenerate it with:

```bash
npm run agent:repo-map
```

Mem is useful for cross-repo personal memory: preferences, recurring patterns, and facts that should follow the user across projects. VeloRail-specific operational rules should stay in this repo so GitHub review, Codex cloud, and future agents see the same source of truth.

## Linear Migration

The new Linear project is:

```text
Project: VeloRail Codex Migration
URL: https://linear.app/velorail/project/velorail-codex-migration-ca2f0949f90c
ID: 5a4d452d-5016-4e8d-bd3f-e6f0736e9bbd
```

The archived backlog was imported into that project as 51 Done issues. The local mapping lives in `.linear/migration.json`.

Files under `docs/agentic/legacy/` are historical exports only. Do not treat old Seeds, Mulch, Canopy, Overstory, or GitNexus instructions inside those files as active workflow.

The current Linear team discovered for this account is:

```text
Team: VeloRail
Key: VEL
ID: ff1e6e46-6ad8-4201-906a-7dc687f6354a
```

All imported legacy tasks are historical. Reopen or create new Linear issues for future active work rather than treating imported history as open backlog.

## Gate And Close Commands

Use task-oriented commands:

```bash
npm run task:gate -- <task-id> --explain
npm run task:close -- <task-id> --reason "..."
```

During migration, `<task-id>` can be either a Linear identifier or a legacy ID such as `VR-304`. The scripts read `.linear/migration.json`.

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
