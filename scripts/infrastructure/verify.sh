#!/usr/bin/env bash

# Verify platform infrastructure and container health
# Migrated logic from legacy verify script with enhancements

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/common.sh"

# ============================================================================
# Configuration
# ============================================================================

MCP_CONTAINER="${1:-${MCP_CONTAINER_NAME:-${CONTAINER_NAME:-mcp-server-dev}}}"
VAULT_CONTAINER="${2:-${VAULT_CONTAINER_NAME:-vaulty}}"
POD_NAME="${POD_NAME:-vaulty-pod}"

# ============================================================================
# Verification Functions
# ============================================================================

check_runtime_available() {
  if ! command -v "$RUNTIME" &>/dev/null; then
    die "$RUNTIME is not installed or not in PATH"
  fi
  log_success "Runtime available: $RUNTIME"
}

check_volumes() {
  print_section "Checking volumes"
  
  local volumes=("vault" "mcp-data" "vaulty-data" "vault-data")
  local found=0
  
  for volume in "${volumes[@]}"; do
    if $RUNTIME volume inspect "$volume" &>/dev/null; then
      log_success "Volume exists: $volume"
      found=$((found + 1))
    else
      log_debug "Volume not found: $volume"
    fi
  done
  
  if [[ $found -eq 0 ]]; then
    log_warn "No volumes found - may need to run: scripts/vault infrastructure init"
    return 1
  fi
  
  return 0
}

check_networks() {
  print_section "Checking networks"
  
  local networks=("vault-network")
  
  for network in "${networks[@]}"; do
    if $RUNTIME network inspect "$network" &>/dev/null; then
      log_success "Network exists: $network"
    else
      log_debug "Network not found: $network"
    fi
  done
}

get_mount_source() {
  local container="$1"
  
  # Check if container is running
  if ! $RUNTIME ps --format '{{.Names}}' 2>/dev/null | grep -qw "$container"; then
    echo ""
    return 0
  fi
  
  # Get mount information
  $RUNTIME inspect --format '{{range .Mounts}}{{printf "%s %s\n" .Destination .Source}}{{end}}' "$container" 2>/dev/null | \
    awk '$1=="/vault"{print $2; exit}' || echo ""
}

check_containers() {
  print_section "Checking container mounts"
  
  local mcp_src
  local vault_src
  
  mcp_src=$(get_mount_source "$MCP_CONTAINER")
  vault_src=$(get_mount_source "$VAULT_CONTAINER")
  
  # Check if any containers are running
  if [[ -z "$mcp_src" && -z "$vault_src" ]]; then
    log_warn "Neither MCP nor Vault containers appear to be running"
    log_info "Start containers with: ./scripts/vault start"
    return 1
  fi
  
  # Report mount status
  if [[ -n "$mcp_src" ]]; then
    log_success "$MCP_CONTAINER mounted: $mcp_src"
  else
    log_warn "$MCP_CONTAINER not running or /vault not mounted"
  fi
  
  if [[ -n "$vault_src" ]]; then
    log_success "$VAULT_CONTAINER mounted: $vault_src"
  else
    log_warn "$VAULT_CONTAINER not running or /vault not mounted"
  fi
  
  # Verify shared vault mount if both are running
  if [[ -n "$mcp_src" && -n "$vault_src" ]]; then
    if [[ "$mcp_src" == "$vault_src" ]]; then
      log_success "✅ Both containers mount the same volume: $mcp_src"
      return 0
    else
      log_error "❌ Mount mismatch:"
      log_error "  $MCP_CONTAINER: $mcp_src"
      log_error "  $VAULT_CONTAINER: $vault_src"
      return 1
    fi
  fi
}

check_pod() {
  print_section "Checking pod infrastructure"
  
  if $RUNTIME pod ps --format '{{.Name}}' 2>/dev/null | grep -qw "$POD_NAME"; then
    log_success "Pod running: $POD_NAME"
    
    # Get pod information
    local pod_info
    pod_info=$($RUNTIME pod inspect "$POD_NAME" 2>/dev/null || echo "")
    
    if [[ -n "$pod_info" ]]; then
      log_debug "Pod status verified"
    fi
    return 0
  else
    log_debug "Pod not found: $POD_NAME"
    return 1
  fi
}

check_directories() {
  print_section "Checking required directories"
  
  local dirs=(
    "$PROJECT_ROOT/.vault"
    "$PROJECT_ROOT/logs"
  )
  
  for dir in "${dirs[@]}"; do
    if [[ -d "$dir" ]]; then
      log_success "Directory exists: $dir"
    else
      log_warn "Directory missing: $dir"
    fi
  done
}

# ============================================================================
# Summary Report
# ============================================================================

print_summary() {
  print_section "Verification Summary"
  
  local status="✅ PASS"
  
  if ! check_volumes; then
    status="⚠️  WARNING"
  fi
  
  log_info "Status: $status"
  log_info ""
  log_info "To initialize infrastructure: ./scripts/vault infrastructure init"
  log_info "To start services: ./scripts/vault start"
  log_info "To check logs: ./scripts/vault logs"
}

# ============================================================================
# Main Execution
# ============================================================================

print_header "Verifying Platform Infrastructure"

check_runtime_available
check_volumes || true
check_networks || true
check_pod || true
check_directories
check_containers || true

print_summary

print_divider
log_success "Infrastructure verification complete"
