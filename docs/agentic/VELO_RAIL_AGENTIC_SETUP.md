# VeloRail Agentic Setup

This repo is expected to use some combination of Overstory, Seeds, Mulch, Canopy, and Codex.

## Idempotent setup

Use `scripts/install_velorail_agentic_setup.py` to merge the VeloRail backlog into `.seeds/issues.jsonl` without duplicating issue IDs.

```bash
python scripts/install_velorail_agentic_setup.py
```

The script:
- creates `.seeds/issues.jsonl` if missing
- backs up existing `.seeds/issues.jsonl`
- merges issues by `id`
- preserves existing issue fields when possible
- adapts setup-pack `depends_on` into Seeds `blockedBy` and `blocks`
- keeps role ownership in labels such as `role/cartographer`
- validates `velorail-agent-roles.json`

## Seeds

Seeds is the task tracker. VeloRail issues are in `velorail-seeds.jsonl` and merge into `.seeds/issues.jsonl`.

Suggested commands, if available:

```bash
sd ready
sd show VR-001
sd update VR-001 --status in_progress
npm run issue:gate -- VR-001 --explain
npm run issue:close -- VR-001 --reason "Completed implementation"
```

Overstory agents must use the issue close wrapper. Direct `sd close` and
`sd update --status closed` are blocked by `.overstory/hooks.json`.

## Overstory

Do not overwrite existing Overstory config. VeloRail domain roles are guidance only in this repo:
- Overstory still spawns standard capabilities such as `lead`, `builder`, `scout`, `reviewer`, and `merger`.
- Seeds labels and `velorail-agent-roles.json` route work to VeloRail role guidance.
- Standard agents should read the matching `agents/<role>.md` file before dispatching or implementing role-scoped work.

Do not add roles such as `cartographer` or `transit-data` to `.overstory/agent-manifest.json` unless the Overstory harness is first updated and tested for custom task-scoped capabilities.

The active Overstory Bash post-tool hook runs `scripts/gitnexus-analyze-after-commit.sh` after agent `git commit` commands.

### Mail startup path

Use the read-only inbox command during startup and hook-time checks:

```bash
ov mail list --to "$OVERSTORY_AGENT_NAME" --unread
```

Do not use `ov mail check` as the default startup check in this repo. It marks
unread messages as read, which writes to `.overstory/mail.db` and can fail with
`Error: attempt to write a readonly database` in sandboxed Overstory worktrees.
The `UserPromptSubmit` hook uses `ov mail list --to orchestrator --unread` for
the same reason.

Mail send paths such as `worker_done`, `merge_ready`, and status/error messages
also require mail DB writes. When those writes fail with `MAIL_ERROR`, treat that
as a remaining closeout limitation: preserve the verification output, document
the failed send, and let the coordinator/operator reconcile the terminal signal.

## Git hooks

This repo's local Git config uses:

```bash
git config core.hooksPath .beads/hooks
```

The tracked `.beads/hooks/post-commit` hook runs `scripts/gitnexus-analyze-after-commit.sh`, which refreshes the ignored GitNexus index after commits and restores generated context files afterward. This keeps routine stats-only updates out of the working tree. Run `npx gitnexus analyze` manually when you intentionally want to refresh tracked GitNexus context text.

## Mulch

Agents should query Mulch before implementation and record durable lessons afterward. If Mulch is unavailable, write notes to this directory.

## Canopy

Use Canopy for multi-system plans. If Canopy is unavailable, update `docs/agentic/canopy-plan.md`.

## Roles

Role definitions are in `agents/` and assignments are in `velorail-agent-roles.json`. These are VeloRail domain roles, not active Overstory capabilities.
