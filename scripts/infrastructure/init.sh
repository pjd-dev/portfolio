#!/usr/bin/env bash

# Initialize platform infrastructure (volumes, networks, directories)
# Migrated logic from legacy init script with enhancements

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/common.sh"

# ============================================================================
# Configuration
# ============================================================================

# Allow override via arguments or environment
VAULT_VOLUME="${1:-${VAULT_DATA_VOLUME:-vault}}"
LOCAL_VAULT_PATH="${2:-${LOCAL_VAULT_PATH:-}}"

# ============================================================================
# Helper Functions
# ============================================================================

expand_path() {
  local path="$1"
  
  # Expand ~ to home directory
  if [[ "${path#~}" != "$path" ]]; then
    path="$(eval echo "$path")"
  fi
  
  # Expand relative paths
  if [[ ! "$path" = /* ]]; then
    path="$(cd "$PROJECT_ROOT" && pwd)/$path"
  fi
  
  echo "$path"
}

# ============================================================================
# Volume Initialization
# ============================================================================

init_vault_volume() {
  local volume="$1"
  local local_path="${2:-}"
  
  print_section "Initializing vault volume: $volume"
  
  # Create volume if not exists
  if $RUNTIME volume inspect "$volume" &>/dev/null; then
    log_success "Volume already exists: $volume"
  else
    log_info "Creating volume: $volume"
    $RUNTIME volume create "$volume" || die "Failed to create volume $volume"
    log_success "Volume created: $volume"
  fi
  
  # Handle local path if provided
  if [[ -n "$local_path" ]]; then
    local expanded_path
    expanded_path=$(expand_path "$local_path")
    
    if [[ ! -d "$expanded_path" ]]; then
      log_info "Creating local path: $expanded_path"
      mkdir -p "$expanded_path" || die "Failed to create directory $expanded_path"
      log_success "Directory created: $expanded_path"
    else
      log_success "Local path exists: $expanded_path"
    fi

    # Copy contents from local to volume if local has files, but avoid clobbering a non-empty volume unless forced
    if [[ -n "$(ls -A "$expanded_path" 2>/dev/null || true)" ]]; then
      local volume_non_empty
      volume_non_empty=$($RUNTIME run --rm -v "$volume:/dst" alpine sh -c 'ls -A /dst 2>/dev/null | head -n1')
      if [[ -n "$volume_non_empty" && "${FORCE_SYNC:-0}" != "1" ]]; then
        log_warn "Volume $volume already has content; skipping copy from $expanded_path (set FORCE_SYNC=1 to overwrite)"
      else
        log_info "Copying contents from $expanded_path to volume $volume..."
        $RUNTIME run --rm \
          -v "$expanded_path:/src:Z" \
          -v "$volume:/dst" \
          alpine sh -c "cp -a /src/. /dst/" || log_warn "Some files may not have been copied"
        log_success "Contents copied to volume"
      fi
    else
      log_debug "Local path is empty, no copy needed"
    fi
  fi

  # If a local path is provided, emit a suggested bind mount for convenience
  if [[ -n "$local_path" ]]; then
    echo ""
    echo "👉 To run the pod using the host vault directly, bind-mount it:" 
    echo "   podman run ... -v ${expanded_path}:/vault:Z -e VAULT_PATH=/vault <image>" 
    echo "   # or docker run ... -v ${expanded_path}:/vault -e VAULT_PATH=/vault <image>" 
    echo ""
  fi
}

# ============================================================================
# Network Initialization
# ============================================================================

init_networks() {
  print_section "Creating networks"
  
  local networks=("vault-network")
  for network in "${networks[@]}"; do
    if $RUNTIME network inspect "$network" &>/dev/null; then
      log_success "Network already exists: $network"
    else
      log_info "Creating network: $network"
      $RUNTIME network create "$network" || die "Failed to create network $network"
      log_success "Network created: $network"
    fi
  done
}

# ============================================================================
# Directory Initialization
# ============================================================================

init_directories() {
  print_section "Creating directories"
  
  local dirs=(
    "$(get_config VAULT_PATH "$HOME/.obsidian/vault")"
    "$PROJECT_ROOT/.vault"
    "$PROJECT_ROOT/logs"
  )
  
  for dir in "${dirs[@]}"; do
    if [[ -d "$dir" ]]; then
      log_success "Directory exists: $dir"
      continue
    fi
    if mkdir_p "$dir" 2>/dev/null; then
      log_success "Directory ready: $dir"
    else
      log_warn "Unable to create directory (read-only or missing mount): $dir"
    fi
  done
}

# ============================================================================
# Additional Volumes (for data persistence)
# ============================================================================

init_additional_volumes() {
  print_section "Creating additional data volumes"
  
  local volumes=("mcp-data" "vaulty-data")
  for volume in "${volumes[@]}"; do
    if $RUNTIME volume inspect "$volume" &>/dev/null; then
      log_success "Volume already exists: $volume"
    else
      log_info "Creating volume: $volume"
      $RUNTIME volume create "$volume" || die "Failed to create volume $volume"
      log_success "Volume created: $volume"
    fi
  done
}

# ============================================================================
# Main Execution
# ============================================================================

print_header "Initializing Platform Infrastructure"

require_commands "$RUNTIME"

# Initialize vault volume with optional local path sync
init_vault_volume "$VAULT_VOLUME" "$LOCAL_VAULT_PATH"

# Initialize additional infrastructure
init_additional_volumes
init_networks
init_directories

print_divider
log_success "Platform infrastructure initialized successfully"
