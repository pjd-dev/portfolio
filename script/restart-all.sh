#!/usr/bin/env bash
set -euo pipefail

SCRIPT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_ROOT/common.sh"

info "Restarting Vaulty..."
"$SCRIPT_ROOT/../apps/vaulty/restart-vaulty.sh"

info "Restarting MCP..."
"$SCRIPT_ROOT/../apps/mcp/restart-mcp.sh"

info "All services restarted successfully."