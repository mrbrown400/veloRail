---
name: velorail-harness-curation
description: Use before adding or evaluating agentic harness tools, Codex skills, MCP servers, memory stores, code indexers, or orchestration systems for VeloRail.
---

# VeloRail Harness Curation

Use this skill when a task proposes a new agentic-engineering tool or workflow dependency.

## Default Posture

VeloRail is Codex-native and intentionally small:

- Linear owns task state.
- GitHub owns branches, commits, pull requests, and review.
- `AGENTS.md` and `.agents/skills/` own repeatable agent workflow.
- `docs/agentic/` and `docs/architecture/` own durable project knowledge.
- `npm run task:gate`, `npm run quality`, and strict Playwright tests own verification.

Do not add an agentic harness daemon, MCP server, database, alternate agent shell, or orchestration UI by default. This does not ban product data storage or normal app infrastructure for VeloRail features.

## Approved Phase 1 References

- `github/spec-kit`: reference for issue/spec shape and acceptance criteria.
- `agentskills/agentskills`: reference for `SKILL.md` structure and progressive disclosure.
- `ComposioHQ/awesome-codex-skills`: discovery catalog only.
- Superpowers: use selectively when the installed skill directly fits the task.
- `1st1/lat.md`: possible static Markdown repo-map pilot only.

## Static Local Assets

- `docs/agentic/templates/linear-issue-spec.md`: spec and acceptance criteria template for Linear issues.
- `docs/agentic/templates/implementation-plan.md`: implementation plan template for larger tasks.
- `docs/agentic/skills-portability.md`: checklist for portable Agent Skills-style repo skills.
- `docs/agentic/codex-skill-discovery.md`: intake flow for external skill catalogs.
- `docs/agentic/repo-map-lattice.md`: static `lat.md`-style pilot for codebase relationships.

## Intake Checklist

Before recommending adoption, answer:

1. What VeloRail workflow is failing today?
2. Why do Codex, `rg`, TypeScript checks, Linear, GitHub, Browser/Chrome, Playwright, repo docs, and existing skills not already cover it?
3. What files, services, credentials, network access, hooks, or background processes would the tool add?
4. Can it run as static Markdown, an npm script, or a one-shot local command instead of a daemon, MCP server, or harness database?
5. How will the tool work in both local Codex and Codex cloud environments?
6. What benchmark proves the tool saves time or catches defects without hiding evidence?

Reject the tool for VeloRail if the answer is unclear.

## Where To Put Outcomes

- Put active work plans in Linear issue descriptions or comments.
- Put durable architecture decisions in `docs/architecture/`.
- Put agent workflow policy in `AGENTS.md`, `.agents/skills/`, or `docs/agentic/`.
- Put cross-repo personal memory in Mem only when it is useful outside VeloRail.
