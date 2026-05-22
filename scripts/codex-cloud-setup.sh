#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

node - <<'NODE'
const version = process.versions.node.split('.').map(Number);
const [major, minor, patch] = version;
const supported =
  (major === 20 && (minor > 19 || (minor === 19 && patch >= 0))) ||
  (major === 22 && (minor > 12 || (minor === 12 && patch >= 0))) ||
  major > 22;

if (!supported) {
  console.error(
    `VeloRail requires Node.js ^20.19.0 || >=22.12.0. Current version is ${process.versions.node}.`,
  );
  console.error('Set CODEX_ENV_NODE_VERSION=22.13.1 in the Codex cloud environment.');
  process.exit(1);
}
NODE

npm ci

if [[ "$(uname -s)" == "Linux" ]]; then
  npx playwright install --with-deps chromium
else
  npx playwright install chromium
fi

if [[ "${VELO_RAIL_CODEX_SETUP_VERIFY:-0}" == "1" ]]; then
  npm run quality
fi
