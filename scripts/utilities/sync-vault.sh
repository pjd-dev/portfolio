#!/usr/bin/env bash

# Sync vault between volume and local filesystem
# Migrated logic from script/sync-volume-to-local.sh with enhancements

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/common.sh"

# ============================================================================
# Configuration
# ============================================================================

# Volume sync parameters
VOLUME_NAME="${1:-${VAULT_DATA_VOLUME:-vault}}"
LOCAL_VAULT="${2:-${LOCAL_VAULT_PATH:-$PROJECT_ROOT/.vault}}"
SYNC_INTERVAL="${3:-${SYNC_INTERVAL:-60}}"
SYNC_MODE="${SYNC_MODE:-once}"  # 'once' or 'continuous'

# Expand paths
if [[ "${LOCAL_VAULT#~}" != "$LOCAL_VAULT" ]]; then
  LOCAL_VAULT="$(eval echo "$LOCAL_VAULT")"
fi

# ============================================================================
# Sync Functions
# ============================================================================

sync_volume_to_local() {
  local volume="$1"
  local local_path="$2"
  
  log_info "Syncing from volume to local..."
  
  # Verify volume exists
  if ! $RUNTIME volume inspect "$volume" &>/dev/null; then
    die "Volume '$volume' does not exist"
  fi
  
  # Create local directory if needed
  mkdir -p "$local_path" || die "Failed to create directory: $local_path"
  
  # Sync using podman run (read-only from volume)
  $RUNTIME run --rm \
    -v "$volume:/source:ro" \
    -v "$local_path:/dest:Z" \
    alpine \
    sh -c 'cp -rpu /source/. /dest/ 2>&1' || \
    log_warn "Sync completed with warnings (some files may not be accessible)"
  
  log_success "Volume synced to: $local_path"
}

sync_local_to_volume() {
  local local_path="$1"
  local volume="$2"
  
  log_info "Syncing from local to volume..."
  
  # Verify paths exist
  if [[ ! -d "$local_path" ]]; then
    die "Local path does not exist: $local_path"
  fi
  
  if ! $RUNTIME volume inspect "$volume" &>/dev/null; then
    die "Volume '$volume' does not exist"
  fi
  
  # Sync using podman run
  $RUNTIME run --rm \
    -v "$local_path:/source:Z" \
    -v "$volume:/dest" \
    alpine \
    sh -c 'cp -rpu /source/. /dest/ 2>&1' || \
    log_warn "Sync completed with warnings (some files may not be accessible)"
  
  log_success "Local synced to volume: $volume"
}

sync_once() {
  local timestamp
  timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  
  log_info "[$timestamp] Starting sync cycle..."
  sync_volume_to_local "$VOLUME_NAME" "$LOCAL_VAULT"
  log_info "[$timestamp] Sync complete"
}

sync_continuous() {
  local interval="$1"
  
  log_info "Starting continuous sync mode (interval: ${interval}s)"
  log_info "Press Ctrl+C to stop"
  
  while true; do
    sync_once
    sleep "$interval"
  done
}

# ============================================================================
# Main Execution
# ============================================================================

print_header "Vault Synchronization Utility"

print_section "Configuration"
log_info "Volume:   $VOLUME_NAME"
log_info "Local:    $LOCAL_VAULT"
log_info "Interval: ${SYNC_INTERVAL}s"
log_info "Mode:     $SYNC_MODE"

require_commands "$RUNTIME"

# Determine sync direction and mode
case "${1:-volume-to-local}" in
  "volume-to-local")
    print_section "Syncing volume to local"
    sync_volume_to_local "$VOLUME_NAME" "$LOCAL_VAULT"
    ;;
  
  "local-to-volume")
    print_section "Syncing local to volume"
    sync_local_to_volume "$LOCAL_VAULT" "$VOLUME_NAME"
    ;;
  
  "continuous")
    print_section "Starting continuous sync"
    sync_continuous "$SYNC_INTERVAL"
    ;;
  
  "once")
    print_section "Syncing volume to local (once)"
    sync_once
    ;;
  
  *)
    die "Unknown sync mode: $1"
    ;;
esac

print_divider
log_success "Vault sync complete"

