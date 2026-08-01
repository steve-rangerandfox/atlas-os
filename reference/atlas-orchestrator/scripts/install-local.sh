#!/usr/bin/env bash
set -euo pipefail

major="$(node -p 'Number(process.versions.node.split(".")[0])')"
if [ "$major" -lt 20 ]; then
  echo "Node.js 20 or newer is required." >&2
  exit 1
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$script_dir"

npm test
npm run smoke

if command -v claude >/dev/null 2>&1; then
  claude --version
  claude auth status || true
else
  echo "Claude Code is not installed or is not on PATH." >&2
fi

if [ "$#" -gt 0 ]; then
  node src/cli.mjs doctor --repo "$1"
else
  echo "Local bridge checks passed. Run the doctor command with your repository path next:"
  echo "node src/cli.mjs doctor --repo /workspaces/YOUR_REPOSITORY"
fi
