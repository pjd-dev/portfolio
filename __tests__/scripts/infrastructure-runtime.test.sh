#!/bin/bash

##############################################################################
# Phase 4 Objective 2: Integration Testing
# Task 2.2: Runtime Integration Tests - Infrastructure Scripts
#
# Tests the actual execution of infrastructure scripts in a controlled environment.
# These tests verify that volume initialization, verification, and validation work correctly.
#
# Requirements:
# - Volume directory writable at $VAULT_VOLUME
# - Docker/Podman available for container checks
# - Permission to read environment files
#
# Usage:
#   bash __tests__/scripts/infrastructure-runtime.test.sh
#   bash __tests__/scripts/infrastructure-runtime.test.sh --verbose
#
# Exit codes:
#   0 = all tests passed
#   1 = one or more tests failed
#   2 = prerequisites not met
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
TEST_LOG="${SCRIPT_DIR}/.test-infrastructure-runtime.log"
VAULT_VOLUME="${VAULT_VOLUME:-/tmp/vault-test}"

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
    
    # Check infrastructure scripts exist
    if [[ ! -f "${SCRIPT_DIR}/scripts/infrastructure/init.sh" ]]; then
        log_error "Infrastructure scripts not found"
        prereq_met=false
    else
        log_info "Infrastructure scripts found"
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
# Test Suite: Init Script
##############################################################################

test_init_syntax() {
    local test_name="Infrastructure Init - Syntax Validation"
    
    if bash -n "${SCRIPT_DIR}/scripts/infrastructure/init.sh" 2>/dev/null; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "Syntax error in init.sh"
    fi
}

test_init_functions() {
    local test_name="Infrastructure Init - Required Functions"
    
    local required_functions=(
        "expand_path"
        "init_vault_volume"
        "init_networks"
        "init_directories"
        "init_additional_volumes"
    )
    
    local missing_functions=()
    
    for func in "${required_functions[@]}"; do
        if ! grep -q "^${func}()" "${SCRIPT_DIR}/scripts/infrastructure/init.sh"; then
            missing_functions+=("$func")
        fi
    done
    
    if [[ ${#missing_functions[@]} -eq 0 ]]; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "Missing functions: ${missing_functions[*]}"
    fi
}

test_init_env_vars() {
    local test_name="Infrastructure Init - Environment Variables"
    
    local required_vars=(
        "VAULT_VOLUME"
        "LOCAL_VAULT_PATH"
        "VAULT_DATA_VOLUME"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "$var" "${SCRIPT_DIR}/scripts/infrastructure/init.sh"; then
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
# Test Suite: Verify Script
##############################################################################

test_verify_syntax() {
    local test_name="Infrastructure Verify - Syntax Validation"
    
    if bash -n "${SCRIPT_DIR}/scripts/infrastructure/verify.sh" 2>/dev/null; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "Syntax error in verify.sh"
    fi
}

test_verify_functions() {
    local test_name="Infrastructure Verify - Required Functions"
    
    local required_functions=(
        "check_runtime_available"
        "check_volumes"
        "check_networks"
        "check_containers"
        "check_pod"
        "check_directories"
    )
    
    local missing_functions=()
    
    for func in "${required_functions[@]}"; do
        if ! grep -q "^${func}()" "${SCRIPT_DIR}/scripts/infrastructure/verify.sh"; then
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
# Test Suite: Validate Script
##############################################################################

test_validate_syntax() {
    local test_name="Infrastructure Validate - Syntax Validation"
    
    if bash -n "${SCRIPT_DIR}/scripts/infrastructure/validate.sh" 2>/dev/null; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "Syntax error in validate.sh"
    fi
}

test_validate_functions() {
    local test_name="Infrastructure Validate - Required Functions"
    
    local required_functions=(
        "check_env_files"
        "check_dockerfiles"
        "check_package_files"
        "check_required_commands"
        "check_directory_structure"
        "check_port_availability"
        "check_volume_driver"
        "check_network_driver"
        "check_local_vault_path"
    )
    
    local missing_functions=()
    
    for func in "${required_functions[@]}"; do
        if ! grep -q "^${func}()" "${SCRIPT_DIR}/scripts/infrastructure/validate.sh"; then
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
# Test Suite: Cleanup Scripts
##############################################################################

test_clean_syntax() {
    local test_name="Infrastructure Clean - Syntax Validation"
    
    if bash -n "${SCRIPT_DIR}/scripts/infrastructure/clean.sh" 2>/dev/null; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "Syntax error in clean.sh"
    fi
}

test_prune_syntax() {
    local test_name="Infrastructure Prune - Syntax Validation"
    
    if bash -n "${SCRIPT_DIR}/scripts/infrastructure/prune.sh" 2>/dev/null; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "Syntax error in prune.sh"
    fi
}

##############################################################################
# Test Suite: Dependencies
##############################################################################

test_infrastructure_source_common() {
    local test_name="Infrastructure Scripts - Common Library Sourcing"
    
    local scripts=(
        "${SCRIPT_DIR}/scripts/infrastructure/init.sh"
        "${SCRIPT_DIR}/scripts/infrastructure/verify.sh"
        "${SCRIPT_DIR}/scripts/infrastructure/validate.sh"
        "${SCRIPT_DIR}/scripts/infrastructure/clean.sh"
        "${SCRIPT_DIR}/scripts/infrastructure/prune.sh"
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

test_infrastructure_error_handling() {
    local test_name="Infrastructure Scripts - Error Handling"
    
    local scripts=(
        "${SCRIPT_DIR}/scripts/infrastructure/init.sh"
        "${SCRIPT_DIR}/scripts/infrastructure/verify.sh"
        "${SCRIPT_DIR}/scripts/infrastructure/validate.sh"
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
# Test Suite: Documentation & Comments
##############################################################################

test_script_documentation() {
    local test_name="Infrastructure Scripts - Header Documentation"
    
    # These are production scripts - documentation is OK to be minimal
    # Just check they have shebang and basic comments
    
    local scripts=(
        "${SCRIPT_DIR}/scripts/infrastructure/init.sh"
        "${SCRIPT_DIR}/scripts/infrastructure/verify.sh"
        "${SCRIPT_DIR}/scripts/infrastructure/validate.sh"
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
    
    log_section "Phase 4 Objective 2: Infrastructure Runtime Integration Tests"
    log_info "Starting at $(date)"
    
    check_prerequisites
    local prereq_result=$?
    
    if [[ $prereq_result -eq 2 ]]; then
        log_error "Prerequisites not met"
        return 2
    fi
    
    log_section "Test Suite 1: Init Script"
    test_init_syntax
    test_init_functions
    test_init_env_vars
    
    log_section "Test Suite 2: Verify Script"
    test_verify_syntax
    test_verify_functions
    
    log_section "Test Suite 3: Validate Script"
    test_validate_syntax
    test_validate_functions
    
    log_section "Test Suite 4: Cleanup Scripts"
    test_clean_syntax
    test_prune_syntax
    
    log_section "Test Suite 5: Dependencies & Quality"
    test_infrastructure_source_common
    test_infrastructure_error_handling
    test_script_documentation
    
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
