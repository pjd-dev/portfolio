#!/bin/bash
# Multi-container Podman setup script
# Usage: ./podman-compose.sh [volume_name] [local_path]

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

# Accept optional parameters for volume name and local path
VOLUME_NAME="${1:-${VAULT_DATA_VOLUME:-vault}}"
LOCAL_PATH="${2:-$LOCAL_VAULT_PATH}"

# Initialize shared volume and local path
echo "Initializing volume '$VOLUME_NAME'..."
bash "$REPO_ROOT/script/init-volume.sh" "$VOLUME_NAME" "$LOCAL_PATH"

# Build images
echo "Building vault image..."
podman build -t vault -f "$REPO_ROOT/apps/vaulty/Dockerfile" "$REPO_ROOT/apps/vaulty"
echo "Building mcp image..."
podman build -t mcp -f "$REPO_ROOT/apps/mcp/Dockerfile" "$REPO_ROOT"

# Start Vaulty container
podman run -d --rm --name vaulty \
  --volume "$VOLUME_NAME":/vault \
  --env-file "$ENV_FILE" \
  -e SYNC_MODE="${SYNC_MODE:-interval}" \
  localhost/vault

# Start MCP container (placeholder image)
podman run -d --rm --name mcp \
  --volume "$VOLUME_NAME":/vault \
  -p "${MCP_PORT:-4000}":4000 \
  localhost/mcp

# Start volume->local sync (background process)
echo "Starting volume->local sync in background..."
bash "$REPO_ROOT/script/sync-volume-to-local.sh" "$VOLUME_NAME" "$LOCAL_PATH" "${SYNC_INTERVAL:-60}" > /tmp/vault-sync.log 2>&1 &
SYNC_PID=$!
echo "Sync process started (PID: $SYNC_PID)"
echo "Monitor sync: tail -f /tmp/vault-sync.log"

echo ""
echo "=== Platform Running ==="
echo "Vaulty: $(podman ps --filter name=vaulty --format '{{.Status}}')"
echo "MCP:    $(podman ps --filter name=mcp --format '{{.Status}}')"
echo "Sync:   Running (PID: $SYNC_PID)"
echo "Local:  $LOCAL_PATH"
