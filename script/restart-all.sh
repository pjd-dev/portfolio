#!/usr/bin/env bash
set -euo pipefail

SCRIPT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_ROOT/common.sh"

LOG_DIR="${LOG_DIR:-$SCRIPT_ROOT/../logs}"
TUNNEL_LOG="${TUNNEL_LOG:-$LOG_DIR/cloudflared.log}"
SYNC_LOG="${SYNC_LOG:-$LOG_DIR/sync.log}"
mkdir -p "$LOG_DIR"

# Pod names from environment (loaded by common.sh)
VAULTY_POD="${POD_NAME:-vaulty-pod}"
MCP_POD="${MCP_POD_NAME:-mcp-pod}"

# Clean up existing pods FIRST (before app restarts recreate them)
info "Cleaning up existing pods..."
podman pod stop "$VAULTY_POD" 2>/dev/null || true
podman pod rm "$VAULTY_POD" 2>/dev/null || true
podman pod stop "$MCP_POD" 2>/dev/null || true
podman pod rm "$MCP_POD" 2>/dev/null || true

# Clean up any orphaned containers
info "Cleaning up containers..."
podman container stop vaulty 2>/dev/null || true
podman container rm vaulty 2>/dev/null || true
podman container stop mcp 2>/dev/null || true
podman container rm mcp 2>/dev/null || true

info "Restarting Vaulty..."
"$SCRIPT_ROOT/../apps/vaulty/restart-vaulty.sh"

info "Restarting MCP..."
"$SCRIPT_ROOT/../apps/mcp/restart-mcp.sh"

info "Sync volume -> local (one-shot)..."
"$SCRIPT_ROOT/sync-volume-to-local.sh" "$VAULT_DATA_VOLUME" "$LOCAL_VAULT_PATH" once

info "Starting continuous sync + tunnel (parallel)..."

pids=()

cleanup() {
  info "Stopping background processes..."
  # Ensure cloudflared is stopped first
  stop_cloudflared || true
  for pid in "${pids[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done
  sleep 1
  for pid in "${pids[@]:-}"; do
    kill -9 "$pid" 2>/dev/null || true
  done
}

# Additional cleanup for cloudflared tunnel processes and artifacts
stop_cloudflared() {
  # Try graceful shutdown
  if command -v cloudflared >/dev/null 2>&1; then
    info "Stopping cloudflared processes..."
    # attempt to kill specific tunnel runs first
    pkill -f "cloudflared tunnel" 2>/dev/null || true
    # fallback: kill any cloudflared process
    pkill cloudflared 2>/dev/null || true
    sleep 1
    # ensure processes are dead
    pkill -9 -f "cloudflared tunnel" 2>/dev/null || true
    pkill -9 cloudflared 2>/dev/null || true
  fi
  # Optionally remove socket files if present (best-effort)
  if [ -d "/var/run/cloudflared" ]; then
    info "Removing /var/run/cloudflared artifacts"
    rm -rf /var/run/cloudflared 2>/dev/null || true
  fi
}

trap cleanup INT TERM EXIT

# Start continuous sync in background
info "Starting continuous sync..."
"$SCRIPT_ROOT/sync-volume-to-local.sh" "$VAULT_DATA_VOLUME" "$LOCAL_VAULT_PATH" "${SYNC_INTERVAL:-60}" >>"$SYNC_LOG" 2>&1 &
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
