# Codex-Native Migration Notes

## Replacement Map

| Legacy system | Former role | Codex-native replacement |
| --- | --- | --- |
| Overstory | Worktrees, mail, groups, agent roles, merge flow | Codex app threads/worktrees, GitHub PRs, explicit subagents when requested |
| Seeds | Local task tracker and dependency graph | New Linear project plus GitHub PR links |
| Mulch | Durable project expertise | Repo docs and `.agents/skills/` |
| Canopy | Git-native plans/prompts | Linear issue plans, architecture docs, and `velorail-planning` skill |
| GitNexus | Generated repo context and code graph | `docs/agentic/repo-map.md`, `rg`, TypeScript checks, GitHub, and Codex exploration |
| Claude guidance | Claude Code entrypoint | `AGENTS.md` and repo-local Codex skills |

## Migration Result

The old hidden workflow directories have been removed from the repo. The authoritative migration result is the Linear project plus `.linear/migration.json`.

The new Linear project is `VeloRail Codex Migration`: https://linear.app/velorail/project/velorail-codex-migration-ca2f0949f90c

The import preserved original IDs, labels, priority, close reason, timestamps, and dependency notes inside issue bodies. Linear metadata is written to `.linear/migration.json`; it maps legacy IDs such as `VR-304` to Linear identifiers such as `MBR-52` while preserving the old browser test tags.

## Active Defaults

- New active work starts in Linear.
- Branches and PRs should include Linear identifiers when available.
- Browser-facing changes keep strict Playwright gates.
- Durable decisions should update repo docs.
- Reusable workflow changes should update `.agents/skills/`.
- Starred-repo Phase 1 additions are reference material and curation policy, not replacements for the removed Overstory, Seeds, Mulch, Canopy, or GitNexus stack.

## Phase 1 Hardening

The first Codex-native harness pass adds policy rather than infrastructure:

- Spec-driven planning uses `github/spec-kit` as a reference, not as a second task system.
- Repo-local skills follow the Agent Skills shape and stay focused on repeatable VeloRail workflows.
- Codex skill discovery uses curated lists only as intake sources. Individual skills must pass VeloRail harness curation before adoption.
- Superpowers remains selective workflow support, not a replacement for VeloRail's own `AGENTS.md`, `.agents/skills/`, Linear, GitHub, and gates.
- Static Markdown code maps are preferred over generated harness databases or background services for VeloRail. Any `lat.md`-style pilot must improve `docs/agentic/repo-map.md` without adding a daemon, MCP server, harness database, or orchestration UI.

The static Phase 1 assets live in `docs/agentic/templates/`, `docs/agentic/skills-portability.md`, `docs/agentic/codex-skill-discovery.md`, and `docs/agentic/repo-map-lattice.md`.

This keeps VeloRail compatible with local Codex and Codex cloud: durable guidance is checked into the repo, while cross-repo personal memory stays in Mem.
