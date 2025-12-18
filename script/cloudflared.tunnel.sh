#!/usr/bin/env bash

# ⚠️  DEPRECATED - This script is no longer maintained
# 
# This script has been migrated to the centralized script system.
# Please use the new command instead:
#
#   ./scripts/vault utilities tunnel [start|status|list]
#
# The logic from this file has been integrated into:
#   - scripts/utilities/tunnel.sh
#
# This file will be removed in the next major version.
# See doc/PHASE4_DETAILED_PLAN.md for migration details.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

LOG_DIR="${LOG_DIR:-$SCRIPT_DIR/../logs}"
LOG_FILE="$LOG_DIR/cloudflared.log"
CF_LOG_LEVEL="${CF_LOG_LEVEL:-info}"

# Load environment variables
load_env_files

: "${CF_TUNNEL_NAME:?Missing CF_TUNNEL_NAME in .env (or set CF_TUNNEL_CONFIG)}"

command -v cloudflared >/dev/null 2>&1 || { echo "❌ cloudflared not found in PATH"; exit 1; }

mkdir -p "$LOG_DIR"

echo "▶ Starting Cloudflare Tunnel"
echo "  name: $CF_TUNNEL_NAME"
echo "  loglevel: $CF_LOG_LEVEL"
echo "  logs: $LOG_FILE"

# Use CF_TUNNEL_CONFIG as fallback for CF_TUNNEL_NAME
TUNNEL="${CF_TUNNEL_NAME:-$CF_TUNNEL_CONFIG}"

# Don't redirect here since restart-all.sh already does it
exec cloudflared tunnel --loglevel "$CF_LOG_LEVEL" run "$TUNNEL"