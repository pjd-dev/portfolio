#!/usr/bin/env bash

# Clean up containers and volumes

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/common.sh"

print_header "Cleaning Up Platform Resources"

require_commands "$RUNTIME"

# Stop services
print_section "Stopping services"
bash "$SCRIPT_DIR/services/stop.sh" || true

# Remove containers
print_section "Removing containers"
containers=("mcp" "vaulty" "vault")
for container in "${containers[@]}"; do
  cid=$($RUNTIME ps -a --filter "name=$container" --format "{{.ID}}" 2>/dev/null || true)
  if [[ -n "$cid" ]]; then
    log_info "Removing container: $container"
    $RUNTIME rm -f "$cid" || log_warn "Failed to remove $container"
  fi
done

# Option to remove volumes
if [[ -t 0 ]]; then
  read -p "Remove volumes as well? [y/N] " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_section "Removing volumes"
    volumes=("vault-data" "mcp-data" "vaulty-data")
    for volume in "${volumes[@]}"; do
      if $RUNTIME volume inspect "$volume" &>/dev/null; then
        log_info "Removing volume: $volume"
        $RUNTIME volume rm "$volume" || log_warn "Failed to remove $volume"
      fi
    done
  fi
fi

log_success "Cleanup complete"
