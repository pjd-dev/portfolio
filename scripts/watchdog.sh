#!/usr/bin/env bash
# watchdog.sh - Monitor MCP health and restart on consecutive failures
# Usage: ./scripts/watchdog.sh [--daemon]
#
# Monitors MCP server health. After N consecutive failures, triggers restart.
# Can run as one-shot check or daemon mode.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
if [[ -f "$ROOT_DIR/scripts/automation_state.sh" ]]; then
  # shellcheck source=/dev/null
  source "$ROOT_DIR/scripts/automation_state.sh"
fi

# ─────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────
MCP_PORT="${MCP_PORT:-4000}"
MCP_URL="http://localhost:$MCP_PORT/mcp"
MAX_FAILURES="${WATCHDOG_MAX_FAILURES:-3}"
CHECK_INTERVAL="${WATCHDOG_INTERVAL:-30}"
STATE_FILE="${WATCHDOG_STATE:-/tmp/mcp-watchdog.state}"
LOG_FILE="${WATCHDOG_LOG:-/tmp/mcp-watchdog.log}"
WATCHDOG_HTTP_CODE="0"
WATCHDOG_ERROR=""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

# ─────────────────────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────────────────────
log() {
  local level="$1"
  shift
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $*"
  echo "$msg" >> "$LOG_FILE"
  case "$level" in
    ERROR) echo -e "${RED}$msg${NC}" ;;
    WARN)  echo -e "${YELLOW}$msg${NC}" ;;
    INFO)  echo -e "${GREEN}$msg${NC}" ;;
    *)     echo "$msg" ;;
  esac
}

# ─────────────────────────────────────────────────────────────
# State Management
# ─────────────────────────────────────────────────────────────
get_failure_count() {
  if [[ -f "$STATE_FILE" ]]; then
    cat "$STATE_FILE"
  else
    echo "0"
  fi
}

set_failure_count() {
  echo "$1" > "$STATE_FILE"
}

reset_failure_count() {
  set_failure_count 0
}

# ─────────────────────────────────────────────────────────────
# Health Check
# ─────────────────────────────────────────────────────────────
check_mcp_health() {
  local response
  local http_code
  
  # Quick connectivity check
  http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 --connect-timeout 2 "$MCP_URL" 2>/dev/null || echo "000")
  WATCHDOG_HTTP_CODE="$http_code"
  WATCHDOG_ERROR=""
  
  if [[ "$http_code" == "000" ]]; then
    WATCHDOG_ERROR="connection_failed"
    log DEBUG "MCP not reachable (connection failed)"
    return 1
  fi
  
  # Actual MCP call
  response=$(curl -s --max-time 10 \
    --request POST \
    --url "$MCP_URL" \
    --header 'accept: application/json, text/event-stream' \
    --header 'content-type: application/json' \
    --data '{"jsonrpc":"2.0","id":"watchdog","method":"tools/list","params":{}}' 2>/dev/null || echo '{"error":"timeout"}')
  
  if echo "$response" | grep -q '"tools"'; then
    return 0
  else
    WATCHDOG_ERROR="tools_list_failed"
    log DEBUG "MCP responded but tools/list failed"
    return 1
  fi
}

# ─────────────────────────────────────────────────────────────
# Restart Logic
# ─────────────────────────────────────────────────────────────
restart_mcp() {
  log WARN "Attempting MCP restart..."
  
  # Try podman restart first
  if command -v podman &>/dev/null; then
    local mcp_container="${MCP_CONTAINER:-mcp}"
    if podman ps -a --format "{{.Names}}" | grep -q "^${mcp_container}$"; then
      log INFO "Restarting container: $mcp_container"
      podman restart "$mcp_container" 2>&1 | while read -r line; do log DEBUG "$line"; done
      sleep 5
      return 0
    fi
  fi
  
  # Try systemd if available
  if command -v systemctl &>/dev/null && systemctl list-units --type=service | grep -q mcp; then
    log INFO "Restarting via systemd"
    sudo systemctl restart mcp 2>&1 | while read -r line; do log DEBUG "$line"; done
    sleep 5
    return 0
  fi
  
  log ERROR "No restart method available (podman container or systemd service)"
  return 1
}

# ─────────────────────────────────────────────────────────────
# Main Check Loop
# ─────────────────────────────────────────────────────────────
run_check() {
  local failures
  local status
  local now
  local error_json
  local http_code
  failures=$(get_failure_count)
  
  if check_mcp_health; then
    if [[ "$failures" -gt 0 ]]; then
      log INFO "MCP recovered after $failures failure(s)"
    fi
    reset_failure_count
    failures=0
    status="healthy"
    if type automation_state_update >/dev/null 2>&1; then
      now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
      http_code="${WATCHDOG_HTTP_CODE:-0}"
      if [[ "$http_code" == "000" ]]; then
        http_code="0"
      fi
      error_json="null"
      if [[ -n "${WATCHDOG_ERROR:-}" ]]; then
        error_json="\"${WATCHDOG_ERROR}\""
      fi
      payload=$(printf '{"status":"%s","last_check":"%s","http_code":%s,"error":%s,"consecutive_failures":%s}' \
        "$status" "$now" "$http_code" "$error_json" "$failures")
      automation_state_update "mcp" "$payload"
    fi
    return 0
  else
    failures=$((failures + 1))
    set_failure_count "$failures"
    log WARN "MCP health check failed ($failures/$MAX_FAILURES)"
    status="unhealthy"
    
    if [[ "$failures" -ge "$MAX_FAILURES" ]]; then
      log ERROR "Max failures reached ($MAX_FAILURES), triggering restart"
      if restart_mcp; then
        reset_failure_count
        # Verify restart worked
        sleep 10
        if check_mcp_health; then
          log INFO "MCP restart successful"
          if type automation_state_update >/dev/null 2>&1; then
            now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
            http_code="${WATCHDOG_HTTP_CODE:-0}"
            if [[ "$http_code" == "000" ]]; then
              http_code="0"
            fi
            error_json="null"
            if [[ -n "${WATCHDOG_ERROR:-}" ]]; then
              error_json="\"${WATCHDOG_ERROR}\""
            fi
            payload=$(printf '{"status":"%s","last_check":"%s","http_code":%s,"error":%s,"consecutive_failures":%s}' \
              "healthy" "$now" "$http_code" "$error_json" "0")
            automation_state_update "mcp" "$payload"
          fi
          return 0
        else
          log ERROR "MCP still unhealthy after restart"
          return 1
        fi
      else
        return 1
      fi
    fi
    if type automation_state_update >/dev/null 2>&1; then
      now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
      http_code="${WATCHDOG_HTTP_CODE:-0}"
      if [[ "$http_code" == "000" ]]; then
        http_code="0"
      fi
      error_json="null"
      if [[ -n "${WATCHDOG_ERROR:-}" ]]; then
        error_json="\"${WATCHDOG_ERROR}\""
      fi
      payload=$(printf '{"status":"%s","last_check":"%s","http_code":%s,"error":%s,"consecutive_failures":%s}' \
        "$status" "$now" "$http_code" "$error_json" "$failures")
      automation_state_update "mcp" "$payload"
    fi
    return 1
  fi
}

# ─────────────────────────────────────────────────────────────
# Daemon Mode
# ─────────────────────────────────────────────────────────────
run_daemon() {
  log INFO "Starting watchdog daemon (interval: ${CHECK_INTERVAL}s, max failures: $MAX_FAILURES)"
  
  while true; do
    run_check || true
    sleep "$CHECK_INTERVAL"
  done
}

# ─────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────
show_status() {
  local failures
  failures=$(get_failure_count)
  echo "Watchdog Status"
  echo "───────────────"
  echo "MCP URL:        $MCP_URL"
  echo "Max Failures:   $MAX_FAILURES"
  echo "Current Fails:  $failures"
  echo "State File:     $STATE_FILE"
  echo "Log File:       $LOG_FILE"
  echo ""
  echo -n "MCP Health:     "
  if check_mcp_health; then
    echo -e "${GREEN}HEALTHY${NC}"
  else
    echo -e "${RED}UNHEALTHY${NC}"
  fi
}

main() {
  case "${1:-check}" in
    --daemon|-d)
      run_daemon
      ;;
    --status|-s)
      show_status
      ;;
    --reset|-r)
      reset_failure_count
      log INFO "Failure count reset"
      ;;
    --check|check)
      if run_check; then
        echo -e "${GREEN}✓${NC} MCP healthy"
        exit 0
      else
        echo -e "${RED}✗${NC} MCP unhealthy ($(get_failure_count)/$MAX_FAILURES failures)"
        exit 1
      fi
      ;;
    --help|-h)
      echo "Usage: $0 [command]"
      echo ""
      echo "Commands:"
      echo "  check      Run single health check (default)"
      echo "  --daemon   Run as continuous watchdog"
      echo "  --status   Show watchdog status"
      echo "  --reset    Reset failure counter"
      echo ""
      echo "Environment:"
      echo "  MCP_PORT              MCP server port (default: 4000)"
      echo "  WATCHDOG_MAX_FAILURES Failures before restart (default: 3)"
      echo "  WATCHDOG_INTERVAL     Check interval in seconds (default: 30)"
      ;;
    *)
      echo "Unknown command: $1"
      exit 1
      ;;
  esac
}

main "$@"
