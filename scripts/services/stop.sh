#!/usr/bin/env bash

# Stop all vault platform services
# Gracefully shuts down containers and removes pod

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/common.sh"

# ============================================================================
# Configuration
# ============================================================================

POD_NAME="${POD_NAME:-vaulty-pod}"
MCP_CONTAINER="${MCP_CONTAINER_NAME:-${CONTAINER_NAME:-mcp-server-dev}}"
VAULT_CONTAINER="${VAULT_CONTAINER_NAME:-vaulty}"
VIEWER_CONTAINER="${VIEWER_CONTAINER_NAME:-viewer}"
API_CONTAINER="${API_CONTAINER_NAME:-api-server}"

# ============================================================================
# Stop Functions
# ============================================================================

stop_container() {
  local container="$1"
  
  if $RUNTIME ps --filter "name=$container" --format "{{.Names}}" 2>/dev/null | grep -q "$container"; then
    log_info "Stopping container: $container"
    $RUNTIME stop "$container" 2>/dev/null || true
    log_success "Stopped: $container"
  else
    log_debug "Container not running: $container"
  fi
}

remove_pod() {
  local pod="$1"
  
  if $RUNTIME pod ps --filter "name=$pod" --format "{{.Names}}" 2>/dev/null | grep -q "$pod"; then
    log_info "Removing pod: $pod"
    $RUNTIME pod rm "$pod" 2>/dev/null || true
    log_success "Removed pod: $pod"
  else
    log_debug "Pod not found: $pod"
  fi
}

# ============================================================================
# Main Execution
# ============================================================================

print_header "Stopping Vault Platform Services"

print_section "Stopping services"
stop_container "$MCP_CONTAINER"
stop_container "$API_CONTAINER"
stop_container "$VAULT_CONTAINER"
stop_container "$VIEWER_CONTAINER"

print_section "Cleaning up pod infrastructure"
remove_pod "$POD_NAME"

log_success "All services stopped"
