---
name: velorail-release-closeout
description: Use for VeloRail final verification, PR handoff, GitHub linking, and Linear closeout.
---

# VeloRail Release Closeout

Use this skill before handing VeloRail work back.

## Checklist

1. Run `npm run task:gate -- <task-id> --explain`.
2. Run `npm run quality` when code changed.
3. Run strict browser checks for browser-facing tasks.
4. Regenerate `docs/agentic/repo-map.md` after workflow or structure changes.
5. Mention the Linear issue key in branch names, commit messages, or PR descriptions when creating GitHub work.
6. Update Linear only after gates pass. If using `npm run task:close`, pass `--apply-linear` only when `LINEAR_API_KEY` and `LINEAR_DONE_STATE_ID` are configured.
