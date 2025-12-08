#!/bin/bash
# Resolve script and repo root directories and source root .env if present
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$REPO_ROOT/.env"
if [ -f "$ENV_FILE" ]; then
	set -a
	# shellcheck disable=SC1090
	source "$ENV_FILE"
	set +a
fi

podman build -t mcp -f "$REPO_ROOT/apps/mcp/Dockerfile" "$REPO_ROOT/apps/mcp"
podman run -d --rm --name mcp --volume "${VAULT_DATA_VOLUME:-vault-data}":/vault -p "${MCP_PORT:-8080}":8080 mcp