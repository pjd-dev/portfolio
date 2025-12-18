#!/usr/bin/env bash

# Start Cloudflared tunnel

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/common.sh"

load_env "$PROJECT_ROOT/.env" || true

print_header "Starting Cloudflared Tunnel"

require_commands "cloudflared"

TUNNEL_NAME="${TUNNEL_NAME:-vault-tunnel}"
TUNNEL_ROUTE="${TUNNEL_ROUTE:-localhost:3333}"

print_section "Configuration"
log_info "Tunnel name: $TUNNEL_NAME"
log_info "Route: $TUNNEL_ROUTE"

print_section "Starting tunnel"
cloudflared tunnel --url "$TUNNEL_ROUTE" || die "Failed to start tunnel"

log_success "Tunnel started"
