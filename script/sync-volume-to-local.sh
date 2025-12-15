#!/usr/bin/env bash
# Sync podman volume contents to local filesystem
# Usage: ./sync-volume-to-local.sh [volume_name] [local_path] [interval_seconds]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

load_env_files

VOLUME_NAME="${1:-${VAULT_DATA_VOLUME:-vault}}"
LOCAL_PATH="${2:-$LOCAL_VAULT_PATH}"
INTERVAL="${3:-${SYNC_INTERVAL:-60}}"

# Resolve path properly (handles ~, relative paths, and escaped spaces)
if [ -n "$LOCAL_PATH" ]; then
  LOCAL_PATH="$(resolve_path "$LOCAL_PATH")"
fi

# Validate volume exists
if ! podman volume exists "$VOLUME_NAME" 2>/dev/null; then
  fail "Volume '$VOLUME_NAME' does not exist. Run init-volume.sh first."
fi

# Create local directory if it doesn't exist
mkdir -p "$LOCAL_PATH" || fail "Failed to create local path: $LOCAL_PATH"

info "🔄 Starting volume->local sync"
info "   Volume: $VOLUME_NAME"
info "   Local:  $LOCAL_PATH"
info "   Interval: ${INTERVAL}s"
echo ""

sync_once() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - Syncing $VOLUME_NAME -> $LOCAL_PATH"
  
  # Use explicit cp flags instead of -a for Alpine compatibility
  # -r = recursive, -p = preserve attributes, -u = update (only newer files)
  if ! podman run --rm \
    -v "$VOLUME_NAME":/source:ro \
    -v "$LOCAL_PATH":/dest:Z \
    alpine \
    sh -c 'cp -rpu /source/. /dest/ 2>&1'; then
    warn "Sync completed with errors (this is normal for some files)"
  fi
  
  echo "$(date '+%Y-%m-%d %H:%M:%S') - Sync completed"
}

if [ "$INTERVAL" = "once" ]; then
  sync_once
  exit 0
fi

# Continuous sync mode
info "Starting continuous sync mode (Ctrl+C to stop)"
while true; do
  sync_once
  sleep "$INTERVAL"
done
