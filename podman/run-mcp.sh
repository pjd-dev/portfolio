#!/bin/bash
set -euo pipefail

# Resolve script and repo root directories and source root .env if present
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$REPO_ROOT/.env"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

podman build -t mcp -f "$REPO_ROOT/apps/mcp/Dockerfile" "$REPO_ROOT"

# Decide on volume source: prefer LOCAL_VAULT_PATH (host path) when set and accessible,
# otherwise fall back to named volume defined by VAULT_DATA_VOLUME. Always apply
# SELinux label :Z to ensure container can write the mount on SELinux hosts.
VOLUME_SOURCE="${LOCAL_VAULT_PATH:-${VAULT_DATA_VOLUME:-vault}}"
# Expand ~ if present in a host path
if [ "${VOLUME_SOURCE#~}" != "$VOLUME_SOURCE" ]; then
  VOLUME_SOURCE="$(eval echo $VOLUME_SOURCE)"
fi
# If the expanded path does not exist or is not readable, fall back to named volume
if [ "${VOLUME_SOURCE:0:1}" = "/" ] || [ "${VOLUME_SOURCE:0:1}" = "~" ]; then
  # This is a host path; check if it's accessible
  if [ ! -d "$VOLUME_SOURCE" ] || [ ! -r "$VOLUME_SOURCE" ]; then
    echo "[mcp] WARNING: LOCAL_VAULT_PATH '$VOLUME_SOURCE' not accessible, falling back to named volume 'vault'"
    VOLUME_SOURCE="vault"
  fi
fi

POD_NAME="${POD_NAME:-vaulty-pod}"
# Ensure pod exists with MCP port binding
podman pod create --name "$POD_NAME" -p "${MCP_PORT:-4000}":4000 2>/dev/null || true

podman run -d --rm --name mcp --pod "$POD_NAME" \
  --volume "$VOLUME_SOURCE":/vault:Z \
  --env-file "$ENV_FILE" \
  localhost/mcp
