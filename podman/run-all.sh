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
# Load app-level .env files so CONTAINER_NAME overrides are respected
for app in vaulty mcp; do
	app_env="$REPO_ROOT/../apps/$app/.env"
	if [ -f "$app_env" ]; then
		set -o allexport
		# shellcheck disable=SC1090
		source "$app_env"
		set +o allexport
	fi
done

VAULT_CONTAINER="${VAULT_CONTAINER_NAME:-${CONTAINER_NAME:-vaulty}}"
MCP_CONTAINER="${MCP_CONTAINER_NAME:-${CONTAINER_NAME:-mcp}}"

podman container stop "$VAULT_CONTAINER" 2>/dev/null || true
podman container rm "$VAULT_CONTAINER" 2>/dev/null || true
podman container stop "$MCP_CONTAINER" 2>/dev/null || true
podman container rm "$MCP_CONTAINER" 2>/dev/null || true

# Start the services
./podman/run-vault.sh
./podman/run-mcp.sh
# ./podman/run-vault-sync.sh