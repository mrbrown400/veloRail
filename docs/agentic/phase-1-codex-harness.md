# Phase 1 Codex Harness

Phase 1 keeps VeloRail's agentic engineering harness small, inspectable, and Codex-native. It adopts useful ideas from the starred-repo evaluation as references first, not as new runtime dependencies.

## Baseline

VeloRail already has the active harness pieces it needs for current work:

- `AGENTS.md` for repo entry instructions.
- `.agents/skills/` for repeatable Codex workflows.
- Linear for task state.
- GitHub for branch, commit, pull request, and review flow.
- `docs/agentic/` and `docs/architecture/` for durable project knowledge.
- `npm run task:gate`, `npm run task:close`, `npm run quality`, and strict Playwright checks for verification.

## Adopted References

| Source | Phase 1 Use | Boundary |
| --- | --- | --- |
| `github/spec-kit` | Reference for spec shape, acceptance criteria, and task planning. | Do not add a second task tracker or spec runtime by default. |
| `agentskills/agentskills` | Reference for focused `SKILL.md` files and progressive disclosure. | Do not bulk import skills. |
| `ComposioHQ/awesome-codex-skills` | Discovery catalog for possible Codex skills. | Review individual skills before adoption. |
| Superpowers | Selective workflow support for planning, debugging, review, parallel investigation, and verification. | Do not duplicate VeloRail repo-local skills. |
| `1st1/lat.md` | Possible static Markdown repo-map pilot. | Reject if it requires a daemon, database, MCP server, or broad hook layer. |

## Static Implementations

Phase 1 imports ideas as checked-in Markdown, not as installed runtimes:

- `docs/agentic/templates/linear-issue-spec.md` gives Linear issues a spec and acceptance-criteria shape inspired by `github/spec-kit`.
- `docs/agentic/templates/implementation-plan.md` gives larger tasks a repeatable implementation-plan shape.
- `docs/agentic/skills-portability.md` records the Agent Skills portability standard for `.agents/skills/*/SKILL.md`.
- `docs/agentic/codex-skill-discovery.md` records the external skill-catalog intake process for sources such as `ComposioHQ/awesome-codex-skills`.
- `docs/agentic/repo-map-lattice.md` is the bounded static `lat.md`-style pilot that extends `docs/agentic/repo-map.md` with workstream relationships.

## Non-Goals

Do not add these to VeloRail by default:

- New daemon.
- New MCP server.
- New persistent harness database, vector store, or hidden memory layer.
- New orchestration UI.
- Alternate agent shell.
- Broad token optimizer that hides command output.

These belong in a global Codex harness experiment first. This policy does not ban product data storage or normal app infrastructure for VeloRail features. VeloRail should only adopt a new harness runtime after a bounded benchmark proves it fills a real gap and does not hide verification evidence.

## Mem Versus Repo Map

`docs/agentic/repo-map.md` is repo-local, checked in, reviewable, and available to both local Codex and Codex cloud. Use it for codebase shape, commands, known modules, and harness entrypoints.

Mem is cross-repo personal memory. Use it for user preferences and lessons that should follow the user across repositories. Do not make Mem the only source for VeloRail-specific operating rules because cloud agents, GitHub reviewers, and future local clones may not have that memory context.

## Intake Rule

Before adding any new skill, MCP server, memory layer, code indexer, or orchestration tool, use `.agents/skills/velorail-harness-curation/SKILL.md`.

The default answer is no unless the tool has:

1. A concrete VeloRail workflow gap.
2. Low overlap with Codex, Linear, GitHub, Browser/Chrome, Playwright, repo docs, and existing skills.
3. A small install and security surface.
4. A local and Codex-cloud-compatible path.
5. A benchmark proving it saves time or catches defects without hiding evidence.
