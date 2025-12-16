#!/bin/bash
set -euo pipefail

# Resolve script and repo root directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment files (root level first, then app-level overrides)
load_env_files() {
  local root_env="$REPO_ROOT/.env"
  if [ -f "$root_env" ]; then
    set -o allexport
    # shellcheck disable=SC1090
    source "$root_env"
    set +o allexport
  fi

  # Load app-level .env files
  for app in vaulty mcp; do
    local app_env="$REPO_ROOT/apps/$app/.env"
    if [ -f "$app_env" ]; then
      set -o allexport
      # shellcheck disable=SC1090
      source "$app_env"
      set +o allexport
    fi
  done
}

load_env_files

podman build -t mcp -f "$REPO_ROOT/apps/mcp/Dockerfile" "$REPO_ROOT"

POD_NAME="${POD_NAME:-vaulty-pod}"
MCP_CONTAINER="${MCP_CONTAINER_NAME:-${CONTAINER_NAME:-mcp-server-dev}}"
VOLUME_SOURCE="${LOCAL_VAULT_PATH:-${VAULT_DATA_VOLUME:-vault}}"

# Expand ~ if present in host path
if [ "${VOLUME_SOURCE#~}" != "$VOLUME_SOURCE" ]; then
  VOLUME_SOURCE="$(eval echo "$VOLUME_SOURCE")"
fi

podman run -d --rm --name "$MCP_CONTAINER" --pod "$POD_NAME" --volume "$VOLUME_SOURCE":/vault:Z mcp