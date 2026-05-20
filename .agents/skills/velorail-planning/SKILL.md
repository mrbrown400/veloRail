---
name: velorail-planning
description: Use for VeloRail task plans, migration plans, architecture decisions, and Linear issue planning.
---

# VeloRail Planning

Use this skill before changing shared data models, map-layer contracts, routing assumptions, or browser-facing architecture.

## Inputs

- Relevant Linear issue or legacy ID.
- Current files and docs that own the behavior.
- Any source/provenance constraints for custom transit data.

## Planning Format

1. State the user-facing or agent-facing outcome.
2. List the files or modules likely to change.
3. Call out Google Maps API boundaries and custom VeloRail logic.
4. Define acceptance criteria before implementation.
5. Identify tests and browser checks.
6. Put durable architecture decisions in `docs/architecture/` or `docs/agentic/`.

Keep plans short enough to execute. Put active task plans in Linear issue descriptions or comments when Linear write access is available.

## Skill And Harness Changes

When planning workflow or skill edits, preserve the focused Agent Skills-style `SKILL.md` shape, keep behavior repo-local, and require explicit harness-curation review before adding runtime infrastructure.

Use `docs/agentic/templates/linear-issue-spec.md` for new Linear issue bodies and `docs/agentic/templates/implementation-plan.md` for larger implementation plans. These templates are static references derived from the useful parts of spec-driven development; they do not add a second tracker or runtime.

For larger tasks, use this spec-driven shape:

```markdown
## Outcome

## Context

## Requirements

## Acceptance Criteria

## Files Likely To Change

## Verification

## Risks And Non-Goals
```

Use `github/spec-kit` only as a reference for this structure. Do not introduce a second task tracker or a new spec runtime unless a Linear issue explicitly asks for that pilot.
