#!/usr/bin/env bash

# View service logs

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/common.sh"

service="${1:-all}"

print_header "Viewing Service Logs"

case "$service" in
  mcp)
    log_info "Showing MCP logs..."
    $RUNTIME logs -f mcp
    ;;
  viewer)
    log_info "Showing Viewer logs..."
    $RUNTIME logs -f viewer
    ;;
  vaulty|vault)
    log_info "Showing Vaulty/Vault logs..."
    $RUNTIME logs -f vaulty
    ;;
  all)
    log_info "Showing all service logs..."
    echo ""
    log_warn "Showing MCP logs (Ctrl+C to exit, or specify service: mcp, vaulty, viewer)"
    echo ""
    $RUNTIME logs -f mcp
    ;;
  *)
    log_error "Unknown service: $service"
    log_info "Available services: mcp, vaulty, viewer, all"
    exit 1
    ;;
esac
