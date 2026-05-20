# Codex Skill Discovery

Use `ComposioHQ/awesome-codex-skills` and similar catalogs as discovery inputs only. Do not install a bundle into VeloRail.

## Intake Flow

1. Identify the VeloRail workflow gap.
2. Check whether Codex, Linear, GitHub, Browser/Chrome, Playwright, `rg`, TypeScript, existing repo docs, or existing skills already cover it.
3. Review the candidate skill's source, commands, files, and network or credential expectations.
4. Prefer a static repo-local `SKILL.md` adaptation over a runtime install.
5. Run a bounded benchmark on one real VeloRail task before adopting it.
6. Record the decision in `docs/agentic/phase-1-codex-harness.md` or a Linear issue comment.

## Adoption Bar

Adopt a skill only when it is:

- Narrow and directly useful for VeloRail.
- Portable to local Codex and Codex cloud.
- Clear about verification evidence.
- Low overlap with existing tools.
- Free of hidden daemons, databases, broad hooks, or orchestration layers.

## Default Decisions

- Catalog entry with useful wording: adapt the wording into a repo-local skill or template.
- Skill pack with many unrelated domains: reject for VeloRail.
- Skill that wraps an existing Codex plugin: reject unless it adds VeloRail-specific decisions.
- Skill that requires a service, database, or MCP server: pilot outside VeloRail first.
