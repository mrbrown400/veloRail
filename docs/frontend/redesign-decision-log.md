# VeloRail Frontend Redesign Decision Log

This log records decisions that affect more than one issue, constrain future implementation, alter verification gates, change architecture or UX direction, or would surprise a future agent reading only the repo. Issue-local status, temporary blockers, and tactical implementation notes can stay in Linear unless they become durable project guidance.

## Status Values

- `Approved`: accepted as project guidance.
- `Proposed`: needs owner review before becoming binding.
- `Superseded`: replaced by a later decision.
- `Rejected`: considered and not adopted.

## Decision Log

| ID | Date | Status | Milestone / Issue | Decision | Rationale | Owner / Reviewers | Affected Areas | Verification / Checkpoint | Links |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| REDESIGN-001 | 2026-05-22 | Approved | Setup / MBR-65 | Keep Google Maps as the base map/runtime. | VeloRail's architecture policy requires Google Maps Platform as the default rendering, routing, location, marker, polyline, and map-control surface. | Project owner, engineering | Map runtime, routing display, overlays, browser QA | Confirm against `docs/architecture/google-maps-first-policy.md` during spec and implementation review. | MBR-56, MBR-65 |
| REDESIGN-002 | 2026-05-22 | Approved | Setup / MBR-65 | Keep React, Vite, and TypeScript unless later evidence proves a blocker. | The current repo map, package scripts, and frontend entrypoint are built around React, Vite, TypeScript, Zustand, React Query, and Google Maps libraries. A stack change is outside this planning milestone. | Project owner, engineering | App shell, components, styles, tests | Revisit only if MBR-57 or MBR-58 documents a concrete blocker and the owner approves a new decision. | MBR-56, MBR-57 |
| REDESIGN-003 | 2026-05-22 | Approved | Setup / MBR-65 | Preserve car-free route identity. | Google Maps parity is a UX target, not a product identity replacement. Bike plus rail, walk plus rail, safety, transfers, and non-car framing stay first-class. | Project owner, design, engineering | Search, route results, itinerary, copy, metrics | MBR-60 spec must name which behaviors match Google Maps and which remain VeloRail-specific. | MBR-56, MBR-60 |
| REDESIGN-004 | 2026-05-22 | Approved | Setup / MBR-65 | Preserve future, visionary, and nationalized overlays. | These planning overlays are VeloRail-owned surfaces that Google Maps does not natively provide. They must remain distinct from current Google Maps transit service. | Project owner, design, engineering | Overlay controls, metadata, legend, route context | Overlay metadata must keep classification, status, confidence, source, uncertainty, and disclaimers visible. | MBR-56, MBR-60, MBR-64 |
| REDESIGN-005 | 2026-05-22 | Approved | Setup / MBR-65 | Use repo docs and Linear as durable context. | Linear tracks active work and owner-visible status. Repo docs hold decisions, architecture constraints, gates, and artifacts that future agents need locally. | Project owner, engineering | Planning docs, Linear comments, handoffs | Each milestone comment should link the repo artifact or summarize if the artifact is a Linear comment. | MBR-56, MBR-61 |
| REDESIGN-006 | 2026-05-22 | Approved | Setup / MBR-65 | Use the dedicated branch for all project work. | Keeping setup, planning, implementation, and QA work on `feature/velorail-frontend-redesign-google-maps-parity` reduces drift and keeps review context coherent. | Project owner, engineering | Git branch, PRs, commits | Check branch before editing or committing. Include issue keys in commits and PRs when used. | MBR-56 |
| REDESIGN-007 | 2026-05-22 | Approved | Setup / MBR-65 | Store redesign planning artifacts under `docs/frontend/`. | `docs/ui/` contains prior UI audit artifacts. The redesign project needs canonical planning docs tied to the current Linear project without rewriting older UI history. | Project owner, engineering | Project plan, decision log, metrics, risk register | Link `docs/frontend/` artifacts from Linear setup issues. | MBR-56, MBR-65 |

## Decisions Needing Owner Review

| ID | Milestone | Decision needed | Options evaluated | Current status | Resolution or next checkpoint |
| --- | --- | --- | --- | --- | --- |
| REDESIGN-OPEN-001 | MBR-57 / MBR-58 | What exact behaviors define Google Maps UX parity for VeloRail? | Search behavior, route comparison, route result hierarchy, map controls, layer controls, place feedback, mobile bottom sheet patterns. | Resolved by MBR-60 | Parity means Google-like interaction clarity and API reuse where feasible, while VeloRail keeps car-free route families, planning overlays, metadata provenance, and custom route rendering. |
| REDESIGN-OPEN-002 | MBR-59 / MBR-60 | How binding are Figma artifacts for implementation? | Visual reference, design-system source of truth, acceptance artifact, or text spec fallback. | Resolved by MBR-60 | With no Figma file/workspace available, MBR-59 Markdown docs and MBR-60 specs are binding. Future linked Figma frames are visual references unless owner-approved as acceptance artifacts. |
| REDESIGN-OPEN-003 | MBR-59 / MBR-63 | What is the mobile interaction model? | Persistent search shell, bottom sheet, drawer, modal panel, or hybrid. | Resolved by MBR-60 | Use one coordinated bottom-surface model with search, collapsed/half/full route sheets, layer sheet, metadata sheet, and modal-only focus trapping when needed. |
| REDESIGN-OPEN-004 | MBR-60 | How should driving appear, if at all? | Remove, hide by default, mark comparison-only, or keep as explicit fallback. | Resolved by MBR-60 | Driving may remain visible only as a comparison benchmark and must be visually quieter than Bike + Rail and Walk + Rail. |
| REDESIGN-OPEN-005 | MBR-60 / MBR-64 | What browser and accessibility target matrix is required beyond Chromium Playwright? | Current Chromium only, mobile viewport emulation, WebKit, manual device pass, accessibility scanner, or screen-reader spot check. | Resolved for implementation baseline | Require quality, task gate, issue-tagged Chromium Playwright for browser-facing issues, and mobile viewport checks at 390 by 844 and 430 by 932. MBR-64 may add WebKit, screen-reader, or scanner passes for final launch readiness. |
| REDESIGN-OPEN-006 | MBR-61 | What approval threshold is required for project-wide changes? | Single owner approval, product plus engineering, design plus engineering, or all three. | Open | Issue-breakdown review before MBR-62 starts. |

## Review Checkpoints

| Checkpoint | Milestone | Review output |
| --- | --- | --- |
| Analysis checkpoint | MBR-57 | Current UI inventory, file map, data-flow map, tests, styles, pain points, and parity conflicts are documented. |
| Google Maps research checkpoint | MBR-58 | Native Maps, Routes, Places, Geocoding, Transit Layer, Bicycling Layer, markers, polylines, and control options are reviewed before custom exceptions are approved. |
| Figma/design-system checkpoint | MBR-59 | Tokens, component rules, responsive behavior, accessibility expectations, Figma flow list, and source-of-truth expectations are clear. |
| Spec approval checkpoint | MBR-60 | The unified spec resolves open decisions, updates this log, and states non-goals before implementation issues are finalized. |
| Implementation checkpoint | MBR-62 | Each implementation issue names scoped files, acceptance criteria, test tags, and Google Maps-first boundaries. |
| Mobile polish checkpoint | MBR-63 | Mobile viewport behavior, panel collisions, map attribution safety, focus behavior, Escape behavior, and route visibility are reviewed. |
| QA checkpoint | MBR-64 | `npm run quality`, strict browser tests, task gate output, regression notes, and launch blockers are summarized before readiness signoff. |

## What Must Be Logged

Log decisions in this file when they:

- Affect multiple Linear issues or milestones.
- Change architecture, UX direction, verification gates, or launch criteria.
- Add, reject, or replace a provider, library, design pattern, or testing strategy.
- Change the relationship between Google Maps parity and VeloRail-specific behavior.
- Supersede older docs under `docs/ui/`, `docs/architecture/`, or `docs/agentic/`.

Keep decisions in Linear comments when they are issue-local status, a temporary blocker, a one-branch test result, or a reversible tactical implementation choice. Promote the comment into this log if it becomes reusable project guidance.
