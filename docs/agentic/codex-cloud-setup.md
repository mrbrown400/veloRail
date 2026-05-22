# Codex Cloud Setup

Use this when configuring a Codex cloud environment for VeloRail. The goal is to make cloud tasks reproduce the same gates used by local Codex work without adding a second agentic harness.

## Environment

Use the default Codex `universal` image and pin the Node runtime to the version already checked into this repo:

```text
CODEX_ENV_NODE_VERSION=22.13.1
```

This matches `.node-version`, `.nvmrc`, and the package engine range `^20.19.0 || >=22.12.0`.

## Setup script

Configure the Codex cloud setup script as:

```bash
bash scripts/codex-cloud-setup.sh
```

The script verifies the Node version, runs `npm ci`, and installs the Chromium browser needed by Playwright. It does not create `.env`, write secrets, enable MCP servers, create code-index databases, or run agentic harness installers.

To run the local quality gate during setup cache creation, set:

```text
VELO_RAIL_CODEX_SETUP_VERIFY=1
```

Leave that unset for normal setup if you only want dependency installation.

## Environment variables

Google Maps is required for the main app and strict browser verification. If cloud browser tests need to run, set this as an environment variable available during the agent phase:

```text
VITE_GOOGLE_MAPS_API_KEY
```

Restrict the key in Google Cloud by API and allowed referrers wherever possible. Optional route and real-time data keys should only be added for tasks that need those flows:

```text
VITE_ORS_API_KEY
VITE_SWIFTLY_API_KEY
VITE_METROLINK_API_KEY
```

Do not put these values in the repository. Use Codex environment settings.

## Internet access

Keep agent internet access off for normal implementation work. Setup scripts already have internet access for dependency installation.

Enable agent internet access only for tasks that explicitly need live source checks, such as official future transit source monitoring. Prefer a narrow allowlist and `GET` requests only for those tasks.

## Verification commands

Standard code gate:

```bash
npm run quality
```

Browser-facing gate:

```bash
npm run test:browser:required
```

For scoped browser tasks, keep using the task tag where available:

```bash
npm run test:browser:required -- --grep @<task-id>
```

## Harness policy

Cloud setup should stay aligned with the repo-local harness policy:

- Use `AGENTS.md`, `.agents/skills/`, Linear, GitHub, repo docs, `rg`, TypeScript references, and Playwright gates first.
- Do not enable raw MCP servers, code-index runtimes, background memory stores, or orchestration UIs in cloud setup by default.
- Evaluate global harness candidates in the user-level Codex harness before adopting anything into this repo.
