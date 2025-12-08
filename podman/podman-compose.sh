#!/bin/bash
# Multi-container Podman setup script

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

# Create shared volume
podman volume create "${VAULT_DATA_VOLUME:-vault-data}"

# Start Vault container
podman run -d --rm --name vault \
  --volume "${VAULT_DATA_VOLUME:-vault-data}":/vault \
  --env-file "$ENV_FILE" \
  -e SYNC_MODE=${SYNC_MODE:-interval} \
  localhost/vault

# Start MCP container (placeholder image)
podman run -d --rm --name mcp \
  --volume "${VAULT_DATA_VOLUME:-vault-data}":/vault \
  -p "${MCP_PORT:-8080}":8080 \
  localhost/mcp

# Optionally: vault-sync
# podman run -d --rm --name vault-sync --volume "${VAULT_DATA_VOLUME:-vault-data}":/vault localhost/vault-sync
