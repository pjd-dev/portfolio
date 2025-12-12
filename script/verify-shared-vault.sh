#!/usr/bin/env bash
# Verify that two running containers mount the same host vault path

set -euo pipefail

MCP_CONTAINER="${1:-mcp-server-dev}"
VAULTY_CONTAINER="${2:-vaulty}"

info() { echo "[verify-vault] $*"; }
fail() { echo "[verify-vault] ERROR: $*" >&2; exit 1; }

ensure_cmd() { command -v "$1" >/dev/null 2>&1 || fail "$1 not found in PATH"; }

ensure_cmd podman

get_mount_source() {
  local container="$1"
  if ! podman ps --format '{{.Names}}' | grep -qw "$container"; then
    echo ""
    return 0
  fi

  podman inspect --format '{{range .Mounts}}{{printf "%s %s\n" .Destination .Source}}{{end}}' "$container" | awk '$1=="/vault"{print $2; exit}'
}

src1=$(get_mount_source "$MCP_CONTAINER")
src2=$(get_mount_source "$VAULTY_CONTAINER")

if [ -z "$src1" ] && [ -z "$src2" ]; then
  fail "Neither container '$MCP_CONTAINER' nor '$VAULTY_CONTAINER' appears to be running"
fi

info "$MCP_CONTAINER -> $src1"
info "$VAULTY_CONTAINER -> $src2"

if [ -n "$src1" ] && [ -n "$src2" ]; then
  if [ "$src1" = "$src2" ]; then
    info "Both containers mount the same host path: $src1"
    exit 0
  else
    fail "Mount mismatch: $MCP_CONTAINER:$src1 != $VAULTY_CONTAINER:$src2"
  fi
else
  fail "One of the containers is not running or does not mount /vault"
fi
