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

# Decide on volume source: prefer LOCAL_VAULT_PATH (host path) when set,
# otherwise use named volume defined by VAULT_DATA_VOLUME. Always apply
# SELinux label :Z to ensure container can write the mount on SELinux hosts.
VOLUME_SOURCE="${LOCAL_VAULT_PATH:-${VAULT_DATA_VOLUME:-vault}}"
# Expand ~ if present in a host path
if [ "${VOLUME_SOURCE#~}" != "$VOLUME_SOURCE" ]; then
	VOLUME_SOURCE="$(eval echo $VOLUME_SOURCE)"
fi

podman run -d --rm --name vaulty --volume "$VOLUME_SOURCE":/vault:Z --env-file "$ENV_FILE" vault
