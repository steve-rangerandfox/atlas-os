#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
server="$root/src/mcp-server.mjs"
server_name="${ATLAS_MCP_SERVER_NAME:-atlas-orchestrator}"
env_file="${ATLAS_ORCHESTRATOR_ENV_FILE:-$root/orchestrator.env}"
target="all"
force=0

allowed_env=(
  ORCH_HOME ORCH_CLAUDE_BIN ORCH_CLAUDE_MODEL ORCH_CODEX_BIN ORCH_CODEX_MODEL
  ORCH_PERMISSION_MODE ORCH_MAX_TURNS ORCH_MAX_BUDGET_USD
  ORCH_CLAUDE_TIMEOUT_MINUTES ORCH_CODEX_TIMEOUT_MINUTES
  ORCH_CHECK_TIMEOUT_MINUTES ORCH_MAX_OUTPUT_CHARS ORCH_ALLOW_SAME_PROVIDER_EXECUTOR
)
configured_value() {
  local requested="$1"
  local value="${!requested:-}"
  local line key
  if [ -z "$value" ] && [ -f "$env_file" ]; then
    while IFS= read -r line || [ -n "$line" ]; do
      if [[ "$line" =~ ^([A-Z0-9_]+)=(.*)$ ]]; then
        key="${BASH_REMATCH[1]}"
        if [ "$key" = "$requested" ]; then value="${BASH_REMATCH[2]}"; fi
      fi
    done < "$env_file"
  fi
  if [ -z "$value" ] && [ "$requested" = "ORCH_HOME" ]; then value="$HOME/.atlas-orchestrator"; fi
  configured_result="$value"
}

controller_env_args() {
  local provider="$1"
  mcp_env_args=(--env "ORCH_CONTROLLER_PROVIDER=$provider")
  local key
  for key in "${allowed_env[@]}"; do
    configured_value "$key"
    if [ -n "$configured_result" ]; then mcp_env_args+=(--env "$key=$configured_result"); fi
  done
}

usage() {
  cat <<'EOF'
Usage: bash scripts/install-controllers.sh [all|codex|claude] [--force]

Registers the local Atlas Orchestrator stdio MCP server with Codex CLI,
Claude Code, or both. Existing entries are left unchanged unless --force is used.
EOF
}

for arg in "$@"; do
  case "$arg" in
    all|codex|claude) target="$arg" ;;
    --force) force=1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $arg" >&2; usage >&2; exit 2 ;;
  esac
done

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required." >&2
  exit 1
fi

if [ ! -f "$server" ]; then
  echo "Atlas MCP server not found at $server" >&2
  exit 1
fi

install_codex() {
  if ! command -v codex >/dev/null 2>&1; then
    echo "Codex CLI is not installed or is not on PATH." >&2
    return 1
  fi

  if codex mcp get "$server_name" >/dev/null 2>&1; then
    if [ "$force" -eq 0 ]; then
      echo "Codex already has MCP server '$server_name'; leaving it unchanged."
      return 0
    fi
    codex mcp remove "$server_name" >/dev/null
  fi

  controller_env_args codex
  codex mcp add \
    "$server_name" \
    "${mcp_env_args[@]}" \
    -- node "$server"

  echo "Codex controller installed:"
  codex mcp get "$server_name" --json
}

install_claude() {
  if ! command -v claude >/dev/null 2>&1; then
    echo "Claude Code is not installed or is not on PATH." >&2
    return 1
  fi

  if claude mcp get "$server_name" >/dev/null 2>&1; then
    if [ "$force" -eq 0 ]; then
      echo "Claude Code already has MCP server '$server_name'; leaving it unchanged."
      return 0
    fi
    claude mcp remove "$server_name" >/dev/null
  fi

  controller_env_args claude
  claude mcp add \
    --transport stdio \
    "$server_name" \
    --scope user \
    "${mcp_env_args[@]}" \
    -- node "$server"

  echo "Claude controller installed:"
  claude mcp get "$server_name"
}

case "$target" in
  all)
    install_codex
    install_claude
    ;;
  codex) install_codex ;;
  claude) install_claude ;;
esac

cd "$root"
npm run smoke

echo
echo "Controller registration complete."
echo "Launch Codex:  bash scripts/atlas-controller codex"
echo "Launch Claude: bash scripts/atlas-controller claude"
