#!/usr/bin/env bash

# Initialize platform infrastructure (volumes, networks)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/common.sh"

print_header "Initializing Platform Infrastructure"

require_commands "$RUNTIME"

# Create volumes
print_section "Creating volumes"

volumes=("vault-data" "mcp-data" "vaulty-data")
for volume in "${volumes[@]}"; do
  if ! $RUNTIME volume inspect "$volume" &>/dev/null; then
    log_info "Creating volume: $volume"
    $RUNTIME volume create "$volume"
    log_success "Volume created: $volume"
  else
    log_success "Volume already exists: $volume"
  fi
done

# Create networks
print_section "Creating networks"

networks=("vault-network")
for network in "${networks[@]}"; do
  if ! $RUNTIME network inspect "$network" &>/dev/null; then
    log_info "Creating network: $network"
    $RUNTIME network create "$network"
    log_success "Network created: $network"
  else
    log_success "Network already exists: $network"
  fi
done

# Create directories
print_section "Creating directories"

dirs=(
  "$(get_config VAULT_PATH "$HOME/.obsidian/vault")"
  "$PROJECT_ROOT/.vault"
  "$PROJECT_ROOT/logs"
)

for dir in "${dirs[@]}"; do
  mkdir_p "$dir"
  log_success "Directory ready: $dir"
done

print_divider
log_success "Platform infrastructure initialized"
