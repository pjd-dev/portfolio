#!/usr/bin/env bash

# Cloudflared tunnel management
# Migrated logic from script/cloudflared.tunnel.sh with enhancements

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/common.sh"

# ============================================================================
# Configuration
# ============================================================================

# Tunnel settings
TUNNEL_NAME="${CF_TUNNEL_NAME:-${TUNNEL_NAME:-vault-tunnel}}"
TUNNEL_ROUTE="${TUNNEL_ROUTE:-localhost:4000}"
TUNNEL_LOG_LEVEL="${CF_LOG_LEVEL:-${TUNNEL_LOG_LEVEL:-info}}"

# Logging
LOG_DIR="${LOG_DIR:-$PROJECT_ROOT/logs}"
LOG_FILE="$LOG_DIR/cloudflared.log"

# ============================================================================
# Tunnel Functions
# ============================================================================

start_tunnel() {
  local tunnel="$1"
  local route="$2"
  local loglevel="$3"
  
  print_section "Starting Cloudflared Tunnel"
  
  log_info "Tunnel:    $tunnel"
  log_info "Route:     $route"
  log_info "Log level: $loglevel"
  log_info "Log file:  $LOG_FILE"
  
  mkdir -p "$LOG_DIR" || die "Failed to create log directory"
  
  # Start tunnel with logging
  log_info "Starting tunnel process..."
  
  # Try to use tunnel configuration (if it exists)
  if [[ -n "${CF_TUNNEL_CONFIG:-}" ]]; then
    log_debug "Using tunnel config: $CF_TUNNEL_CONFIG"
    exec cloudflared tunnel --loglevel "$loglevel" run "$tunnel" >> "$LOG_FILE" 2>&1 || \
      die "Failed to start tunnel"
  else
    # Fallback to simple tunnel URL
    exec cloudflared tunnel --url "$route" >> "$LOG_FILE" 2>&1 || \
      die "Failed to start tunnel"
  fi
}

check_tunnel_status() {
  print_section "Tunnel Status"
  
  if ! command -v cloudflared &>/dev/null; then
    die "cloudflared not found in PATH"
  fi
  
  log_success "cloudflared is available"
  cloudflared version || log_warn "Could not get cloudflared version"
}

list_tunnels() {
  print_section "Available Tunnels"
  
  if command -v cloudflared &>/dev/null; then
    cloudflared tunnel list || log_warn "Could not list tunnels"
  else
    die "cloudflared not found in PATH"
  fi
}

# ============================================================================
# Main Execution
# ============================================================================

print_header "Cloudflared Tunnel Management"

require_commands "cloudflared"

# Parse command
case "${1:-start}" in
  "start")
    start_tunnel "$TUNNEL_NAME" "$TUNNEL_ROUTE" "$TUNNEL_LOG_LEVEL"
    ;;
  
  "status")
    check_tunnel_status
    ;;
  
  "list")
    list_tunnels
    ;;
  
  *)
    log_error "Unknown command: $1"
    log_info "Usage: tunnel.sh [start|status|list]"
    exit 1
    ;;
esac

log_success "Tunnel command completed"

