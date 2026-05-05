# Agent Instructions

This project uses **Overstory** for multi-agent orchestration and **bd** (Beads) for issue tracking.

Overstory and Beads are different layers:
- **Overstory** coordinates agents, worktrees, mail, logs, merges, and swarm roles.
- **Beads** stores the actual work items, dependencies, status, and issue IDs that Overstory agents claim and close.

Run `bd onboard` for Beads basics and `overstory status` to inspect active agents.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
bd export -o .beads/issues.jsonl  # Export issues for git
overstory status      # Inspect active agents and worktrees
```

## Quality Gates

If code changed, run:

```bash
npm run quality
```

This currently runs the placeholder test command, TypeScript static checks, and the production build. There is no dedicated unit test suite yet.

## GitNexus Freshness

At session start, run:

```bash
npx gitnexus status
```

If GitNexus reports the index is stale, run `npx gitnexus analyze` before relying on GitNexus code navigation, impact analysis, or execution flows. Do not run a refresh in the middle of unrelated dirty generated-doc edits unless the current task needs GitNexus.

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - `npm run quality`
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd export -o .beads/issues.jsonl
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

This project is indexed by GitNexus as **veloRail** (626 symbols, 1609 relationships, 49 execution flows).

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
