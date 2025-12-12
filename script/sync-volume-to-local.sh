#!/usr/bin/env bash
# Sync podman volume contents to local filesystem
# Usage: ./sync-volume-to-local.sh [volume_name] [local_path] [interval_seconds]

set -e

# Load root .env if exists
ENV_FILE="$(dirname "${BASH_SOURCE[0]}")/../.env"
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

VOLUME_NAME="${1:-${VAULT_DATA_VOLUME:-vault}}"
LOCAL_PATH="${2:-$LOCAL_VAULT_PATH}"
INTERVAL="${3:-${SYNC_INTERVAL:-60}}"

# Ensure local path starts from $HOME if relative
if [[ "$LOCAL_PATH" != /* ]]; then
  LOCAL_PATH="$HOME/$LOCAL_PATH"
fi

# Create local directory if it doesn't exist
mkdir -p "$LOCAL_PATH"

echo "🔄 Starting volume->local sync"
echo "   Volume: $VOLUME_NAME"
echo "   Local:  $LOCAL_PATH"
echo "   Interval: ${INTERVAL}s"
echo ""

sync_once() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - Syncing $VOLUME_NAME -> $LOCAL_PATH"
  
  # Use rsync-like behavior with podman run
  podman run --rm \
    -v "$VOLUME_NAME":/source:ro \
    -v "$LOCAL_PATH":/dest:Z \
    alpine \
    sh -c 'cp -au /source/. /dest/ 2>/dev/null || true'
  
  echo "$(date '+%Y-%m-%d %H:%M:%S') - Sync completed"
}

if [ "$INTERVAL" = "once" ]; then
  sync_once
  exit 0
fi

# Continuous sync mode
while true; do
  sync_once
  sleep "$INTERVAL"
done
