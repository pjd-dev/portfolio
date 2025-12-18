#!/usr/bin/env bash

# Start all vault platform services
# Sources common utilities and starts both MCP and Vault services

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/common.sh"

print_header "Starting Vault Platform Services"

print_section "Starting MCP service"
if [[ -f "$PODMAN_DIR/run-mcp.sh" ]]; then
  bash "$PODMAN_DIR/run-mcp.sh"
else
  log_warn "MCP startup script not found at $PODMAN_DIR/run-mcp.sh"
fi

print_section "Starting Vault service"
if [[ -f "$PODMAN_DIR/run-vault.sh" ]]; then
  bash "$PODMAN_DIR/run-vault.sh"
else
  log_warn "Vault startup script not found at $PODMAN_DIR/run-vault.sh"
fi

log_success "All services started"
