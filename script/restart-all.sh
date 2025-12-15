#!/usr/bin/env bash
set -euo pipefail

SCRIPT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_ROOT/common.sh"
[ -f "$SCRIPT_ROOT/../.env" ] && source "$SCRIPT_ROOT/../.env"

LOG_DIR="${LOG_DIR:-$SCRIPT_ROOT/../logs}"
TUNNEL_LOG="${TUNNEL_LOG:-$LOG_DIR/cloudflared.log}"
SYNC_LOG="${SYNC_LOG:-$LOG_DIR/sync.log}"
mkdir -p "$LOG_DIR"

# Pod names from environment
VAULTY_POD="${POD_NAME:-vaulty-pod}"
MCP_POD="${MCP_POD_NAME:-mcp-pod}"

# Kill existing pods
info "Cleaning up existing pods..."
podman pod stop "$VAULTY_POD" 2>/dev/null || true
podman pod rm "$VAULTY_POD" 2>/dev/null || true
podman pod stop "$MCP_POD" 2>/dev/null || true
podman pod rm "$MCP_POD" 2>/dev/null || true

info "Restarting Vaulty..."
"$SCRIPT_ROOT/../apps/vaulty/restart-vaulty.sh"

info "Restarting MCP..."
"$SCRIPT_ROOT/../apps/mcp/restart-mcp.sh"

info "Sync volume -> local (one-shot)..."
"$SCRIPT_ROOT/sync-volume-to-local.sh"

info "Starting continuous sync + tunnel (parallel)..."

pids=()

cleanup() {
  info "Stopping background processes..."
  for pid in "${pids[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done
  sleep 1
  for pid in "${pids[@]:-}"; do
    kill -9 "$pid" 2>/dev/null || true
  done
}

trap cleanup INT TERM EXIT

# Start sync in background (continuous script)
info "Starting sync script..."
"$SCRIPT_ROOT/sync-local.sh" >>"$SYNC_LOG" 2>&1 &
pids+=("$!")
info "Sync running (pid=${pids[-1]}), logs: $SYNC_LOG"

# Start tunnel in background
info "Starting Cloudflare tunnel..."
"$SCRIPT_ROOT/cloudflared.tunnel.sh" >>"$TUNNEL_LOG" 2>&1 &
pids+=("$!")
info "Tunnel starting (pid=${pids[-1]}), logs: $TUNNEL_LOG"

info "Tunnel is open (or will be shortly). Press Ctrl+C to stop."
info "All services restarted successfully."

# Wait for both processes; if either dies, kill both and exit
while true; do
  for i in "${!pids[@]}"; do
    if ! kill -0 "${pids[$i]}" 2>/dev/null; then
      info "Process ${pids[$i]} exited. Shutting down all services."
      cleanup
      exit 1
    fi
  done
  sleep 1
done
