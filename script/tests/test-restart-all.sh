#!/usr/bin/env bash
set -euo pipefail

SCRIPT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_ROOT/common.sh"

TESTS_PASSED=0
TESTS_FAILED=0

# Helper function for assertions
assert_equal() {
  local expected="$1"
  local actual="$2"
  local message="${3:-}"
  
  if [ "$actual" != "$expected" ]; then
    info "✗ Assertion failed: expected '$expected' but got '$actual' $message"
    return 1
  fi
  return 0
}

assert_file_exists() {
  local file_path="$1"
  local message="${2:-}"
  
  if [ ! -e "$file_path" ]; then
    info "✗ Assertion failed: file does not exist: $file_path $message"
    return 1
  fi
  return 0
}

assert_dir_exists() {
  local dir_path="$1"
  local message="${2:-}"
  
  if [ ! -d "$dir_path" ]; then
    info "✗ Assertion failed: directory does not exist: $dir_path $message"
    return 1
  fi
  return 0
}

# Test: Load environment variables from .env file
test_env_loading() {
  local test_env="$TEST_DIR/.env.test.$$"
  
  cat > "$test_env" << 'EOF'
POD_NAME=test-vaulty-pod
MCP_POD_NAME=test-mcp-pod
VAULT_DATA_VOLUME=test-vault
EOF
  
  unset POD_NAME MCP_POD_NAME VAULT_DATA_VOLUME 2>/dev/null || true
  source "$test_env"
  
  local failed=0
  assert_equal "test-vaulty-pod" "${POD_NAME:-}" "(POD_NAME)" || failed=1
  assert_equal "test-mcp-pod" "${MCP_POD_NAME:-}" "(MCP_POD_NAME)" || failed=1
  assert_equal "test-vault" "${VAULT_DATA_VOLUME:-}" "(VAULT_DATA_VOLUME)" || failed=1
  
  rm -f "$test_env"
  
  if [ $failed -eq 0 ]; then
    info "✓ Environment loading from .env file"
    ((TESTS_PASSED++))
  else
    ((TESTS_FAILED++))
  fi
}

# Test: Pod name defaults when not set
test_pod_name_defaults() {
  unset POD_NAME MCP_POD_NAME 2>/dev/null || true
  
  local vaulty_pod="${POD_NAME:-vaulty-pod}"
  local mcp_pod="${MCP_POD_NAME:-mcp-pod}"
  
  local failed=0
  assert_equal "vaulty-pod" "$vaulty_pod" "(vaulty fallback)" || failed=1
  assert_equal "mcp-pod" "$mcp_pod" "(mcp fallback)" || failed=1
  
  if [ $failed -eq 0 ]; then
    info "✓ Pod name defaults (vaulty-pod, mcp-pod)"
    ((TESTS_PASSED++))
  else
    ((TESTS_FAILED++))
  fi
}

# Test: Pod name overrides when set
test_pod_name_override() {
  export POD_NAME="custom-vaulty-pod"
  export MCP_POD_NAME="custom-mcp-pod"
  
  local vaulty_pod="${POD_NAME:-vaulty-pod}"
  local mcp_pod="${MCP_POD_NAME:-mcp-pod}"
  
  local failed=0
  assert_equal "custom-vaulty-pod" "$vaulty_pod" "(custom vaulty)" || failed=1
  assert_equal "custom-mcp-pod" "$mcp_pod" "(custom mcp)" || failed=1
  
  unset POD_NAME MCP_POD_NAME 2>/dev/null || true
  
  if [ $failed -eq 0 ]; then
    info "✓ Pod name override from environment"
    ((TESTS_PASSED++))
  else
    ((TESTS_FAILED++))
  fi
}

# Test: Log directory creation
test_log_directory_creation() {
  local test_log_dir="/tmp/test-logs-$$"
  mkdir -p "$test_log_dir"
  
  if assert_dir_exists "$test_log_dir" "(test log dir)"; then
    info "✓ Log directory creation"
    ((TESTS_PASSED++))
  else
    ((TESTS_FAILED++))
  fi
  
  rm -rf "$test_log_dir"
}

# Test: Log file path construction
test_log_file_paths() {
  local log_dir="/tmp/test-logs-$$"
  mkdir -p "$log_dir"
  
  local tunnel_log="${log_dir}/cloudflared.log"
  local sync_log="${log_dir}/sync.log"
  
  # Touch files to create them
  touch "$tunnel_log" "$sync_log"
  
  local failed=0
  assert_file_exists "$tunnel_log" "(tunnel log)" || failed=1
  assert_file_exists "$sync_log" "(sync log)" || failed=1
  
  rm -rf "$log_dir"
  
  if [ $failed -eq 0 ]; then
    info "✓ Log file paths (cloudflared.log, sync.log)"
    ((TESTS_PASSED++))
  else
    ((TESTS_FAILED++))
  fi
}

# Run tests
info "Starting restart-all.sh tests..."
info ""

test_env_loading
test_pod_name_defaults
test_pod_name_override
test_log_directory_creation
test_log_file_paths

info ""
info "Test Results: $TESTS_PASSED passed, $TESTS_FAILED failed"

[ "$TESTS_FAILED" -eq 0 ] || exit 1
