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

# Load environment files (root level first, then app-level overrides)
load_env_files() {
  local root_env="$REPO_ROOT/.env"
  if [ -f "$root_env" ]; then
    set -o allexport
    # shellcheck disable=SC1090
    source "$root_env"
    set +o allexport
    info "Loaded root .env"
  fi

  # Load app-level .env files so CONTAINER_NAME overrides are respected
  for app in vaulty mcp; do
    local app_env="$REPO_ROOT/apps/$app/.env"
    if [ -f "$app_env" ]; then
      set -o allexport
      # shellcheck disable=SC1090
      source "$app_env"
      set +o allexport
      info "Loaded $app/.env"
    fi
  done
}

load_env_files

# Parse arguments
CLEANUP_MODE="${1:-cleanup}"  # Default to cleanup mode
VOLUME_NAME="${2:-${VAULT_DATA_VOLUME:-vault}}"
LOCAL_PATH="${3:-${LOCAL_VAULT_PATH:-}}"

# Resolve volume source: prefer LOCAL_VAULT_PATH when accessible, else fall back to named volume
resolve_volume_source() {
  local source="${LOCAL_VAULT_PATH:-${VAULT_DATA_VOLUME:-vault}}"
  
  # Expand ~ if present in host path
  if [ "${source#~}" != "$source" ]; then
    source="$(eval echo "$source")"
  fi
  
  # If it's a host path, verify accessibility
  if [ "${source:0:1}" = "/" ] || [ "${source:0:1}" = "~" ]; then
    if [ ! -d "$source" ] || [ ! -r "$source" ]; then
      warn "LOCAL_VAULT_PATH '$source' not accessible, falling back to named volume"
      source="vault"
    fi
  fi
  
  echo "$source"
}

VOLUME_SOURCE="$(resolve_volume_source)"
POD_NAME="${POD_NAME:-vaulty-pod}"
VAULT_CONTAINER="${VAULT_CONTAINER_NAME:-${CONTAINER_NAME:-vaulty}}"
MCP_CONTAINER="${MCP_CONTAINER_NAME:-${CONTAINER_NAME:-mcp}}"

info "Configuration:"
info "  Pod: $POD_NAME"
info "  Vault container: $VAULT_CONTAINER"
info "  MCP container: $MCP_CONTAINER"
info "  Volume source: $VOLUME_SOURCE"
info "  Local path: ${LOCAL_PATH:-none}"

# Cleanup function
cleanup_containers() {
  info "Cleaning up existing infrastructure..."
  
  # Stop and remove containers
  for container in "$VAULT_CONTAINER" "$MCP_CONTAINER"; do
    if podman container exists "$container" 2>/dev/null; then
      info "Stopping container: $container"
      podman container stop "$container" 2>/dev/null || true
      podman container rm "$container" 2>/dev/null || true
    fi
  done
  
  # Stop and remove pod
  if podman pod exists "$POD_NAME" 2>/dev/null; then
    info "Stopping pod: $POD_NAME"
    podman pod stop "$POD_NAME" 2>/dev/null || true
    podman pod rm "$POD_NAME" 2>/dev/null || true
  fi
  
  info "Cleanup complete"
}

# Main execution
main() {
  # Handle cleanup based on mode
  if [ "$CLEANUP_MODE" != "skip-cleanup" ]; then
    cleanup_containers
  else
    info "Skipping cleanup"
  fi

  # Initialize volume and local path if sync needed
  if [ -n "$LOCAL_PATH" ]; then
    info "Initializing volume '$VOLUME_NAME'..."
    bash "$REPO_ROOT/script/init-volume.sh" "$VOLUME_NAME" "$LOCAL_PATH"
  fi

  # Build images
  info "Building vault image..."
  podman build -t vault -f "$REPO_ROOT/apps/vaulty/Dockerfile" "$REPO_ROOT/apps/vaulty" || fail "Failed to build vault image"
  
  info "Building mcp image..."
  podman build -t mcp -f "$REPO_ROOT/apps/mcp/Dockerfile" "$REPO_ROOT" || fail "Failed to build mcp image"

  # Create pod with port bindings
  info "Creating pod '$POD_NAME' with port bindings..."
  podman pod create --name "$POD_NAME" -p "${MCP_PORT:-4000}":4000 || fail "Failed to create pod"

  # Start Vaulty container
  info "Starting vaulty container..."
  podman run -d --rm \
    --name "$VAULT_CONTAINER" \
    --pod "$POD_NAME" \
    --volume "$VOLUME_SOURCE":/vault:Z \
    --env-file "$REPO_ROOT/.env" \
    -e SYNC_MODE="${SYNC_MODE:-interval}" \
    -e GIT_USER_NAME="${GIT_USER_NAME:-}" \
    -e GIT_USER_EMAIL="${GIT_USER_EMAIL:-}" \
    vault || fail "Failed to start vault container"

  # Start MCP container
  info "Starting mcp container..."
  podman run -d --rm \
    --name "$MCP_CONTAINER" \
    --pod "$POD_NAME" \
    --volume "$VOLUME_SOURCE":/vault:Z \
    mcp || fail "Failed to start mcp container"

  # Start volume->local sync if local path is configured
  if [ -n "$LOCAL_PATH" ]; then
    info "Starting volume->local sync in background..."
    bash "$REPO_ROOT/script/sync-volume-to-local.sh" "$VOLUME_NAME" "$LOCAL_PATH" "${SYNC_INTERVAL:-60}" > /tmp/vault-sync.log 2>&1 &
    SYNC_PID=$!
    info "Sync process started (PID: $SYNC_PID)"
    info "Monitor sync with: tail -f /tmp/vault-sync.log"
  fi

  # Display status
  echo ""
  info "=== Platform Running ==="
  info "Pod:    $POD_NAME"
  info "Vault:  $(podman ps --filter name="$VAULT_CONTAINER" --format '{{.Status}}' 2>/dev/null || echo 'N/A')"
  info "MCP:    $(podman ps --filter name="$MCP_CONTAINER" --format '{{.Status}}' 2>/dev/null || echo 'N/A')"
  if [ -n "$LOCAL_PATH" ]; then
    info "Sync:   Active (PID: ${SYNC_PID:-N/A})"
  fi
  echo ""
}

# Run main function
main
