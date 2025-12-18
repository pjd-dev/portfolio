#!/usr/bin/env bash

# Restart all vault platform services

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/common.sh"

print_header "Restarting Vault Platform Services"

print_section "Stopping services"
bash "$SCRIPT_DIR/services/stop.sh"

sleep 2

print_section "Starting services"
bash "$SCRIPT_DIR/services/start.sh"

log_success "All services restarted"
