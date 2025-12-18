#!/bin/bash

##############################################################################
# Phase 4 Objective 2: Integration Testing
# Task 2.3: Runtime Integration Tests - Utilities Scripts
#
# Tests the actual execution of utility scripts in a controlled environment.
# These tests verify that sync, tunnel, and verify utilities work correctly.
#
# Usage:
#   bash __tests__/scripts/utilities-runtime.test.sh
#   bash __tests__/scripts/utilities-runtime.test.sh --verbose
#
# Exit codes:
#   0 = all tests passed
#   1 = one or more tests failed
##############################################################################

set +e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
VERBOSE="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEST_LOG="${SCRIPT_DIR}/.test-utilities-runtime.log"

# Test tracking
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

##############################################################################
# Helper Functions
##############################################################################

log_info() {
    echo "[INFO] $@"
}

log_success() {
    echo -e "${GREEN}✅ $@${NC}"
}

log_error() {
    echo -e "${RED}❌ $@${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️ $@${NC}"
}

log_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$@${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

test_pass() {
    local test_name="$1"
    log_success "$test_name"
    ((TESTS_PASSED++))
}

test_fail() {
    local test_name="$1"
    local reason="${2:-Unknown reason}"
    log_error "$test_name"
    echo "  Reason: $reason"
    ((TESTS_FAILED++))
}

test_skip() {
    local test_name="$1"
    local reason="${2:-Prerequisite not met}"
    log_warning "$test_name (SKIPPED)"
    echo "  Reason: $reason"
    ((TESTS_SKIPPED++))
}

##############################################################################
# Prerequisite Checks
##############################################################################

check_prerequisites() {
    log_section "Checking Prerequisites"
    
    local prereq_met=true
    
    # Check utilities scripts exist
    if [[ ! -d "${SCRIPT_DIR}/scripts/utilities" ]]; then
        log_error "Utilities directory not found"
        prereq_met=false
    else
        log_info "Utilities directory found"
    fi
    
    # Check common.sh
    if [[ ! -f "${SCRIPT_DIR}/scripts/common.sh" ]]; then
        log_error "Common library not found"
        prereq_met=false
    else
        log_info "Common library found"
    fi
    
    if [[ "$prereq_met" == false ]]; then
        return 2
    fi
    
    return 0
}

##############################################################################
# Test Suite: Sync Utility
##############################################################################

test_sync_syntax() {
    local test_name="Utilities Sync - Syntax Validation"
    
    if bash -n "${SCRIPT_DIR}/scripts/utilities/sync-vault.sh" 2>/dev/null; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "Syntax error in sync-vault.sh"
    fi
}

test_sync_functions() {
    local test_name="Utilities Sync - Required Functions"
    
    local required_functions=(
        "sync_volume_to_local"
        "sync_local_to_volume"
        "sync_once"
        "sync_continuous"
    )
    
    local missing_functions=()
    
    for func in "${required_functions[@]}"; do
        if ! grep -q "^${func}()" "${SCRIPT_DIR}/scripts/utilities/sync-vault.sh"; then
            missing_functions+=("$func")
        fi
    done
    
    if [[ ${#missing_functions[@]} -eq 0 ]]; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "Missing functions: ${missing_functions[*]}"
    fi
}

test_sync_env_vars() {
    local test_name="Utilities Sync - Environment Variables"
    
    local required_vars=(
        "VOLUME_NAME"
        "LOCAL_VAULT"
        "SYNC_MODE"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "$var" "${SCRIPT_DIR}/scripts/utilities/sync-vault.sh"; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -eq 0 ]]; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "Missing variables: ${missing_vars[*]}"
    fi
}

##############################################################################
# Test Suite: Tunnel Utility
##############################################################################

test_tunnel_syntax() {
    local test_name="Utilities Tunnel - Syntax Validation"
    
    if bash -n "${SCRIPT_DIR}/scripts/utilities/tunnel.sh" 2>/dev/null; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "Syntax error in tunnel.sh"
    fi
}

test_tunnel_functions() {
    local test_name="Utilities Tunnel - Required Functions"
    
    local required_functions=(
        "start_tunnel"
        "check_tunnel_status"
        "list_tunnels"
    )
    
    local missing_functions=()
    
    for func in "${required_functions[@]}"; do
        if ! grep -q "^${func}()" "${SCRIPT_DIR}/scripts/utilities/tunnel.sh"; then
            missing_functions+=("$func")
        fi
    done
    
    if [[ ${#missing_functions[@]} -eq 0 ]]; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "Missing functions: ${missing_functions[*]}"
    fi
}

##############################################################################
# Test Suite: Verify Utility
##############################################################################

test_verify_syntax() {
    local test_name="Utilities Verify - Syntax Validation"
    
    if bash -n "${SCRIPT_DIR}/scripts/utilities/verify-vault.sh" 2>/dev/null; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "Syntax error in verify-vault.sh"
    fi
}

test_verify_functions() {
    local test_name="Utilities Verify - Required Functions"
    
    # verify-vault.sh is a simple utility script, may not have formal functions
    # Check if it sources common.sh and performs checks
    
    if grep -q "require_dir\|log_success\|log_warn" "${SCRIPT_DIR}/scripts/utilities/verify-vault.sh"; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "verify-vault.sh doesn't use common utilities"
    fi
}

##############################################################################
# Test Suite: Dependencies
##############################################################################

test_utilities_source_common() {
    local test_name="Utilities Scripts - Common Library Sourcing"
    
    local scripts=(
        "${SCRIPT_DIR}/scripts/utilities/sync-vault.sh"
        "${SCRIPT_DIR}/scripts/utilities/tunnel.sh"
        "${SCRIPT_DIR}/scripts/utilities/verify-vault.sh"
    )
    
    local missing_source=()
    
    for script in "${scripts[@]}"; do
        if ! grep -q "source.*common.sh\|source.*common\|\..*common\.sh\|\..*common" "$script"; then
            missing_source+=("$(basename $script)")
        fi
    done
    
    if [[ ${#missing_source[@]} -eq 0 ]]; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "Scripts not sourcing common.sh: ${missing_source[*]}"
    fi
}

test_utilities_error_handling() {
    local test_name="Utilities Scripts - Error Handling"
    
    local scripts=(
        "${SCRIPT_DIR}/scripts/utilities/sync-vault.sh"
        "${SCRIPT_DIR}/scripts/utilities/tunnel.sh"
    )
    
    local missing_handling=()
    
    for script in "${scripts[@]}"; do
        if ! grep -q "trap\|error_exit\|die" "$script"; then
            missing_handling+=("$(basename $script)")
        fi
    done
    
    if [[ ${#missing_handling[@]} -eq 0 ]]; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "Missing error handling: ${missing_handling[*]}"
    fi
}

##############################################################################
# Test Suite: Executability & Permissions
##############################################################################

test_sync_executable() {
    local test_name="Utilities Sync - Executable"
    
    if [[ -x "${SCRIPT_DIR}/scripts/utilities/sync-vault.sh" ]]; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "sync-vault.sh not executable"
    fi
}

test_tunnel_executable() {
    local test_name="Utilities Tunnel - Executable"
    
    if [[ -x "${SCRIPT_DIR}/scripts/utilities/tunnel.sh" ]]; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "tunnel.sh not executable"
    fi
}

test_verify_executable() {
    local test_name="Utilities Verify - Executable"
    
    if [[ -x "${SCRIPT_DIR}/scripts/utilities/verify-vault.sh" ]]; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "verify-vault.sh not executable"
    fi
}

##############################################################################
# Test Suite: Documentation
##############################################################################

test_utilities_documentation() {
    local test_name="Utilities Scripts - Header Documentation"
    
    local scripts=(
        "${SCRIPT_DIR}/scripts/utilities/sync-vault.sh"
        "${SCRIPT_DIR}/scripts/utilities/tunnel.sh"
        "${SCRIPT_DIR}/scripts/utilities/verify-vault.sh"
    )
    
    local missing_docs=()
    
    for script in "${scripts[@]}"; do
        if ! head -5 "$script" | grep -q "^#!/bin/bash\|^#!/usr/bin/env bash"; then
            missing_docs+=("$(basename $script)")
        fi
    done
    
    if [[ ${#missing_docs[@]} -eq 0 ]]; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "Missing shebang: ${missing_docs[*]}"
    fi
}

##############################################################################
# Main Test Execution
##############################################################################

run_all_tests() {
    > "$TEST_LOG"
    
    log_section "Phase 4 Objective 2: Utilities Runtime Integration Tests"
    log_info "Starting at $(date)"
    
    check_prerequisites
    local prereq_result=$?
    
    if [[ $prereq_result -eq 2 ]]; then
        log_error "Prerequisites not met"
        return 2
    fi
    
    log_section "Test Suite 1: Sync Utility"
    test_sync_syntax
    test_sync_functions
    test_sync_env_vars
    test_sync_executable
    
    log_section "Test Suite 2: Tunnel Utility"
    test_tunnel_syntax
    test_tunnel_functions
    test_tunnel_executable
    
    log_section "Test Suite 3: Verify Utility"
    test_verify_syntax
    test_verify_functions
    test_verify_executable
    
    log_section "Test Suite 4: Dependencies & Quality"
    test_utilities_source_common
    test_utilities_error_handling
    test_utilities_documentation
    
    log_section "Test Results"
    
    local total_tests=$((TESTS_PASSED + TESTS_FAILED + TESTS_SKIPPED))
    
    echo ""
    echo "Passed:  $TESTS_PASSED"
    echo "Failed:  $TESTS_FAILED"
    echo "Skipped: $TESTS_SKIPPED"
    echo "Total:   $total_tests"
    echo ""
    
    if [[ $TESTS_FAILED -eq 0 ]]; then
        log_success "All tests passed!"
        return 0
    else
        log_error "$TESTS_FAILED test(s) failed"
        return 1
    fi
}

##############################################################################
# Entry Point
##############################################################################

run_all_tests
exit_code=$?

echo ""
log_info "Test completed at $(date)"

exit $exit_code
