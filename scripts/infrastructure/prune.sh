#!/usr/bin/env bash

# Prune unused Docker/Podman resources

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/common.sh"

print_header "Pruning Docker/Podman Resources"

require_commands "$RUNTIME"

print_section "Pruning system resources"

# Prune images
log_info "Pruning dangling images..."
$RUNTIME image prune -f || log_warn "Image prune failed"

# Prune volumes
log_info "Pruning dangling volumes..."
$RUNTIME volume prune -f || log_warn "Volume prune failed"

# Prune networks
log_info "Pruning dangling networks..."
$RUNTIME network prune -f || log_warn "Network prune failed"

# Prune containers
log_info "Pruning stopped containers..."
$RUNTIME container prune -f || log_warn "Container prune failed"

log_success "Pruning complete"

# Show disk usage
print_section "Disk usage"
$RUNTIME system df || log_warn "Failed to show disk usage"
