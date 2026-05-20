# Implementation Plan Template

Use this static plan format for VeloRail tasks that need more structure than a short Linear comment. Keep active plans in Linear when possible, and keep durable decisions in `docs/architecture/` or `docs/agentic/`.

## Outcome

What should be true when this work is complete?

## Context

- Task ID:
- Relevant docs:
- Relevant code:
- Constraints:

## Requirements

- Requirement 1:
- Requirement 2:
- Requirement 3:

## Files Likely To Change

- `path/to/file.ts`
- `path/to/test.test.js`

## Steps

1. Inspect current behavior and owners.
2. Make the smallest scoped change that satisfies the requirements.
3. Update docs, skills, or architecture notes only when the task changes durable behavior.
4. Run the verification commands below.

## Acceptance Criteria

- Criteria 1:
- Criteria 2:
- Criteria 3:

## Verification

- `npm run task:gate -- <task-id> --explain`
- `npm run quality`
- Browser-facing work: `npm run test:browser:required -- --grep @<task-id>`

## Risks And Non-Goals

- Risk:
- Non-goal:
