#!/usr/bin/env bash

# Check status of all vault platform services

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/common.sh"

print_header "Vault Platform Service Status"

print_section "Checking services"

# Get runtime
runtime=$($RUNTIME --version &>/dev/null && echo "podman" || echo "docker")

# Check each service
services=("mcp" "api-server" "vaulty" "vault" "viewer")
any_running=0

for service in "${services[@]}"; do
  if $runtime ps --filter "name=$service" --format "{{.Names}}" 2>/dev/null | grep -q "$service"; then
    log_success "$service is running"
    any_running=1
  else
    log_warn "$service is not running"
  fi
done

if (( any_running == 0 )); then
  log_error "No services are currently running"
  exit 1
fi

log_success "Status check complete"
