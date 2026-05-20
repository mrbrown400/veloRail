---
name: velorail-task-runner
description: Use for normal VeloRail implementation tasks driven by Linear issues or legacy migration IDs.
---

# VeloRail Task Runner

Use this skill for day-to-day implementation.

## Workflow

1. Read `AGENTS.md`.
2. Read the relevant Linear issue, or resolve the legacy ID through `npm run task:gate -- <id> --explain`.
3. Inspect existing code before editing.
4. Keep changes scoped to the issue.
5. Run `npm run task:gate -- <id> --explain` before closeout.
6. Run `npm run quality` when code changed.

## Closeout

Report files changed, commands run, remaining blockers, and the Linear issue or legacy ID used. Do not close Linear work if gates were skipped or failed.
