#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/common.sh"

CHECKIN_PATH="${1:-}"
if [[ -z "$CHECKIN_PATH" ]]; then
  die "Usage: scripts/utilities/apply-checkin.sh <checkin-note-path> [--dry-run]"
fi

shift || true

CHECKIN_SCRIPT="$PROJECT_ROOT/apps/mcp/scripts/apply-checkin.mjs"

require_commands node

VAULT_PATH="${VAULT_PATH:-${LOCAL_VAULT_PATH:-}}"
if [[ -z "$VAULT_PATH" ]]; then
  die "VAULT_PATH is required (or set LOCAL_VAULT_PATH)."
fi

log_info "Applying check-in..."
log_info "Vault path: $VAULT_PATH"
log_info "Check-in: $CHECKIN_PATH"

node "$CHECKIN_SCRIPT" --vault-path "$VAULT_PATH" --checkin "$CHECKIN_PATH" "$@"
