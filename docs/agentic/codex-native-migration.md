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

## Current Migration Source

The authoritative archive source is `.seeds/issues.jsonl`. It contains 51 closed issues, no duplicate IDs, and no open backlog. The old `velorail-seeds.jsonl` setup pack contains open historical source records and should not be imported as active work.

The new Linear project is `VeloRail Codex Migration`: https://linear.app/velorail/project/velorail-codex-migration-ca2f0949f90c

The import preserved original IDs, labels, priority, close reason, timestamps, and dependency notes inside issue bodies. Linear metadata is written to `.linear/migration.json`; it maps legacy IDs such as `VR-304` to Linear identifiers such as `MBR-52` while preserving the old browser test tags.

## Active Defaults

- New active work starts in Linear.
- Branches and PRs should include Linear identifiers when available.
- Browser-facing changes keep strict Playwright gates.
- Durable decisions should update repo docs.
- Reusable workflow changes should update `.agents/skills/`.
