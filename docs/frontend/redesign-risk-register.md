# Frontend Redesign Risk Register

This register covers the setup and project planning milestone for the VeloRail Frontend Redesign and Google Maps UX Parity project. It should be updated when later milestones discover new blockers, change dependencies, or make an owner-approved decision that reduces or increases risk.

## Risk Register

| Risk | Severity | Likelihood | Owner / milestone | Mitigation | Dependency | Issue reference | Follow-up trigger |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Google Maps key or required libraries are unavailable in local, CI, or Browser verification. | High | Medium | API research and QA / MBR-58, MBR-64 | Confirm `VITE_GOOGLE_MAPS_API_KEY`, `places`, `geometry`, `routes`, and strict browser env before implementation QA. Document exact blocker when strict Maps tests fail. | App load, Playwright strict Maps mode, Google Maps script libraries | MBR-58, MBR-64 | `Error Loading Google Maps`, missing `/routes.js`, strict browser gate fails, API key missing. |
| Google Routes or Places behavior diverges from the product spec. | High | Medium | Research and implementation / MBR-58, MBR-62 | Research exact API capabilities, keep request construction in existing services, test request shape and visible route states. | `src/services/geocoding.ts`, `src/services/googleRoutesService.ts`, route result UI | MBR-58, MBR-62 | `InvalidValueError`, missing route fields, Place details failure, route results cannot support spec. |
| Fallback providers become de facto replacements for Google Maps. | High | Medium | Spec / MBR-60 | Document fallbacks as resilience or feature-gap exceptions only. Require owner-approved decision for any non-Google provider expansion. | Google Maps-first policy, geocoding and routing fallbacks | MBR-58, MBR-60 | Spec asks for provider-specific behavior or non-Google routing parity. |
| Browser verification is brittle, untagged, or skipped. | High | Medium | Issue breakdown and QA / MBR-61, MBR-64 | Add issue-tagged browser tests for browser-facing work, preserve `npm run quality`, use `npm run test:browser:required`, and document exact blockers. | Playwright config, API key, preview port 4174, task gate policy | MBR-61, MBR-64 | New browser-facing issue lacks a Playwright tag, strict run cannot start, or `task:gate` lists no usable browser command. |
| Mobile panels overlap map controls, Google attribution, or primary actions. | High | High | Design and polish / MBR-59, MBR-63 | Define one-active-panel rules, safe z-index behavior, route-fit padding, bottom sheet behavior, and viewport checks. | Search card, results panel, layer panel, metadata panel, Google Maps controls | MBR-59, MBR-63 | 390px viewport clips controls, hidden primary button, broken Escape or reopen path. |
| Route-result design exceeds the current route data contract. | High | Medium | Current analysis and implementation / MBR-57, MBR-62 | Inventory `Route` and `RouteLeg`; add display fields only when required and tested; avoid routing algorithm rewrite. | Route types, routing services, results components | MBR-57, MBR-62 | Spec needs fares, maneuvers, occupancy, richer alternatives, or new trip semantics not present in current contracts. |
| Overlay metadata blurs official, visionary, and hypothetical data. | High | Medium | Spec and QA / MBR-60, MBR-64 | Preserve metadata contract for status, classification, confidence, provenance, uncertainty, disclaimer, and source links. | Overlay registry, proposal data, official future validation, metadata panel | MBR-60, MBR-64 | Overlay renders without source/disclaimer, or speculative item reads as current service. |
| Figma availability or design-system planning is unavailable or too vague. | Medium | Medium | Design and spec / MBR-59, MBR-60 | Allow a Figma-ready text flow list as fallback. Require component, token, mobile, and accessibility inventory before spec approval. | Figma access, component inventory, CSS tokens, design-system decisions | MBR-59, MBR-60 | MBR-60 starts with unresolved component, token, or mobile sheet decisions. |
| Linear and GitHub workflow loses dependency sequencing. | Medium | Medium | Project and QA / MBR-61, MBR-64 | Break issues only after approved spec; include issue IDs, dependencies, gate labels or gate notes, branch/PR references, and completion comments. | Linear project, GitHub branch/PR review, task gates | MBR-61, MBR-64 | Implementation PR opens without MBR-60 traceability or browser-gate plan. |
| Google Maps parity dilutes VeloRail's car-free identity. | High | Medium | Product research and spec / MBR-58, MBR-60 | Explicitly list divergences where car-free routing, future overlays, freight scenarios, and planning metadata stay first-class. | UX parity research, product/design spec, route-result hierarchy | MBR-58, MBR-60 | Driving or generic Maps parity becomes the primary user story. |
| Accessibility polish is deferred until launch QA. | Medium | Medium | Design, spec, polish / MBR-59, MBR-63 | Put keyboard, focus, accessible names, status feedback, and screen-reader affordances into MBR-59 and MBR-60 before implementation starts. | Component inventory, browser tests, route panels, overlay controls | MBR-59, MBR-63 | MBR-63 finds missing labels, trapped focus, Escape gaps, or color-only states. |
| Documentation drifts from implementation. | Medium | Medium | Issue breakdown and QA / MBR-61, MBR-64 | Link artifacts from Linear, update decision log when decisions change, and require QA handoff to reference current docs. | `docs/frontend/`, Linear comments, PR descriptions | MBR-61, MBR-64 | PR or handoff cites stale `docs/ui/` assumptions without updating current redesign docs. |

## Dependency Map

| Issue | Milestone | Depends on | Produces | Blocks or informs |
| --- | --- | --- | --- | --- |
| MBR-57 | Current App + Repo Analysis | MBR-56 setup artifacts and repo access. | Current architecture inventory, file/data-flow map, test/style surface inventory, current UX gap list, implementation risk notes. | MBR-58, MBR-59, MBR-60. |
| MBR-58 | Google Maps UX/API Research | MBR-57 current-state findings and Google Maps-first policy. | Visual, interaction, and API parity targets; feasible Google Maps API opportunities; VeloRail-specific divergence list. | MBR-59, MBR-60, MBR-62, MBR-63. |
| MBR-59 | Figma + Design System Planning | MBR-57 and MBR-58. | Figma-ready flows, component inventory, token and style guidance, responsive and accessibility requirements. | MBR-60, MBR-62, MBR-63. |
| MBR-60 | Unified Product/Design Specification | MBR-56, MBR-57, MBR-58, MBR-59, and this risk register. | Implementation-ready spec, UI states, API assumptions, out-of-scope boundaries, traceability table, launch gates. | MBR-61, MBR-62, MBR-63, MBR-64. |
| MBR-61 | Linear Issue Breakdown | Owner-approved MBR-60. | Reviewable implementation, test, documentation, and launch-readiness issues with dependencies and gate expectations. | MBR-62, MBR-64 and child implementation/test issues. |
| MBR-62 | Core Frontend Implementation | MBR-60, MBR-61, and final design decisions from MBR-59. | Scoped search, route-entry, route-results, map-control, overlay-control, and shared component implementation with tests. | MBR-63, MBR-64. |
| MBR-63 | Mobile and Interaction Polish | MBR-60 and substantial MBR-62 completion. | Mobile, touch, keyboard, focus, panel, gesture, and accessibility polish with browser evidence. | MBR-64. |
| MBR-64 | QA, Regression Tests, and Launch Readiness | MBR-60, MBR-62, MBR-63, and child issues from MBR-61. | Final quality and browser gate evidence, regression summary, docs updates, launch recommendation. | Project launch decision and follow-up issues. |

## Out-Of-Scope Boundaries

- No routing algorithm rewrite. UI may expose existing route data more clearly, but route logic changes need their own issue and only when required to display existing data accurately.
- No alternate map provider, custom tile engine, or duplicate map runtime.
- No API billing, key, or quota changes in redesign planning issues.
- No treating future, visionary, freight, or nationalized overlays as current Google Maps transit service.
- No Google Maps UI scraping or treating basemap imagery as VeloRail source data.
- No broad redesign during QA. MBR-64 should file follow-ups instead of expanding scope.
