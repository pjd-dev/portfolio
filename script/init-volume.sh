#!/usr/bin/env bash

# Load root .env if exists
ENV_FILE="$(dirname "${BASH_SOURCE[0]}")/../.env"
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

# Initialize podman volume and local folder
# Usage: ./init-volume.sh [volume_name] [local_path]

VOLUME_NAME="${1:-${VAULT_DATA_VOLUME:-vault}}"
LOCAL_PATH="${2:-$LOCAL_VAULT_PATH}"

# Ensure local path starts from $HOME if relative
if [[ "$LOCAL_PATH" != /* ]]; then
  LOCAL_PATH="$HOME/$LOCAL_PATH"
fi

# Create volume if not exists
if podman volume exists "$VOLUME_NAME" >/dev/null 2>&1; then
  echo "Volume '$VOLUME_NAME' already exists."
else
  echo "Creating volume '$VOLUME_NAME'..."
  podman volume create "$VOLUME_NAME"
  echo "Volume '$VOLUME_NAME' created successfully."
fi

# Handle local path
if [ -n "$LOCAL_PATH" ]; then
  if [ ! -d "$LOCAL_PATH" ]; then
    echo "Local path '$LOCAL_PATH' does not exist. Creating..."
    mkdir -p "$LOCAL_PATH"
    echo "Local folder '$LOCAL_PATH' created."
  else
    echo "Local path '$LOCAL_PATH' exists."
  fi

  # Copy contents from local to volume if local has files
  if [ "$(ls -A "$LOCAL_PATH" 2>/dev/null)" ]; then
    echo "Copying contents from '$LOCAL_PATH' to volume '$VOLUME_NAME'..."
    podman run --rm -v "$LOCAL_PATH":/src:Z -v "$VOLUME_NAME":/dst alpine sh -c "cp -r /src/* /dst/ 2>/dev/null || true"
    echo "Contents copied to volume '$VOLUME_NAME'."
  else
    echo "Local path '$LOCAL_PATH' is empty, no copy needed."
  fi
fi