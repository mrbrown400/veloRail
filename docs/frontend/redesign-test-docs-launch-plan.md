# Redesign Test, Documentation, And Launch Plan

Issue: MBR-61
Sub-issue covered: MBR-82
Branch: `feature/velorail-frontend-redesign-google-maps-parity`
Local repo: `/Users/kylebrown/veloRail`
Scope: test, documentation, and launch-readiness issue planning only. No tests, frontend code, Figma artifacts, or QA gates were executed for this plan.

## Test Coverage Expectations

MBR-89 is the first-class browser regression issue. It should add or consolidate issue-tagged Playwright coverage for the redesigned flows, using tags such as `@MBR-83` through `@MBR-89` where practical.

Required coverage areas:

- search collapsed-to-expanded origin repair;
- autocomplete loading, results, no-results, service-error, keyboard selection, and Escape behavior;
- typed fallback geocoding, service-area validation, field errors, degraded-provider messaging, and current-location states;
- route calculation loading, no-route, route error, and recovery;
- route cards, selected route detail, and selected polyline synchronization;
- route close/reopen behavior;
- layer grouping, active counts, comparison mode synchronization, legend, overlay toggle states, source notices, and metadata open/close;
- metadata source links, provenance, warnings, keyboard path, Escape close, and focus return;
- mobile sheet states at 390 by 844 and 430 by 932;
- transition behavior at 768 px width;
- desktop coexistence at 1440 by 900;
- Google controls and attribution overlap checks;
- reduced-motion and touch-target checks where automated checks are practical.

Existing useful browser tags include `@smoke`, `@VR-303`, `@VR-305`, `@VR-306`, `@VR-307`, `@VR-101`, and `@VR-104`. New tests should avoid depending on unstable live Google Maps or provider behavior where deterministic app state, mocks, or fixtures are practical.

## Documentation Expectations

MBR-91 owns launch-readiness documentation. It should update docs only when implementation changes durable behavior, run/test instructions, architecture decisions, or launch blockers.

Potential doc targets:

- `docs/frontend/velorail-frontend-redesign-spec.md` if implementation intentionally diverges from the approved spec;
- `docs/frontend/redesign-decision-log.md` when owner decisions change;
- `docs/frontend/redesign-risk-register.md` when launch blockers, mitigation, or dependency risks change;
- `docs/frontend/redesign-success-metrics-and-gates.md` when gates or targeted browser checks change;
- README or development docs only if run, setup, or verification commands change.

Do not use Figma as required documentation evidence. If a Figma frame later exists, it may be linked as optional visual reference only.

## Final QA Expectations

MBR-90 owns final gate execution and triage. It should run:

```bash
npm run quality
npm run test:browser:required
npm run test:browser:required -- --grep @<issue-id>
npm run task:gate -- <issue-id> --explain
```

Targeted greps should cover each completed browser-facing issue. The final triage should classify failures as:

- product regression;
- test gap;
- flaky test;
- missing Google Maps/API key or library environment;
- Playwright install or runtime issue;
- preview server or port issue;
- known launch blocker;
- accepted follow-up.

Every blocker should include the exact command, relevant failing output summary, owner decision needed if any, and the next issue or fix path.

## Launch Handoff Expectations

MBR-91 should produce an owner-readable handoff with:

- scope shipped by issue;
- spec traceability to MBR-60, MBR-77, MBR-78, and MBR-79;
- files and major surfaces changed;
- quality gate results;
- browser regression results;
- Browser/app screenshot notes where visual review was needed;
- known gaps and follow-up issues;
- owner decisions made after implementation;
- documentation updates made or intentionally skipped;
- recommendation: `ready`, `ready with follow-ups`, or `blocked`.

No launch, push, or PR action should occur unless explicitly requested by the owner.

## Browser And Playwright Visual Acceptance Workflow

For browser-facing issues, acceptance should use:

1. Markdown specs as the source of truth.
2. Local app state at `/Users/kylebrown/veloRail`.
3. Browser/app screenshots for visual review when a human-scale layout judgment is needed.
4. Playwright assertions for durable regression coverage.
5. Exact viewport notes for 1440 by 900, 768 px width, 430 by 932, and 390 by 844 when responsive behavior is in scope.

Figma is optional only. Do not block implementation, test, or launch-readiness work on Figma access, a Figma account, a workspace, a file URL, or a selected frame.

## Task-Gate Limitation Handling

The local task gate only resolves IDs listed in `.linear/migration.json`. If a downstream MBR issue is unmapped, the expected failure is:

```text
Task <issue-id> was not found in .linear/migration.json.
```

When that happens, record the exact command and limitation, then continue with the issue's other verification commands. Do not treat an unmapped local task gate as evidence that the Linear issue does not exist.

## Issue Set Decision

MBR-89, MBR-90, and MBR-91 are sufficient for test, gate, documentation, and launch-readiness work. Do not create duplicate QA issues for MBR-82 unless implementation later reveals a specific missing scope that cannot fit those issues.
