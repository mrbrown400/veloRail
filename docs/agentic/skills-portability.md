# Skills Portability Checklist

VeloRail repo-local skills should be portable between local Codex and Codex cloud. Use `agentskills/agentskills` as the structure reference, not as an installed dependency.

## Required Shape

- Store each skill in `.agents/skills/<skill-name>/SKILL.md`.
- Start with YAML front matter containing `name` and `description`.
- Keep the body task-specific and short enough for an agent to read before work.
- Prefer repo-local commands, files, and gates over machine-specific paths.
- Link to supporting docs instead of embedding long reference material.

## Progressive Disclosure

- Put high-frequency instructions in `SKILL.md`.
- Put examples, templates, or helper scripts in adjacent folders only when they are actually needed.
- Avoid broad bundled skill packs. Adopt one skill at a time after review.

## Portability Checks

- Works from a fresh clone with project dependencies installed.
- Does not depend on private local memory, a hidden database, a daemon, or a Claude-only command.
- Names exact verification commands.
- Says where durable output belongs: Linear, GitHub, `docs/agentic/`, `docs/architecture/`, or code.
- Avoids credentials unless the underlying product feature requires them.

## Review Questions

1. Does this skill remove repeated decision work for VeloRail?
2. Does Codex already cover the workflow without repo-local instructions?
3. Is the skill narrower than a general agent handbook?
4. Can another agent verify the outcome with checked-in files and commands?
