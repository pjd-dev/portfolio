#!/usr/bin/env bash

# Stop all vault platform services

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/common.sh"

print_header "Stopping Vault Platform Services"

print_section "Stopping services"

# Stop MCP
if is_container_running "mcp"; then
  log_info "Stopping MCP service..."
  $RUNTIME stop mcp || log_warn "Failed to stop MCP"
fi

# Stop Vault
if is_container_running "vaulty"; then
  log_info "Stopping Vault service..."
  $RUNTIME stop vaulty || log_warn "Failed to stop Vault"
fi

# Additional services if running
for service in vault vault-platform vault-full; do
  if is_container_running "$service"; then
    log_info "Stopping $service service..."
    $RUNTIME stop "$service" || log_warn "Failed to stop $service"
  fi
done

log_success "All services stopped"
