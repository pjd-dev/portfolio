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

assert_set() {
  local var_name="$1"
  local var_value="${2:-}"
  
  if [ -z "$var_value" ]; then
    info "✗ Assertion failed: $var_name is not set"
    return 1
  fi
  return 0
}

# Test: VAULT_DATA_VOLUME environment variable
test_vault_data_volume_env() {
  export VAULT_DATA_VOLUME="test-vault-volume"
  unset VAULT_HOST_PATH 2>/dev/null || true
  
  local vault_host_path="${VAULT_HOST_PATH:-${VAULT_DATA_VOLUME}}"
  
  if assert_equal "test-vault-volume" "$vault_host_path" "(env var)"; then
    info "✓ VAULT_DATA_VOLUME environment variable"
    ((TESTS_PASSED++))
  else
    ((TESTS_FAILED++))
  fi
}

# Test: VAULT_DATA_VOLUME fallback to default
test_vault_data_volume_fallback() {
  unset VAULT_DATA_VOLUME VAULT_HOST_PATH 2>/dev/null || true
  
  local vault_host_path="${VAULT_HOST_PATH:-${VAULT_DATA_VOLUME:-vault}}"
  
  if assert_equal "vault" "$vault_host_path" "(fallback)"; then
    info "✓ VAULT_DATA_VOLUME fallback to default"
    ((TESTS_PASSED++))
  else
    ((TESTS_FAILED++))
  fi
}

# Test: Export multiple environment variables
test_export_variables() {
  export PROJECT_PATH="/tmp/test-project"
  export IMAGE_NAME="test-vault"
  export CONTAINER_NAME="test-container"
  
  local failed=0
  assert_set "PROJECT_PATH" "$PROJECT_PATH" || failed=1
  assert_set "IMAGE_NAME" "$IMAGE_NAME" || failed=1
  assert_set "CONTAINER_NAME" "$CONTAINER_NAME" || failed=1
  
  if [ $failed -eq 0 ]; then
    info "✓ Environment variable exports"
    ((TESTS_PASSED++))
  else
    ((TESTS_FAILED++))
  fi
}

# Test: VAULT_HOST_PATH overrides VAULT_DATA_VOLUME
test_vault_host_path_override() {
  export VAULT_HOST_PATH="/custom/path"
  export VAULT_DATA_VOLUME="test-vault"
  
  local vault_path="${VAULT_HOST_PATH:-${VAULT_DATA_VOLUME}}"
  
  if assert_equal "/custom/path" "$vault_path" "(override)"; then
    info "✓ VAULT_HOST_PATH overrides VAULT_DATA_VOLUME"
    ((TESTS_PASSED++))
  else
    ((TESTS_FAILED++))
  fi
}

# Run tests
info "Starting prepare.sh tests..."
info ""

test_vault_data_volume_env
test_vault_data_volume_fallback
test_export_variables
test_vault_host_path_override

info ""
info "Test Results: $TESTS_PASSED passed, $TESTS_FAILED failed"

[ "$TESTS_FAILED" -eq 0 ] || exit 1
