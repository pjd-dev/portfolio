#!/usr/bin/env bash
# smoke.sh - Idempotent confidence test for vault-platform services
# Usage: ./scripts/smoke.sh [--verbose]
#
# Runs quick, non-destructive tests to verify services are operational.
# Safe to run repeatedly - no side effects.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

VERBOSE="${1:-}"
PASSED=0
FAILED=0

log_pass() { echo -e "${GREEN}✓${NC} $1"; ((PASSED++)); }
log_fail() { echo -e "${RED}✗${NC} $1"; ((FAILED++)); }
log_info() { [[ "$VERBOSE" == "--verbose" ]] && echo -e "${YELLOW}ℹ${NC} $1" || true; }

# ─────────────────────────────────────────────────────────────
# MCP Server Smoke Tests
# ─────────────────────────────────────────────────────────────
test_mcp_health() {
  local port="${MCP_PORT:-4000}"
  local url="http://localhost:$port/mcp"
  
  log_info "Testing MCP at $url"
  
  # Check if MCP is reachable first (quick timeout) - 000 means connection failed
  http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 --connect-timeout 1 "$url" 2>/dev/null || echo "000")
  if [[ "$http_code" == "000" ]] || [[ "$http_code" == "" ]]; then
    echo -e "${YELLOW}⊘${NC} MCP server not running (skipped)"
    return 0
  fi
  
  # Test: MCP responds to tools/list
  response=$(curl -s --max-time 5 \
    --request POST \
    --url "$url" \
    --header 'accept: application/json, text/event-stream' \
    --header 'content-type: application/json' \
    --data '{"jsonrpc":"2.0","id":"smoke-1","method":"tools/list","params":{}}' 2>/dev/null || echo '{"error":"timeout"}')
  
  if echo "$response" | grep -q '"tools"'; then
    log_pass "MCP tools/list responds"
  else
    log_fail "MCP tools/list failed"
    return 1
  fi
  
  # Test: MCP can list notes (actual tool call)
  response=$(curl -s --max-time 10 \
    --request POST \
    --url "$url" \
    --header 'accept: application/json, text/event-stream' \
    --header 'content-type: application/json' \
    --data '{"jsonrpc":"2.0","id":"smoke-2","method":"tools/call","params":{"name":"obsidian_list_notes","arguments":{"pattern":"*.md"}}}' 2>/dev/null || echo '{"error":"timeout"}')
  
  if echo "$response" | grep -q '"result"'; then
    log_pass "MCP obsidian_list_notes works"
  else
    log_fail "MCP obsidian_list_notes failed"
    return 1
  fi
}

# ─────────────────────────────────────────────────────────────
# Vaulty Container Smoke Tests
# ─────────────────────────────────────────────────────────────
test_vaulty_container() {
  local container="${VAULTY_CONTAINER:-vaulty}"
  
  log_info "Testing Vaulty container: $container"
  
  # Test: Container is running
  if podman ps --format "{{.Names}}" 2>/dev/null | grep -q "^${container}$"; then
    log_pass "Vaulty container running"
  else
    log_fail "Vaulty container not running"
    return 1
  fi
  
  # Test: Vault directory exists
  if podman exec "$container" test -d /vault 2>/dev/null; then
    log_pass "Vault directory exists"
  else
    log_fail "Vault directory missing"
    return 1
  fi
  
  # Test: Git is functional
  if podman exec "$container" git -C /vault status >/dev/null 2>&1; then
    log_pass "Git operational in vault"
  else
    log_fail "Git not working in vault"
    return 1
  fi
}

# ─────────────────────────────────────────────────────────────
# Vault Files Smoke Tests (via container)
# ─────────────────────────────────────────────────────────────
test_vault_structure() {
  local container="${VAULTY_CONTAINER:-vaulty}"
  local vault_path="/vault"
  
  log_info "Testing vault at $container:$vault_path"
  
  # Test: Has markdown files
  md_count=$(podman exec "$container" sh -c "ls $vault_path/*.md 2>/dev/null | wc -l" 2>/dev/null || echo "0")
  if [[ "$md_count" -gt 0 ]]; then
    log_pass "Vault has markdown files ($md_count in root)"
  else
    log_fail "No markdown files in vault root"
    return 1
  fi
  
  # Test: Dashboard exists
  if podman exec "$container" test -f "$vault_path/Dashboard.md" 2>/dev/null; then
    log_pass "Dashboard.md exists"
  else
    log_fail "Dashboard.md missing"
    return 1
  fi
  
  # Test: _system folder exists
  if podman exec "$container" test -d "$vault_path/_system" 2>/dev/null; then
    log_pass "_system folder exists"
  else
    log_fail "_system folder missing"
    return 1
  fi
}

# ─────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────
main() {
  echo "═══════════════════════════════════════════════════════"
  echo " Vault Platform Smoke Tests"
  echo "═══════════════════════════════════════════════════════"
  echo ""
  
  # Run all smoke tests (continue on failure to get full report)
  test_mcp_health || true
  echo ""
  test_vaulty_container || true
  echo ""
  test_vault_structure || true
  
  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo -e " Results: ${GREEN}$PASSED passed${NC}, ${RED}$FAILED failed${NC}"
  echo "═══════════════════════════════════════════════════════"
  
  [[ $FAILED -eq 0 ]] && exit 0 || exit 1
}

main "$@"
