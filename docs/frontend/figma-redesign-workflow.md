# Figma Redesign Workflow

Issues: MBR-59, MBR-74, MBR-75, MBR-76
Milestone: Figma + Design System Planning
Verified: 2026-05-22 on `feature/velorail-frontend-redesign-google-maps-parity`
Scope: planning only. No frontend code, route behavior, design-system implementation, or final Figma production file changed.

## Figma Connector Status

The Figma plugin/MCP tools are available in this Codex session. The available Figma tool surface includes design and FigJam operations such as diagram generation, web-to-Figma capture, Figma metadata/design-context reads, screenshots, asset upload, and `use_figma` JavaScript execution.

No existing Figma file URL, node selection link, design system library, or target FigJam board was provided for this milestone. A standalone FigJam diagram generation was attempted for `VeloRail Search Routing Flow Map`, but the connector returned a missing plan target:

```text
You'll need to select a team or organization in the widget before I can generate your "VeloRail Search Routing Flow Map" diagram.
Once you pick the correct plan, the tool will create your FigJam diagram.
```

Because of that blocker, the durable deliverables for MBR-59 are the repo docs in `docs/frontend/`. Figma remains available for a later capture or board generation once a plan, file key, or selection URL is supplied.

## Running App Capture Path

If Figma capture is needed later, use this flow:

1. Start the app from the dedicated branch:

   ```bash
   npm run dev -- --host 127.0.0.1 --port 5173
   ```

2. Verify the target state in Browser or Playwright before capture. For the current single-page app, capture state must be prepared through normal interactions, fixture data, or later state harnesses because the URL alone does not encode route results, selected route details, layer panel state, or metadata panel state.

3. Use Figma web capture only after the visible state is correct. Preferred target URLs:

   - `http://127.0.0.1:5173/` for local dev.
   - `http://127.0.0.1:4174/` for preview if running through Playwright's default preview path.

4. Capture desktop and mobile separately. Minimum planning viewports:

   - Desktop: 1440 by 900.
   - Mobile: 390 by 844.
   - Mobile alternate: 430 by 932.

5. Treat generated Figma frames as visual references. The repo source still owns supported route data, overlay provenance, Google Maps runtime constraints, accessibility behavior, and verification gates.

## Figma Selection Links Later

When a Figma frame exists, paste the frame or node selection URL into the relevant Linear issue or repo doc. Use links in this shape:

```text
https://www.figma.com/design/<fileKey>/<fileName>?node-id=<node-id>
```

Codex should extract:

- `fileKey` from the `/design/<fileKey>/` URL segment.
- `nodeId` from the `node-id=` query parameter, converting hyphen form such as `1-2` to Figma node id `1:2` when needed.

Each linked Figma frame should include, in frame notes or adjacent annotations:

- Linear issue key.
- Frame name from `docs/frontend/figma-search-routing-flow-map.md`.
- React owner component.
- Store or service state represented.
- CSS surface or token family represented.
- Data-contract assumptions and unsupported fields.
- Verification expectation for later implementation.

## Figma-To-Code Handoff Rules

Figma is authoritative for:

- Layout density, hierarchy, frame composition, responsive arrangement, and visual rhythm.
- Component state intent such as selected, focused, loading, empty, error, collapsed, half, and full.
- Motion intent and sheet behavior, provided the implementation issue later confirms the state model.
- Visual contrast targets, spacing targets, and handoff annotations.

Repo source is authoritative for:

- React, Vite, TypeScript, Zustand, and CSS custom property architecture.
- Google Maps as the base map, gesture, viewport, marker, polyline, layer, and map-event runtime.
- `Route` and `RouteLeg` fields in `src/types/index.ts`.
- Search and route orchestration in `SearchCard`, `PlaceAutocomplete`, `useRouting`, and routing services.
- Overlay visibility and comparison state in `mapOverlayStore`.
- Overlay status, classification, confidence, uncertainty, provenance, and source links in `mapOverlayRegistry`.
- Test and gate commands.

Implementation handoff must include a frame-to-code table. Every frame should map to:

- Component owner.
- Store or state owner.
- CSS class or token owner.
- Data contract dependency.
- Browser or unit verification target.
- Explicit out-of-scope fields.

## When To Use Figma Context

Codex should read Figma context when:

- The user supplies a Figma file, frame, or selection link.
- An implementation issue says a Figma frame is approved and should be matched.
- A PR review asks whether code matches a specific Figma selection.
- The work is visual layout, spacing, responsive composition, or component state fidelity.

Codex should prefer repo source when:

- The question is whether a route fact, metadata field, overlay classification, or Google Maps API behavior is currently supported.
- The Figma frame suggests fares, platforms, alerts, stop counts, arrival times, live ETAs, same-mode alternatives, or other unsupported route facts.
- The work affects data contracts, source provenance, test gates, or Google Maps-first architecture.

## Fallback If Figma Access Is Unavailable

If Figma access is unavailable or blocked by missing plan/file context:

- Use the Figma-ready frame list in `docs/frontend/figma-search-routing-flow-map.md` as the source artifact.
- Keep component and token requirements in `docs/frontend/velorail-design-system-plan.md`.
- Keep visual-language requirements in `docs/frontend/velorail-visual-language-plan.md`.
- Record the exact Figma blocker in Linear.
- Do not block MBR-60 spec work if the repo docs are complete enough to define frames, states, component owners, and design-system requirements.

## Non-Goals

- No final Figma production file is required for MBR-59.
- No code generation from Figma is authorized by this milestone.
- No Tailwind, MUI, Angular, or framework migration is justified by the current planning evidence.
- No Figma frame may override Google Maps-first architecture or VeloRail's official-vs-visionary data boundaries.
