#!/usr/bin/env bash

# ⚠️  DEPRECATED - This script is no longer maintained
# 
# This script has been migrated to the centralized script system.
# Please use the new commands instead:
#
#   ./scripts/vault infrastructure init
#   ./scripts/vault infrastructure validate
#
# The logic from this file has been integrated into:
#   - scripts/infrastructure/init.sh
#   - scripts/infrastructure/validate.sh
#
# This file will be removed in the next major version.
# See doc/PHASE4_DETAILED_PLAN.md for migration details.

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
    
    # Fix permissions on copied files to allow writing from containers
    info "Fixing permissions on volume contents..."
    podman run --rm -v "$VOLUME_NAME":/dst alpine sh -c "
      find /dst -type f ! -path '*/.git/*' -exec chmod 666 {} + 2>/dev/null || true
      find /dst -type d ! -path '*/.git/*' -exec chmod 777 {} + 2>/dev/null || true
      chmod 777 /dst
    " || warn "Could not fix all permissions"
    
    info "Contents copied to volume '$VOLUME_NAME'."
  else
    info "Local path '$LOCAL_PATH' is empty, no copy needed."
  fi
fi

info "Volume initialization complete."