#!/usr/bin/env bash

# Verify vault integrity

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/common.sh"

load_env "$PROJECT_ROOT/.env" || true

VAULT_PATH="${VAULT_PATH:-$HOME/.obsidian/vault}"

print_header "Verifying Vault Integrity"

require_dir "$VAULT_PATH"

print_section "Checking vault structure"

# Check for required directories
required_dirs=(".obsidian" "3. Resources")
for dir in "${required_dirs[@]}"; do
  if [[ -d "$VAULT_PATH/$dir" ]]; then
    log_success "Found: $dir"
  else
    log_warn "Missing: $dir"
  fi
done

# Count files
file_count=$(find "$VAULT_PATH" -type f | wc -l)
dir_count=$(find "$VAULT_PATH" -type d | wc -l)

log_info "File count: $file_count"
log_info "Directory count: $dir_count"

# Check for large files
print_section "Checking for large files"
find "$VAULT_PATH" -type f -size +100M | head -5 | while read -r file; do
  log_warn "Large file: $file ($(du -h "$file" | cut -f1))"
done

log_success "Vault verification complete"
