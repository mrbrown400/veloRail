# VeloRail Frontend Redesign Project Plan

## Project Goal

Make VeloRail feel closer to Google Maps for search, routing, route results, map controls, and mobile interactions while preserving the product identity that Google Maps does not provide: car-free mixed-mode routing, future transit overlays, visionary scenarios, nationalized or freight-rail passenger conversion concepts, and source-backed planning metadata.

The redesign stays on the existing React, Vite, TypeScript, and Google Maps Platform stack unless later evidence proves a blocker and the owner approves a documented decision. This setup milestone does not implement frontend changes, change routing algorithms, replace Google Maps, or create a second task tracker.

## Milestone Sequence

| Order | Milestone | Lead issue | May start when | Required artifacts |
| --- | --- | --- | --- | --- |
| 1 | Setup and Project Planning | MBR-56 | Linear project and milestone structure exists. | Project plan, decision log, success metrics and gate matrix, risk register. |
| 2 | Current App + Repo Analysis | MBR-57 | MBR-56 setup artifacts exist and Google Maps-first constraints are visible. | Current architecture inventory, file and data-flow map, current UX gap list, risk notes. |
| 3 | Google Maps UX/API Research | MBR-58 | MBR-57 has identified current app surfaces and constraints. | Parity research brief, API feasibility notes, VeloRail-specific divergence list, risk and implementation implications. |
| 4 | Figma + Design System Planning | MBR-59 | MBR-57 and MBR-58 findings are available. | Figma-ready flow list, component inventory, token and responsive requirements, accessibility requirements. |
| 5 | Unified Product/Design Specification | MBR-60 | MBR-57, MBR-58, MBR-59, and the risk register are ready for synthesis. | Approved product/design spec, state requirements, traceability table, launch criteria and validation gates. |
| 6 | Linear Issue Breakdown | MBR-61 | MBR-60 is owner-approved for breakdown. | Implementation-ready issue set, dependency sequence, gate labels or gate notes, prompt-ready child issue bodies. |
| 7 | Core Frontend Implementation | MBR-62 | MBR-60 is approved and MBR-61 has scoped implementation slices. | Scoped frontend changes, tests, browser coverage for changed flows, gate evidence. |
| 8 | Mobile and Interaction Polish | MBR-63 | Relevant MBR-62 slices are substantially complete. | Mobile, touch, keyboard, focus, panel, and gesture polish, responsive browser evidence, follow-up risks. |
| 9 | QA, Regression Tests, and Launch Readiness | MBR-64 | MBR-60, MBR-62, MBR-63, and required child issues are complete enough to verify. | Final QA checklist, quality and browser gate results, regression summary, launch-readiness handoff. |

## Owner Review Checkpoints

| Checkpoint | Owner review question | Required before moving on |
| --- | --- | --- |
| Setup review | Does the project plan preserve Google Maps-first architecture and VeloRail identity? | MBR-56, MBR-65, MBR-66, and MBR-67 artifacts are committed or linked from Linear. |
| Analysis review | Does the audit name the actual files, tests, state stores, and current UX risks? | MBR-57 output is accepted before research and design planning depend on it. |
| Research review | Which Google Maps UX/API behaviors should VeloRail match, reuse, or deliberately diverge from? | MBR-58 has visual, interaction, and API parity recommendations plus API risk notes. |
| Design-system review | Are the Figma flows, component inventory, tokens, responsive model, and accessibility rules specific enough for spec writing? | MBR-59 output is accepted or explicit gaps are documented. |
| Spec approval | Is the unified spec implementation-ready and clear about out-of-scope items? | MBR-60 is approved before MBR-61 splits implementation work. |
| Issue-breakdown review | Are implementation slices small enough for reviewable branches and testable gates? | MBR-61 issues include dependencies, acceptance criteria, and gate expectations. |
| Implementation review | Does each slice keep Google Maps as the base runtime and preserve car-free route identity? | MBR-62 child work runs the required quality and browser gates. |
| Mobile polish review | Do panels, controls, route results, metadata, and map gestures work without overlap on mobile? | MBR-63 verifies target viewports and keyboard/focus behavior. |
| QA review | Is launch ready, ready with follow-ups, or blocked? | MBR-64 includes final gate evidence, known gaps, and a clear launch recommendation. |

## Sub-Issue Resolution

The setup sub-issues are resolved by these durable docs:

| Issue | Planning question | Durable artifact |
| --- | --- | --- |
| MBR-65 | Where do decisions live, and when does owner review happen? | `docs/frontend/redesign-decision-log.md` plus the review checkpoint sections in this plan. |
| MBR-66 | How will success and verification be measured? | `docs/frontend/redesign-success-metrics-and-gates.md`. |
| MBR-67 | What risks and dependencies constrain the redesign? | `docs/frontend/redesign-risk-register.md`. |

Later milestone prompts should resolve their sub-issues by producing the artifact named in their Linear issue, then linking that artifact from the parent issue comment. For docs, research, design, and spec work, the artifact may be a repo doc or a Linear comment. For implementation and QA work, the artifact must also include gate output and PR or branch references when GitHub work exists.

## Branch Policy

All project work stays on `feature/velorail-frontend-redesign-google-maps-parity` unless the owner explicitly asks for a different branch strategy. Include the relevant Linear issue key in commit messages and PR descriptions when committing or opening GitHub reviews.

Implementation slices may use Codex worktrees or subthreads for concurrency, but final integration for this project branch should preserve a coherent branch history and a single source of truth for redesign artifacts.

## Plugin And Tool Policy

Use tools where they fit the work:

| Tool or plugin | Use for | Avoid using for |
| --- | --- | --- |
| Linear | Issue context, milestone state, owner-visible summaries, completion comments, follow-up issues. | Replacing repo docs or storing long-lived architecture decisions only in comments. |
| GitHub | Branch, commit, PR, review, and CI workflow once code or docs are ready for review. | Creating a second planning surface that diverges from Linear. |
| Browser | Manual or interactive verification of browser-facing flows, local app inspection, screenshots, and responsive checks. | Replacing checked-in Playwright gates. |
| Figma | Design flow inspection or design production when the milestone calls for it. | Blocking planning work when a text flow list is sufficient as a fallback. |
| Build Web Apps | Frontend implementation, UI debugging, React guidance, and browser test workflows when code changes begin. | Design or planning work that does not need app implementation. |

## Parallel-Agent Policy

Use parallel agents for independent research, audit, design comparison, and test triage. The main agent coordinates scope, keeps write ownership clear, integrates the findings, and performs final verification.

For write-heavy work, agents may only edit disjoint files or modules. For planning work, agents should return synthesized findings rather than raw logs. Linear comments and final repo docs are written by the main agent after review.

## Project Boundaries

- Google Maps remains the base map, gesture, viewport, marker, polyline, and control runtime where feasible.
- VeloRail may own future, visionary, freight, nationalized, GTFS, scoring, and scenario data when Google Maps does not expose those planning surfaces.
- Fallback providers must stay resilience tools or feature-gap exceptions, not replacements for Google Maps.
- Browser-facing changes require strict browser verification unless the issue is explicitly docs-only, data-only, or gate-labeled otherwise.
- `docs/agentic/legacy/` is historical migration material only and is not an active workflow source.
