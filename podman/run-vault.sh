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

podman build -t vault -f "$REPO_ROOT/apps/vaulty/Dockerfile" "$REPO_ROOT/apps/vaulty"
# Use SELinux label :Z on the bind/volume mount to give container access on
# SELinux-enabled hosts (fixes "Permission denied" when accessing /vault).
podman run -d --rm --name vaulty --volume "${VAULT_DATA_VOLUME:-vault}":/vault:Z --env-file "$ENV_FILE" vault
