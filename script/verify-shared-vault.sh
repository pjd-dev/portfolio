#!/usr/bin/env bash

# ⚠️  DEPRECATED - This script is no longer maintained
# 
# This script has been migrated to the centralized script system.
# Please use the new commands instead:
#
#   ./scripts/vault infrastructure verify
#   ./scripts/vault infrastructure validate
#
# The logic from this file has been integrated into:
#   - scripts/infrastructure/verify.sh
#   - scripts/infrastructure/validate.sh
#
# This file will be removed in the next major version.
# See doc/PHASE4_DETAILED_PLAN.md for migration details.

# Verify that two running containers mount the same vault volume
# Usage: ./verify-shared-vault.sh [mcp_container] [vaulty_container]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

load_env_files

# Use defaults from environment
MCP_CONTAINER="${1:-mcp}"
VAULTY_CONTAINER="${2:-vaulty}"

ensure_command podman

get_mount_source() {
  local container="$1"
  if ! podman ps --format '{{.Names}}' | grep -qw "$container"; then
    echo ""
    return 0
  fi

  podman inspect --format '{{range .Mounts}}{{printf "%s %s\n" .Destination .Source}}{{end}}' "$container" 2>/dev/null | awk '$1=="/vault"{print $2; exit}'
}

info "Checking vault mounts for containers..."

src1=$(get_mount_source "$MCP_CONTAINER")
src2=$(get_mount_source "$VAULTY_CONTAINER")

if [ -z "$src1" ] && [ -z "$src2" ]; then
  fail "Neither container '$MCP_CONTAINER' nor '$VAULTY_CONTAINER' appears to be running"
fi

info "$MCP_CONTAINER -> ${src1:-<not mounted>}"
info "$VAULTY_CONTAINER -> ${src2:-<not mounted>}"

if [ -n "$src1" ] && [ -n "$src2" ]; then
  if [ "$src1" = "$src2" ]; then
    info "✅ Both containers mount the same volume/path: $src1"
    exit 0
  else
    fail "❌ Mount mismatch: $MCP_CONTAINER:$src1 != $VAULTY_CONTAINER:$src2"
  fi
else
  fail "One of the containers is not running or does not mount /vault"
fi
