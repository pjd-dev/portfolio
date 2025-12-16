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

podman build -t vault -f "$REPO_ROOT/apps/vaulty/Dockerfile" "$REPO_ROOT/apps/vaulty"

# Decide on volume source: prefer LOCAL_VAULT_PATH (host path) when set and accessible,
# otherwise fall back to named volume defined by VAULT_DATA_VOLUME. Always apply
# SELinux label :Z to ensure container can write the mount on SELinux hosts.
VOLUME_SOURCE="${LOCAL_VAULT_PATH:-${VAULT_DATA_VOLUME:-vault}}"
# Expand ~ if present in a host path
if [ "${VOLUME_SOURCE#~}" != "$VOLUME_SOURCE" ]; then
  VOLUME_SOURCE="$(eval echo "$VOLUME_SOURCE")"
fi
# If the expanded path does not exist or is not readable, fall back to named volume
if [ "${VOLUME_SOURCE:0:1}" = "/" ] || [ "${VOLUME_SOURCE:0:1}" = "~" ]; then
  # This is a host path; check if it's accessible
  if [ ! -d "$VOLUME_SOURCE" ] || [ ! -r "$VOLUME_SOURCE" ]; then
    echo "[vault-restart] WARNING: LOCAL_VAULT_PATH '$VOLUME_SOURCE' not accessible, falling back to named volume 'vault'"
    VOLUME_SOURCE="vault"
  fi
fi

# Create pod with MCP port binding
POD_NAME="${POD_NAME:-vaulty-pod}"
VAULT_CONTAINER="${VAULT_CONTAINER_NAME:-vaulty}"
podman pod create --name "$POD_NAME" -p "${MCP_PORT:-4000}":4000 || true

podman run -d --rm --name "$VAULT_CONTAINER" --pod "$POD_NAME" --volume "$VOLUME_SOURCE":/vault:Z --env-file "$REPO_ROOT/.env" vault
