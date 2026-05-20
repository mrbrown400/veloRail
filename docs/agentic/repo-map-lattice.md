# Static Repo Map Lattice

This is the bounded `lat.md`-style pilot for VeloRail. It extends `docs/agentic/repo-map.md` with a static relationship map that an agent can scan before implementation. It does not add a daemon, database, MCP server, hook, indexer, or orchestration UI.

## How To Use

Start with the row that matches the task, then inspect the listed files and gates. If the task spans multiple rows, update every affected row when the ownership boundary changes.

## Lattice

| Workstream | Primary Owners | Durable Docs | Verification |
| --- | --- | --- | --- |
| App entry and shell | `src/main.tsx`, `src/App.tsx`, `src/styles/` | `AGENTS.md`, `docs/agentic/repo-map.md` | `npm run quality` |
| Map UI and overlays | `src/components/map/`, `src/components/MapContainer.tsx`, `src/store/mapOverlayStore.ts` | `docs/architecture/google-maps-first-policy.md` | `npm run quality`, strict browser tests |
| Search and results UX | `src/components/SearchCard.tsx`, `src/components/ResultsSidebar.tsx`, route services | `docs/architecture/` when behavior changes | `npm run quality`, route browser tests |
| Official future transit | `src/data/officialFutureTransitProposals.ts`, validation and monitor scripts | `docs/architecture/official-future-transit-dataset.md`, `docs/architecture/official-future-transit-update-workflow.md` | `npm run validate:official-future-transit`, `npm run quality` |
| Visionary and scenario data | `src/data/visionaryTransitProposals.ts`, scenario services | `docs/architecture/` | `npm run quality` |
| GTFS and routing comparison | `src/gtfs/`, `src/services/routingComparison.ts` | `docs/architecture/` | `npm run quality` |
| Agent harness | `AGENTS.md`, `.agents/skills/`, `docs/agentic/`, `scripts/build-repo-map.mjs` | `docs/agentic/phase-1-codex-harness.md` | `npm run agent:repo-map`, `git diff --check`, `npm run quality` when scripts change |
| Task migration and gates | `.linear/migration.json`, `scripts/task-gate.mjs`, `scripts/task-close.mjs` | `docs/agentic/codex-native-migration.md` | `npm run task:gate -- <task-id> --explain` |

## Agent Routing Rules

- For browser-facing work, read `velorail-map-ui` and `velorail-browser-verification` skills before editing.
- For transit data work, read `velorail-transit-data` before editing data or provenance docs.
- For harness changes, read `velorail-harness-curation` and keep the result static unless a Linear issue explicitly approves a runtime pilot.
- For closeout, read `velorail-release-closeout` and report any Linear, GitHub, or credential blocker directly.

## Maintenance

Update this file when a new major workstream, owner file, or gate becomes durable. Regenerate `docs/agentic/repo-map.md` afterward so agents see the lattice pointer in the main map.
