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

podman build -t vault -f "$REPO_ROOT/apps/vault/Dockerfile" "$REPO_ROOT/apps/vault"
podman run -d --rm --name vault --volume "${VAULT_DATA_VOLUME:-$REPO_ROOT/vault-data}":/vault --volume "$REPO_ROOT/vault-data":/app/vault-data --env-file "$ENV_FILE" vault
