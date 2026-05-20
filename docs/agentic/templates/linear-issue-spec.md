# Linear Issue Spec Template

Use this as a static issue-body template for new VeloRail Linear work. It borrows the useful spec shape from `github/spec-kit` without adding another task system or runtime.

## Outcome

Describe the user-facing or agent-facing result in one short paragraph.

## Context

- Current behavior:
- Relevant files:
- Related Linear issue or legacy ID:
- Source/provenance constraints:

## Requirements

- Requirement 1:
- Requirement 2:
- Requirement 3:

## Acceptance Criteria

- Given..., when..., then...
- Given..., when..., then...
- Verification evidence is attached or summarized before closeout.

## Non-Goals

- Out of scope:
- Do not change:

## Verification

- `npm run task:gate -- <task-id> --explain`
- `npm run quality`
- `npm run test:browser:required -- --grep @<task-id>` if browser-facing

## Notes

- Dependencies:
- Follow-up candidates:
