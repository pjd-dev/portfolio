#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/common.sh"

WORLD_SCRIPT="$PROJECT_ROOT/apps/mcp/scripts/refresh-world.mjs"

require_commands node

VAULT_PATH="${VAULT_PATH:-${LOCAL_VAULT_PATH:-}}"
if [[ -z "$VAULT_PATH" ]]; then
  die "VAULT_PATH is required (or set LOCAL_VAULT_PATH)."
fi

log_info "Refreshing world state..."
log_info "Vault path: $VAULT_PATH"

node "$WORLD_SCRIPT" --vault-path "$VAULT_PATH" "$@"
