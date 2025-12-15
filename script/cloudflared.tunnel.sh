#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

LOG_DIR="${LOG_DIR:-$ROOT_DIR/logs}"
LOG_FILE="$LOG_DIR/cloudflared.log"
CF_LOG_LEVEL="${CF_LOG_LEVEL:-info}"

[[ -f "$ENV_FILE" ]] || { echo "❌ Missing .env at: $ENV_FILE"; exit 1; }
# shellcheck disable=SC1090
source "$ENV_FILE"

: "${CF_TUNNEL_NAME:?Missing CF_TUNNEL_NAME in $ENV_FILE}"

command -v cloudflared >/dev/null 2>&1 || { echo "❌ cloudflared not found in PATH"; exit 1; }

mkdir -p "$LOG_DIR"

echo "▶ Starting Cloudflare Tunnel"
echo "  name: $CF_TUNNEL_NAME"
echo "  loglevel: $CF_LOG_LEVEL"
echo "  logs: $LOG_FILE"

exec cloudflared tunnel --loglevel "$CF_LOG_LEVEL" run "$CF_TUNNEL_NAME" >>"$LOG_FILE" 2>&1