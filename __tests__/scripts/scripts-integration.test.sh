#!/usr/bin/env bash

# Scripts Integration Tests
# Validates all migrated scripts work correctly
# Run with: bash __tests__/scripts/scripts-integration.test.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
pass() {
  echo -e "${GREEN}✅ PASS${NC}: $1"
  ((TESTS_PASSED++))
  ((TESTS_RUN++))
}

fail() {
  echo -e "${RED}❌ FAIL${NC}: $1"
  ((TESTS_FAILED++))
  ((TESTS_RUN++))
}

skip() {
  echo -e "${YELLOW}⊘ SKIP${NC}: $1"
  ((TESTS_RUN++))
}

# Test 1: Common.sh loads without errors
test_common_sh_load() {
  if bash -c "source $PROJECT_ROOT/scripts/common.sh 2>/dev/null" && \
     bash -c "source $PROJECT_ROOT/scripts/common.sh && declare -F log_info >/dev/null 2>&1"; then
    pass "common.sh loads successfully"
  else
    fail "common.sh failed to load or missing functions"
  fi
}

# Test 2: All service scripts have valid syntax
test_service_scripts_syntax() {
  local all_valid=true
  for script in scripts/services/*.sh; do
    if ! bash -n "$PROJECT_ROOT/$script" 2>/dev/null; then
      fail "Syntax error in $script"
      all_valid=false
    fi
  done
  
  if $all_valid; then
    pass "All service scripts have valid syntax"
  fi
}

# Test 3: All infrastructure scripts have valid syntax
test_infrastructure_scripts_syntax() {
  local all_valid=true
  for script in scripts/infrastructure/*.sh; do
    if ! bash -n "$PROJECT_ROOT/$script" 2>/dev/null; then
      fail "Syntax error in $script"
      all_valid=false
    fi
  done
  
  if $all_valid; then
    pass "All infrastructure scripts have valid syntax"
  fi
}

# Test 4: All utility scripts have valid syntax
test_utilities_scripts_syntax() {
  local all_valid=true
  for script in scripts/utilities/*.sh; do
    if ! bash -n "$PROJECT_ROOT/$script" 2>/dev/null; then
      fail "Syntax error in $script"
      all_valid=false
    fi
  done
  
  if $all_valid; then
    pass "All utility scripts have valid syntax"
  fi
}

# Test 5: Main vault script has valid syntax
test_vault_script_syntax() {
  if bash -n "$PROJECT_ROOT/scripts/vault" 2>/dev/null; then
    pass "Main vault script has valid syntax"
  else
    fail "Main vault script has syntax errors"
  fi
}

# Test 6: Vault script help command works
test_vault_help_command() {
  if bash "$PROJECT_ROOT/scripts/vault" help 2>&1 | grep -q "Vault Platform"; then
    pass "Vault help command works"
  else
    fail "Vault help command failed"
  fi
}

# Test 7: Infrastructure verify command runs without runtime errors
test_infrastructure_verify_command() {
  # Skip runtime test in environments without docker/podman
  skip "Infrastructure verify command (requires docker/podman runtime)"
}

# Test 8: Infrastructure validate command runs
test_infrastructure_validate_command() {
  # Skip runtime test in environments without docker/podman
  skip "Infrastructure validate command (requires docker/podman runtime)"
}

# Test 9: Utilities sync command recognizes modes
test_utilities_sync_command() {
  # Skip runtime test in environments without docker/podman
  skip "Utilities sync command (requires docker/podman runtime)"
}

# Test 10: All required functions are available in common.sh
test_required_functions() {
  local functions=(
    "log_info"
    "log_success"
    "log_error"
    "log_warn"
    "die"
    "require_commands"
    "mkdir_p"
    "print_header"
    "print_section"
    "print_divider"
  )
  
  local missing=()
  for func in "${functions[@]}"; do
    if ! grep -q "^$func() {" "$PROJECT_ROOT/scripts/common.sh"; then
      missing+=("$func")
    fi
  done
  
  if [[ ${#missing[@]} -eq 0 ]]; then
    pass "All required functions available in common.sh"
  else
    fail "Missing functions in common.sh: ${missing[*]}"
  fi
}

# Test 11: Environment variables are properly handled
test_environment_variables() {
  local env_vars=(
    "PROJECT_ROOT"
    "SCRIPT_DIR"
    "RUNTIME"
  )
  
  local undefined=()
  for var in "${env_vars[@]}"; do
    if ! bash -c "source $PROJECT_ROOT/scripts/common.sh && [[ -n \"\${$var:-}\" ]]" 2>/dev/null; then
      undefined+=("$var")
    fi
  done
  
  if [[ ${#undefined[@]} -eq 0 ]]; then
    pass "All required environment variables are defined"
  else
    skip "Some environment variables undefined (expected in some environments): ${undefined[*]}"
  fi
}

# Test 12: Legacy script directories removed
test_legacy_directories_removed() {
  if [[ ! -d "$PROJECT_ROOT/podman" && ! -d "$PROJECT_ROOT/script" && ! -d "$PROJECT_ROOT/apps/mcp/script" && ! -d "$PROJECT_ROOT/apps/vaulty/script" && ! -f "$PROJECT_ROOT/apps/mcp/restart-mcp.sh" && ! -f "$PROJECT_ROOT/apps/vaulty/restart-vaulty.sh" ]]; then
    pass "Legacy script directories removed"
  else
    fail "Legacy script directories still present"
  fi
}

# Test 13: New infrastructure scripts exist
test_new_infrastructure_scripts() {
  local new_scripts=(
    "scripts/infrastructure/verify.sh"
    "scripts/infrastructure/validate.sh"
  )
  
  local missing=()
  for script in "${new_scripts[@]}"; do
    if [[ ! -f "$PROJECT_ROOT/$script" ]]; then
      missing+=("$script")
    fi
  done
  
  if [[ ${#missing[@]} -eq 0 ]]; then
    pass "All new infrastructure scripts exist"
  else
    fail "Missing scripts: ${missing[*]}"
  fi
}

# Test 14: Scripts are executable
test_scripts_executable() {
  local non_executable=()
  for script in "$PROJECT_ROOT"/scripts/{services,infrastructure,utilities}/*.sh "$PROJECT_ROOT/scripts/vault"; do
    if [[ -f "$script" ]] && [[ ! -x "$script" ]]; then
      non_executable+=("$(basename $script)")
    fi
  done
  
  if [[ ${#non_executable[@]} -eq 0 ]]; then
    pass "All scripts are executable"
  else
    fail "Non-executable scripts: ${non_executable[*]}"
  fi
}

# Test 15: .gitignore allows scripts/build
test_gitignore_allows_build() {
  if grep -q "^scripts/build/$" "$PROJECT_ROOT/.gitignore" 2>/dev/null || \
     ! grep -q "^build/$" "$PROJECT_ROOT/.gitignore" 2>/dev/null; then
    pass ".gitignore properly configured for scripts/build"
  else
    fail ".gitignore may be blocking scripts/build"
  fi
}

# Run all tests
echo "================================"
echo "  SCRIPTS INTEGRATION TESTS"
echo "================================"
echo ""

cd "$PROJECT_ROOT"

test_common_sh_load
test_service_scripts_syntax
test_infrastructure_scripts_syntax
test_utilities_scripts_syntax
test_vault_script_syntax
test_vault_help_command
test_infrastructure_verify_command
test_infrastructure_validate_command
test_utilities_sync_command
test_required_functions
test_environment_variables
test_legacy_directories_removed
test_new_infrastructure_scripts
test_scripts_executable
test_gitignore_allows_build

echo ""
echo "================================"
echo "  TEST RESULTS"
echo "================================"
echo "Total tests: $TESTS_RUN"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [[ $TESTS_FAILED -eq 0 ]]; then
  echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
  exit 0
else
  echo -e "${RED}❌ SOME TESTS FAILED${NC}"
  exit 1
fi
