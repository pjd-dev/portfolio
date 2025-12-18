#!/bin/bash

# ⚠️  DEPRECATED - This script is no longer maintained
# 
# This script has been migrated to the centralized script system.
# Please use the new command instead:
#
#   ./scripts/vault start
#
# The logic from this file has been integrated into:
#   - scripts/services/start.sh
#   - scripts/common.sh
#
# This file will be removed in the next major version.
# See doc/PHASE4_DETAILED_PLAN.md for migration details.

set -euo pipefail

# Resolve script and repo root directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

# Set ENV_FILE for sourcing
ENV_FILE="${REPO_ROOT}/.env"

# Load environment files (root level first, then app-level overrides)
load_env_files() {
  local root_env="$REPO_ROOT/.env"
  if [ -f "$root_env" ]; then
    set -o allexport
    # shellcheck disable=SC1090
    source "$ENV_FILE"
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
# Note: Container is always named with --name vaulty (or override via VAULT_CONTAINER_NAME)
podman pod create --name "$POD_NAME" -p "${MCP_PORT:-4000}":4000 || true

CONTAINER_USER="${CONTAINER_USER:-$(id -u):$(id -g)}"
USER_FLAG=()
if [ -n "$CONTAINER_USER" ]; then
  USER_FLAG=(--user "$CONTAINER_USER")
fi

ENV_FILES=()
for env_file in "$REPO_ROOT/.env" "$REPO_ROOT/apps/vaulty/.env"; do
  if [ -f "$env_file" ]; then
    ENV_FILES+=(--env-file "$env_file")
  fi
done

podman run -d --rm --name vaulty --pod "$POD_NAME" \
  --volume "$VOLUME_SOURCE":/vault:Z \
  "${ENV_FILES[@]}" \
  "${USER_FLAG[@]}" \
  vault
