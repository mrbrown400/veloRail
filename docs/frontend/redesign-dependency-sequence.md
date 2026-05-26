# Redesign Dependency Sequence

Issue: MBR-61
Sub-issue covered: MBR-81
Branch: `feature/velorail-frontend-redesign-google-maps-parity`
Local repo: `/Users/kylebrown/veloRail`
Scope: dependency and execution planning only. No frontend code, QA execution, or Figma work changed.

## Sequence

1. MBR-83: implement redesigned search and route-entry shell.
2. MBR-84: implement route results and itinerary panel once MBR-83 search-to-results state is stable.
3. MBR-85: implement map controls and overlay control redesign. This can overlap with MBR-83 or MBR-84 if file ownership is controlled.
4. MBR-86: polish mobile route search and bottom-sheet behavior after MBR-83 and MBR-84.
5. MBR-87: polish mobile map controls, overlay controls, and gestures after MBR-85.
6. MBR-88: polish keyboard, focus, and accessibility interactions after MBR-83 through MBR-87 are substantially merged.
7. MBR-89: expand browser regression coverage after selectors and flows stabilize through MBR-88.
8. MBR-90: run full quality and browser gates after MBR-89.
9. MBR-91: prepare launch-readiness handoff after MBR-89 and MBR-90.

## Parallelizable Groups

| Group | Issues | Conditions |
| --- | --- | --- |
| Core split | MBR-83 and MBR-85 | Safe in parallel when MBR-83 owns search/routing files and MBR-85 owns map/overlay files. Coordinate shared CSS tokens and mobile surface decisions before merging. |
| Read-only route prep | MBR-84 while MBR-83 is active | Route-contract and browser-test audit can start early. Write work should wait until MBR-83 route/search state decisions settle. |
| Mobile polish split | MBR-86 and MBR-87 | Safe after core dependencies land. Coordinate bottom-surface state, z-index, `uiStore`, `MapContainer`, and shared CSS. |
| Accessibility audit | MBR-88 read-only before MBR-86/87 finish | Early audit can find risks. Cross-cutting fixes should wait until major UI files settle. |
| Browser test planning | MBR-89 read-only before MBR-88 finishes | Test matrix and fixture planning can start early. Durable test implementation waits for stable selectors and flows. |

## Non-Parallelizable File Conflicts

| Area | Conflicting issues | Reason |
| --- | --- | --- |
| Search state and route submission | MBR-83, MBR-84, MBR-86, MBR-88, MBR-89 | These issues can all touch `routeStore`, `uiStore`, route feedback, and browser selectors. MBR-83 should establish the route-entry state contract first. |
| Results panel and mobile sheets | MBR-84, MBR-86, MBR-88, MBR-89 | Route detail, close/reopen, sheet heights, keyboard behavior, and test selectors overlap. |
| Map container and overlay metadata | MBR-85, MBR-87, MBR-88, MBR-89 | Layer controls, metadata, focus return, gesture safety, z-index, and source-link tests overlap. |
| Shared styles | MBR-83 through MBR-89 | `src/styles/design-system.css` and `src/styles/google-maps-theme.css` should have one integration owner at a time. |
| Browser regression suite | MBR-83 through MBR-90 | Issue-tagged tests should be added by implementation issues where practical, then consolidated by MBR-89. |

## Owner Checkpoints

| Checkpoint | When | Decision |
| --- | --- | --- |
| Core state checkpoint | After MBR-83 | Confirm endpoint raw/selected/resolved state, route calculation feedback, and service-area behavior are stable before MBR-84 writes. |
| Route-results checkpoint | After MBR-84 | Confirm selected route, route card, route detail, and `RouteOverlay` synchronize through the same selected route source. |
| Overlay checkpoint | After MBR-85 | Confirm `mapOverlayStore` remains the source of truth and official, visionary, freight, and conversion boundaries remain visible. |
| Mobile coordinator checkpoint | Before merging MBR-86 and MBR-87 together | Confirm one bottom-surface model, sheet priority, route-fit padding, and Google controls/attribution safety. |
| Accessibility checkpoint | During MBR-88 | Confirm Escape priority, focus return, labelled regions, `aria-pressed`, field errors, status/alert semantics, and keyboard metadata access. |
| QA checkpoint | During MBR-90 | Classify failures as product regression, test gap, flaky test, Maps/API environment blocker, Playwright/runtime issue, preview-port issue, or known launch blocker. |
| Launch checkpoint | During MBR-91 | Recommend `ready`, `ready with follow-ups`, or `blocked` with exact evidence. |

## Local Branch And Commit Strategy

Use the dedicated branch `feature/velorail-frontend-redesign-google-maps-parity` for all downstream work. Keep local changes scoped to the active issue and do not touch unrelated dirty files. Do not reset or discard local commits.

Recommended commit flow:

1. Start each issue by verifying `pwd`, `git status --short`, `git branch --show-current`, and `git remote -v`.
2. Keep one writer in the main checkout unless a separate temporary worktree is created for a disjoint slice.
3. Make focused commits with `MBR-<id>` in the message.
4. Before committing, inspect `git status --short`, `git diff --check`, and `git diff --cached --name-only`.
5. Run the issue's required gates before handoff, or document exact blockers.
6. Do not push until the owner explicitly asks. A push is appropriate after owner request, or after MBR-90 passes and MBR-91 recommends a PR or launch handoff.

## Linear Dependency Recommendations

Use existing issues instead of creating duplicates. If Linear blocker relations are applied later, prefer:

- MBR-83 and MBR-84 block MBR-86.
- MBR-85 blocks MBR-87.
- MBR-83, MBR-84, MBR-85, MBR-86, and MBR-87 block MBR-88.
- MBR-83 through MBR-88 block MBR-89.
- MBR-89 blocks MBR-90.
- MBR-89 and MBR-90 block MBR-91.

Do not assign or delegate issues as part of this milestone.

## Task-Gate Limitation Handling

The local task gate reads `.linear/migration.json` and does not query Linear live for unmapped issue IDs. If `npm run task:gate -- <issue-id> --explain` fails because an MBR issue is missing from `.linear/migration.json`, record that exact limitation in the issue handoff and continue with the other required gates.
