#!/bin/bash
# Multi-container Podman orchestration script
# Unified script combining setup, cleanup, build, and container management
# Usage: ./podman-compose.sh [cleanup|skip-cleanup] [volume_name] [local_path]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# Utility functions
info() { echo -e "${GREEN}[podman-compose]${NC} $*"; }
warn() { echo -e "${YELLOW}[podman-compose] WARN:${NC} $*"; }
fail() { echo -e "${RED}[podman-compose] ERROR:${NC} $*" >&2; exit 1; }

# Resolve script and repo root directories
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

# Create pod with port bindings
echo "Creating pod with port bindings..."
podman pod create --name vaulty-pod -p "${MCP_PORT:-4000}":4000 || true

# Start Vaulty container
podman run -d --rm --name vaulty \
  --pod vaulty-pod \
  --volume "$VOLUME_NAME":/vault:Z \
  --env-file "$ENV_FILE" \
  -e SYNC_MODE="${SYNC_MODE:-interval}" \
  localhost/vault

# Start MCP container in vaulty-pod
podman run -d --rm --name mcp \
  --pod vaulty-pod \
  --volume "$VOLUME_NAME":/vault:Z \
  --env-file "$ENV_FILE" \
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
