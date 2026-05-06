# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Project Summary

VeloRail is a React and TypeScript Vite app for Los Angeles multimodal routing. It compares bike plus rail, walk plus rail, bus or transit options, and driving routes on top of Google Maps.

The current web app entry point is `src/main.tsx`, which mounts `App.tsx` into `#root` from `index.html`.

## Build Commands

```bash
npm run dev        # Start Vite dev server, usually http://localhost:5173
npm run test       # Run the Node test suite
npm run lint       # Run repository style linting
npm run typecheck  # TypeScript project build check
npm run build      # Production build to dist
npm run quality    # Full configured gate for agents
npm run preview    # Preview production build
npm run issue:gate -- <id> --explain  # Preview Seeds close gates
npm run issue:close -- <id> --reason "..."  # Close after gates pass
```

`npm run quality` is the required gate after code changes. It runs tests, style linting, TypeScript checking, and the production build.
Seeds issues must be closed through `npm run issue:close`; direct `sd close` and `sd update --status closed` are blocked for Overstory agents. Browser-facing issues automatically require strict Playwright verification, and feature-specific browser tests must include the issue tag in the test title, such as `@VR-101`.

## Agent Harness

This repo uses **Overstory** plus **Seeds**:

- Overstory is the orchestration layer. It manages agent roles, worktrees, mail, logs, merge flow, and swarm coordination.
- Seeds is the issue database. It stores work items, dependencies, statuses, and IDs that Overstory agents claim and close.

Useful commands:

```bash
sd ready             # Show available Seeds work
sd show <id>         # Inspect one issue
sd update <id> --status in_progress
npm run issue:close -- <id> --reason "..."
sd sync              # Stage and commit Seeds changes
ov status            # Show agents, worktrees, mail, and merge queue
ov doctor            # Check Overstory health
```

Overstory workers should not push directly. Worker branches are merged back through Overstory. The canonical repo should still be pushed from the orchestrator or main session after merges and quality gates pass.

## GitNexus

At session start, check GitNexus freshness:

```bash
npx gitnexus status
```

If it reports `stale`, run:

```bash
npx gitnexus analyze
```

Run the refresh before relying on GitNexus code navigation, impact analysis, or execution-flow answers. If the worktree has unrelated dirty generated documentation and the current task does not need GitNexus, defer the refresh rather than mixing generated edits into unrelated work.

## Architecture

### Entry Points

- `index.html` loads `/src/main.tsx`.
- `src/main.tsx` creates the React root and installs the React Query provider.
- `src/App.tsx` loads the Google Maps script, initializes Places support, and renders the map, search card, and results sidebar.

### UI Components

- `src/components/Map/MapContainer.tsx` owns the Google map surface.
- `src/components/Map/RouteOverlay.tsx` draws route legs and markers.
- `src/components/Map/VehicleMarker.tsx` renders tracked vehicle positions.
- `src/components/Search/SearchCard.tsx` coordinates origin, destination, mode, time, and bike preference controls.
- `src/components/Search/PlaceAutocomplete.tsx` wraps Google Places search.
- `src/components/Results/ResultsSidebar.tsx` and related files render route options and details.

### State and Hooks

- `src/stores/routeStore.ts` stores routes, selected route, loading state, errors, and search parameters.
- `src/stores/uiStore.ts` stores sidebar and search UI state.
- `src/stores/realtimeStore.ts` stores vehicle tracking state.
- `src/hooks/useRouting.ts` calls the routing service and writes results into stores.
- `src/hooks/useGeolocation.ts`, `useAutocomplete.ts`, and `useVehicleTracking.ts` isolate browser and API behavior from UI components.

### Services

- `src/services/routing.ts` exposes `compareRoutes` and shared routing helpers.
- `src/services/multimodalRouter.ts` builds bike plus rail, walk plus rail, and driving options using Google route data where available.
- `src/services/googleRoutesService.ts` wraps Google Directions and polyline handling.
- `src/services/geocoding.ts` handles Google Places and geocoding.
- `src/services/geolocation.ts` handles browser location.
- `src/services/elevationService.ts` and `bikeDurationService.ts` adjust bike timing and safety related estimates.
- `src/services/stationDataProvider.ts` and `smartStationSelector.ts` provide station lookup and station choice logic.

### Data

- `src/data/transitLines.ts` is the current typed transit line and station source.
- Legacy JavaScript modules still exist under `src/` for older routing, GTFS, and realtime code. Before editing a legacy `.js` file, verify whether the React TypeScript path still uses it.

## Runtime Configuration

Configuration lives in `src/services/config.ts` and uses Vite environment variables:

- `VITE_GOOGLE_MAPS_API_KEY` is required for the current map and Places experience.
- `VITE_ORS_API_KEY` is optional.
- `VITE_SWIFTLY_API_KEY`, `VITE_SWIFTLY_TRIP_UPDATES_URL`, and `VITE_SWIFTLY_VEHICLE_POSITIONS_URL` support LA Metro realtime data.
- `VITE_METROLINK_API_KEY` supports Metrolink realtime data.

The Vite dev server proxies Swiftly and Metrolink paths through `vite.config.ts` to avoid browser CORS issues during local development.

## Working Rules

- Prefer the React and TypeScript files for current app behavior.
- Keep route calculation logic in services and state coordination in hooks or stores.
- Do not add new harness systems without removing or documenting the old one.
- If code changed, run `npm run quality` before handing off.

<!-- gitnexus:start -->
# GitNexus MCP

This project is indexed by GitNexus as **veloRail** (851 symbols, 2153 relationships, 65 execution flows).

## Always Start Here

1. **Read `gitnexus://repo/{name}/context`** — codebase overview + check index freshness
2. **Match your task to a skill below** and **read that skill file**
3. **Follow the skill's workflow and checklist**

> If step 1 warns the index is stale, run `npx gitnexus analyze` in the terminal first.

## Skills

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

<!-- canopy:start -->
## Prompt Management (Canopy)
<!-- canopy-onboard-v:1 -->

This project uses [Canopy](https://github.com/jayminwest/canopy) for git-native prompt management.

**At the start of every session**, run:
```
cn prime
```

This injects prompt workflow context: commands, conventions, and common workflows.

**Quick reference:**
- `cn list` — List all prompts
- `cn render <name>` — View rendered prompt (resolves inheritance)
- `cn emit --all` — Render prompts to files
- `cn update <name>` — Update a prompt (creates new version)
- `cn sync` — Stage and commit .canopy/ changes

**Do not manually edit emitted files.** Use `cn update` to modify prompts, then `cn emit` to regenerate.
<!-- canopy:end -->

<!-- mulch:start -->
## Project Expertise (Mulch)
<!-- mulch-onboard-v:3 -->

This project uses [Mulch](https://github.com/jayminwest/mulch) for structured expertise management.

**At the start of every session**, run:
```bash
ml prime
```

Injects project-specific conventions, patterns, decisions, failures, references, and guides into
your context. Run `ml prime --files src/foo.ts` before editing a file to load only records
relevant to that path (per-file framing, classification age, and confirmation scores included).

For monolith projects where dumping every record wastes context, set
`prime.default_mode: manifest` in `.mulch/mulch.config.yaml` (or pass `--manifest`) to emit a
quick reference + domain index. Agents then scope-load with `ml prime <domain>` or
`ml prime --files <path>`.

**Before completing your task**, record insights worth preserving — conventions discovered,
patterns applied, failures encountered, or decisions made:
```bash
ml record <domain> --type <convention|pattern|failure|decision|reference|guide> --description "..."
```

Evidence auto-populates from git (current commit + changed files). Link explicitly with
`--evidence-seeds <id>` / `--evidence-gh <id>` / `--evidence-linear <id>` / `--evidence-bead <id>`,
`--evidence-commit <sha>`, or `--relates-to <mx-id>`. Upserts of named records merge outcomes
instead of replacing them; validation failures print a copy-paste retry hint with missing fields
pre-filled.

Run `ml status` for domain health, `ml doctor` to check record integrity (add `--fix` to strip
broken file anchors), `ml --help` for the full command list. Write commands use file locking and
atomic writes, so multiple agents can record concurrently. Expertise survives `git worktree`
cleanup — `.mulch/` resolves to the main repo.

### Before You Finish

1. Discover what to record (shows changed files and suggests domains):
   ```bash
   ml learn
   ```
2. Store insights from this work session:
   ```bash
   ml record <domain> --type <convention|pattern|failure|decision|reference|guide> --description "..."
   ```
3. Validate and commit:
   ```bash
   ml sync
   ```
<!-- mulch:end -->
