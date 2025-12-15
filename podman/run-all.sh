#!/bin/bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Load repo-level helpers and env support (matches script/restart-all.sh)
# shellcheck disable=SC1090
source "$REPO_ROOT/script/common.sh"
load_env_files

# Pod names from environment (loaded by common.sh)
VAULTY_POD="${POD_NAME:-vaulty-pod}"
MCP_POD="${MCP_POD_NAME:-mcp-pod}"

info "Cleaning up existing pods..."
podman pod stop "$VAULTY_POD" 2>/dev/null || true
podman pod rm "$VAULTY_POD" 2>/dev/null || true
podman pod stop "$MCP_POD" 2>/dev/null || true
podman pod rm "$MCP_POD" 2>/dev/null || true

info "Cleaning up containers..."
podman container stop vaulty 2>/dev/null || true
podman container rm vaulty 2>/dev/null || true
podman container stop mcp 2>/dev/null || true
podman container rm mcp 2>/dev/null || true

# Start the services
./podman/run-vault.sh
./podman/run-mcp.sh
# ./podman/run-vault-sync.sh