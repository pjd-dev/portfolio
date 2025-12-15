#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Initialize podman volume and local folder
# Usage: ./init-volume.sh [volume_name] [local_path]

load_env_files

VOLUME_NAME="${1:-${VAULT_DATA_VOLUME:-vault}}"
LOCAL_PATH="${2:-$LOCAL_VAULT_PATH}"

# Resolve path properly (handles ~, relative paths, and escaped spaces)
if [ -n "$LOCAL_PATH" ]; then
  LOCAL_PATH="$(resolve_path "$LOCAL_PATH")"
fi

# Create volume if not exists
if podman volume exists "$VOLUME_NAME" 2>/dev/null; then
  info "Volume '$VOLUME_NAME' already exists."
else
  info "Creating volume '$VOLUME_NAME'..."
  podman volume create "$VOLUME_NAME" || fail "Failed to create volume"
  info "Volume '$VOLUME_NAME' created successfully."
fi

# Handle local path
if [ -n "$LOCAL_PATH" ]; then
  if [ ! -d "$LOCAL_PATH" ]; then
    info "Local path '$LOCAL_PATH' does not exist. Creating..."
    mkdir -p "$LOCAL_PATH" || fail "Failed to create local path"
    info "Local folder '$LOCAL_PATH' created."
  else
    info "Local path '$LOCAL_PATH' exists."
  fi

  # Copy contents from local to volume if local has files
  if [ "$(ls -A "$LOCAL_PATH" 2>/dev/null)" ]; then
    info "Copying contents from '$LOCAL_PATH' to volume '$VOLUME_NAME'..."
    # Use . instead of * to include hidden files, and -a for preserving attributes
    podman run --rm -v "$LOCAL_PATH":/src:Z -v "$VOLUME_NAME":/dst alpine sh -c "cp -a /src/. /dst/" || warn "Some files may not have been copied"
    info "Contents copied to volume '$VOLUME_NAME'."
  else
    info "Local path '$LOCAL_PATH' is empty, no copy needed."
  fi
fi

info "Volume initialization complete."