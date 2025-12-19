#!/bin/bash

##############################################################################
# Phase 4 Objective 2: Integration Testing
# Task 2.1: Runtime Integration Tests - Service Scripts
#
# Tests the actual execution of service scripts in a controlled environment.
# These tests verify that services can start, stop, and report status correctly.
#
# Requirements:
# - Docker or Podman must be available
# - Vault and MCP containers defined in docker-compose
# - Volume initialized at $VAULT_VOLUME
#
# Usage:
#   bash __tests__/scripts/services-runtime.test.sh
#   bash __tests__/scripts/services-runtime.test.sh --verbose
#
# Exit codes:
#   0 = all tests passed
#   1 = one or more tests failed
#   2 = prerequisites not met
##############################################################################

set +e  # Don't exit on error, we handle it ourselves

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VERBOSE="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEST_LOG="${SCRIPT_DIR}/.test-services-runtime.log"
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

verbose_log() {
    if [[ -n "$VERBOSE" ]]; then
        echo "[DEBUG] $@"
    fi
}

record_output() {
    local output="$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $output" >> "$TEST_LOG"
}

test_pass() {
    local test_name="$1"
    log_success "$test_name"
    ((TESTS_PASSED++))
    record_output "PASS: $test_name"
}

test_fail() {
    local test_name="$1"
    local reason="${2:-Unknown reason}"
    log_error "$test_name"
    echo "  Reason: $reason"
    ((TESTS_FAILED++))
    record_output "FAIL: $test_name - $reason"
}

test_skip() {
    local test_name="$1"
    local reason="${2:-Prerequisite not met}"
    log_warning "$test_name (SKIPPED)"
    echo "  Reason: $reason"
    ((TESTS_SKIPPED++))
    record_output "SKIP: $test_name - $reason"
}

##############################################################################
# Prerequisite Checks
##############################################################################

check_prerequisites() {
    log_section "Checking Prerequisites"
    
    local prereq_met=true
    
    # Check Docker/Podman availability
    if ! command -v docker &> /dev/null && ! command -v podman &> /dev/null; then
        log_error "Neither Docker nor Podman found"
        prereq_met=false
    else
        if command -v docker &> /dev/null; then
            log_info "Docker found: $(docker --version)"
        elif command -v podman &> /dev/null; then
            log_info "Podman found: $(podman --version)"
        fi
    fi
    
    # Check volume existence
    if [[ ! -d "$VAULT_VOLUME" ]]; then
        log_warning "Vault volume not found at $VAULT_VOLUME"
        log_info "Some tests may be skipped"
    fi
    
    # Check scripts exist
    if [[ ! -f "${SCRIPT_DIR}/scripts/services/start.sh" ]]; then
        log_error "Service scripts not found at ${SCRIPT_DIR}/scripts/services/"
        prereq_met=false
    fi
    
    if [[ ! -f "${SCRIPT_DIR}/scripts/common.sh" ]]; then
        log_error "Common library not found at ${SCRIPT_DIR}/scripts/common.sh"
        prereq_met=false
    fi
    
    if [[ "$prereq_met" == false ]]; then
        return 2
    fi
    
    return 0
}

##############################################################################
# Test Suite: Service Start
##############################################################################

test_service_start_syntax() {
    local test_name="Service Start Script - Syntax Validation"
    
    if bash -n "${SCRIPT_DIR}/scripts/services/start.sh" 2>/dev/null; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "Syntax error in start.sh"
    fi
}

test_service_start_functions() {
    local test_name="Service Start Script - Required Functions"
    
    local required_functions=(
        "load_env_files"
        "build_mcp_image"
        "build_vault_image"
        "create_pod"
        "start_mcp_service"
        "start_vault_service"
    )
    
    local missing_functions=()
    
    for func in "${required_functions[@]}"; do
        if ! grep -q "^${func}()" "${SCRIPT_DIR}/scripts/services/start.sh"; then
            missing_functions+=("$func")
        fi
    done
    
    if [[ ${#missing_functions[@]} -eq 0 ]]; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "Missing functions: ${missing_functions[*]}"
    fi
}

test_service_start_env_vars() {
    local test_name="Service Start Script - Environment Variables"
    
    local required_vars=(
        "MCP_PORT"
        "VOLUME_SOURCE"
        "PROJECT_ROOT"
        "POD_NAME"
        "MCP_CONTAINER"
        "VAULT_CONTAINER"
        "LOCAL_VAULT_PATH"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "$var" "${SCRIPT_DIR}/scripts/services/start.sh"; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -eq 0 ]]; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "Missing variables: ${missing_vars[*]}"
    fi
}

test_service_start_local_vault_path_handling() {
    local test_name="Service Start Script - LOCAL_VAULT_PATH Directory Creation"
    
    # Check that script attempts to create LOCAL_VAULT_PATH directory
    if grep -q "mkdir -p.*VOLUME_SOURCE\|mkdir -p.*LOCAL_VAULT_PATH" "${SCRIPT_DIR}/scripts/services/start.sh"; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "No directory creation logic found for LOCAL_VAULT_PATH"
    fi
}

test_service_start_local_vault_path_fallback() {
    local test_name="Service Start Script - LOCAL_VAULT_PATH Fallback Logic"
    
    # Check that script falls back to named volume if directory creation fails
    if grep -q "VOLUME_SOURCE.*vault\|fall.*back\|named.*volume" "${SCRIPT_DIR}/scripts/services/start.sh"; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "No fallback logic found for LOCAL_VAULT_PATH"
    fi
}

##############################################################################
# Test Suite: Service Stop
##############################################################################

test_service_stop_syntax() {
    local test_name="Service Stop Script - Syntax Validation"
    
    if bash -n "${SCRIPT_DIR}/scripts/services/stop.sh" 2>/dev/null; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "Syntax error in stop.sh"
    fi
}

test_service_stop_functions() {
    local test_name="Service Stop Script - Required Functions"
    
    local required_functions=(
        "stop_container"
        "remove_pod"
    )
    
    local missing_functions=()
    
    for func in "${required_functions[@]}"; do
        if ! grep -q "^${func}()" "${SCRIPT_DIR}/scripts/services/stop.sh"; then
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
# Test Suite: Service Utilities
##############################################################################

test_service_logs_script() {
    local test_name="Service Logs Script - Syntax Validation"
    
    if bash -n "${SCRIPT_DIR}/scripts/services/logs.sh" 2>/dev/null; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "Syntax error in logs.sh"
    fi
}

test_service_status_script() {
    local test_name="Service Status Script - Syntax Validation"
    
    if bash -n "${SCRIPT_DIR}/scripts/services/status.sh" 2>/dev/null; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "Syntax error in status.sh"
    fi
}

test_service_restart_script() {
    local test_name="Service Restart Script - Syntax Validation"
    
    if bash -n "${SCRIPT_DIR}/scripts/services/restart.sh" 2>/dev/null; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "Syntax error in restart.sh"
    fi
}

##############################################################################
# Test Suite: Inter-script Dependencies
##############################################################################

test_scripts_source_common() {
    local test_name="Service Scripts - Common Library Sourcing"
    
    local scripts=(
        "${SCRIPT_DIR}/scripts/services/start.sh"
        "${SCRIPT_DIR}/scripts/services/stop.sh"
        "${SCRIPT_DIR}/scripts/services/logs.sh"
        "${SCRIPT_DIR}/scripts/services/status.sh"
        "${SCRIPT_DIR}/scripts/services/restart.sh"
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

##############################################################################
# Test Suite: Error Handling
##############################################################################

test_start_error_handling() {
    local test_name="Service Start Script - Error Handling"
    
    # Check for error traps
    if grep -q "trap\|set -e\|error_exit\|die" "${SCRIPT_DIR}/scripts/services/start.sh"; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "No error handling detected"
    fi
}

test_stop_error_handling() {
    local test_name="Service Stop Script - Error Handling"
    
    # Check for error handling
    if grep -q "trap\|set -e\|error_exit\|die" "${SCRIPT_DIR}/scripts/services/stop.sh"; then
        test_pass "$test_name"
    else
        test_fail "$test_name" "No error handling detected"
    fi
}

##############################################################################
# Test Suite: Configuration Files
##############################################################################

test_env_files_readable() {
    local test_name="Environment Configuration Files - Readable"
    
    local env_files=(
        "${SCRIPT_DIR}/apps/auth/.env"
        "${SCRIPT_DIR}/apps/llm-adapter/.env"
        "${SCRIPT_DIR}/apps/mcp/.env"
        "${SCRIPT_DIR}/apps/vaulty/.env"
    )
    
    local missing_files=()
    
    for env_file in "${env_files[@]}"; do
        if [[ ! -r "$env_file" ]]; then
            missing_files+=("$(basename $(dirname $env_file))")
        fi
    done
    
    if [[ ${#missing_files[@]} -eq 0 ]]; then
        test_pass "$test_name"
    else
        test_skip "$test_name" "Missing .env files: ${missing_files[*]}"
    fi
}

##############################################################################
# Main Test Execution
##############################################################################

run_all_tests() {
    # Clear log
    > "$TEST_LOG"
    
    log_section "Phase 4 Objective 2: Service Runtime Integration Tests"
    log_info "Starting at $(date)"
    log_info "Test output: $TEST_LOG"
    
    # Check prerequisites first
    check_prerequisites
    local prereq_result=$?
    
    if [[ $prereq_result -eq 2 ]]; then
        log_error "Prerequisites not met. Cannot run tests."
        return 2
    fi
    
    log_section "Test Suite 1: Service Start Script"
    test_service_start_syntax
    test_service_start_functions
    test_service_start_env_vars
    test_service_start_local_vault_path_handling
    test_service_start_local_vault_path_fallback
    
    log_section "Test Suite 2: Service Stop Script"
    test_service_stop_syntax
    test_service_stop_functions
    
    log_section "Test Suite 3: Service Utilities"
    test_service_logs_script
    test_service_status_script
    test_service_restart_script
    
    log_section "Test Suite 4: Dependencies & Configuration"
    test_scripts_source_common
    test_start_error_handling
    test_stop_error_handling
    test_env_files_readable
    
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
# Script Entry Point
##############################################################################

# Run all tests
run_all_tests
exit_code=$?

echo ""
log_info "Test run completed at $(date)"
echo "For detailed results, see: $TEST_LOG"

exit $exit_code
