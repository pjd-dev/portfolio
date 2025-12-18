#!/usr/bin/env bash

# Sync vault to local filesystem

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/common.sh"

load_env "$PROJECT_ROOT/.env" || true

VAULT_PATH="${VAULT_PATH:-$HOME/.obsidian/vault}"
LOCAL_VAULT="${LOCAL_VAULT:-$PROJECT_ROOT/.vault}"

print_header "Syncing Vault to Local Filesystem"

print_section "Configuration"
log_info "Source: $VAULT_PATH"
log_info "Destination: $LOCAL_VAULT"

require_dir "$VAULT_PATH"
mkdir_p "$LOCAL_VAULT"

print_section "Syncing files"
rsync -av --delete "$VAULT_PATH/" "$LOCAL_VAULT/" || die "Sync failed"

log_success "Vault synced successfully"
log_info "Synced $(find "$LOCAL_VAULT" -type f | wc -l) files"
