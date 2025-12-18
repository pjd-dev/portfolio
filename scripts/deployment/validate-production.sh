#!/usr/bin/env bash

################################################################################
# Production Deployment Validator
# Phase 4 Objective 5: Pre-deployment Checks
#
# Validates production environment before deployment
# Checks: resources, dependencies, security, configuration
################################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/scripts/common.sh"
source "$SCRIPT_DIR/config/production.env" || true

# ============================================================================
# Validation Results
# ============================================================================

VALIDATION_PASSED=0
VALIDATION_FAILED=0
VALIDATION_WARNINGS=0

##############################################################################
# Validation Functions
##############################################################################

validate_pass() {
    local check="$1"
    log_success "✅ $check"
    ((VALIDATION_PASSED++))
}

validate_fail() {
    local check="$1"
    local reason="${2:-Unknown reason}"
    log_error "❌ $check"
    echo "   Reason: $reason"
    ((VALIDATION_FAILED++))
}

validate_warn() {
    local check="$1"
    local reason="${2:-Warning}"
    log_warning "⚠️  $check"
    echo "   Note: $reason"
    ((VALIDATION_WARNINGS++))
}

##############################################################################
# Resource Validation
##############################################################################

validate_resources() {
    log_section "Resource Availability Check"
    
    # Check disk space
    AVAILABLE_DISK=$(df / | awk 'NR==2 {print $4}')
    REQUIRED_DISK=$((10 * 1024 * 1024))  # 10GB
    
    if [[ $AVAILABLE_DISK -gt $REQUIRED_DISK ]]; then
        validate_pass "Disk space available ($(numfmt --to=iec-i --suffix=B $AVAILABLE_DISK) available)"
    else
        validate_fail "Insufficient disk space" "Need 10GB, have $(numfmt --to=iec-i --suffix=B $AVAILABLE_DISK)"
    fi
    
    # Check memory
    AVAILABLE_MEMORY=$(free -b | awk 'NR==2 {print $7}')
    REQUIRED_MEMORY=$((8 * 1024 * 1024 * 1024))  # 8GB
    
    if [[ $AVAILABLE_MEMORY -gt $REQUIRED_MEMORY ]]; then
        validate_pass "Memory available ($(numfmt --to=iec-i --suffix=B $AVAILABLE_MEMORY) available)"
    else
        validate_warn "Limited memory available" "Recommended 8GB, have $(numfmt --to=iec-i --suffix=B $AVAILABLE_MEMORY)"
    fi
}

##############################################################################
# Dependency Validation
##############################################################################

validate_dependencies() {
    log_section "Required Dependencies Check"
    
    local REQUIRED_COMMANDS=("docker" "podman" "git" "jq" "curl" "openssl")
    
    for cmd in "${REQUIRED_COMMANDS[@]}"; do
        if command -v "$cmd" &> /dev/null; then
            VERSION=$("$cmd" --version 2>/dev/null | head -1 || echo "installed")
            validate_pass "$cmd available ($VERSION)"
        else
            validate_fail "$cmd not found" "Required for deployment"
        fi
    done
}

##############################################################################
# Registry Validation
##############################################################################

validate_registry() {
    log_section "Container Registry Access Check"
    
    # Check registry connectivity
    if curl -s -o /dev/null -w "%{http_code}" "https://${REGISTRY}" | grep -q "200\|301\|302"; then
        validate_pass "Registry connectivity (${REGISTRY})"
    else
        validate_fail "Cannot reach registry" "Check network/firewall settings"
    fi
    
    # Check image availability
    if podman pull "${MCP_IMAGE}" 2>/dev/null | grep -q "Downloaded\|Already\|exists"; then
        validate_pass "MCP image available"
    else
        validate_warn "MCP image not found or pulled" "Will attempt to build locally"
    fi
}

##############################################################################
# Network Validation
##############################################################################

validate_network() {
    log_section "Network Configuration Check"
    
    # Check ports availability
    local PORTS=("$VAULT_PORT" "$MCP_PORT" "$HEALTH_CHECK_PORT")
    
    for port in "${PORTS[@]}"; do
        if ! lsof -Pi :"$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
            validate_pass "Port $port available"
        else
            validate_fail "Port $port in use" "Check existing services"
        fi
    done
    
    # Check network policy
    if [[ "$NETWORK_POLICY_ENABLED" == "true" ]]; then
        validate_pass "Network policy enabled"
    else
        validate_warn "Network policy disabled" "Consider enabling for production"
    fi
}

##############################################################################
# Security Validation
##############################################################################

validate_security() {
    log_section "Security Configuration Check"
    
    # Check SSL certificates
    if [[ -f "/etc/ssl/certs/ca-certificates.crt" ]]; then
        validate_pass "SSL certificates available"
    else
        validate_warn "SSL certificates not found" "May need custom CA configuration"
    fi
    
    # Check secure boot
    if [[ -d "/sys/firmware/efi" ]]; then
        validate_pass "Secure boot available"
    else
        validate_warn "Secure boot not available" "Consider enabling"
    fi
    
    # Check user permissions
    if [[ "$(id -u)" == "0" ]]; then
        validate_warn "Running as root" "Consider using non-root user"
    else
        validate_pass "Running as non-root user"
    fi
}

##############################################################################
# Configuration Validation
##############################################################################

validate_configuration() {
    log_section "Configuration Validation"
    
    # Check environment file
    if [[ -f "$SCRIPT_DIR/config/production.env" ]]; then
        validate_pass "Production configuration file found"
    else
        validate_fail "Production config missing" "Create config/production.env"
    fi
    
    # Check deployment strategy
    if [[ "$DEPLOYMENT_STRATEGY" =~ ^(rolling|blue-green)$ ]]; then
        validate_pass "Deployment strategy valid ($DEPLOYMENT_STRATEGY)"
    else
        validate_fail "Invalid deployment strategy" "Use 'rolling' or 'blue-green'"
    fi
    
    # Check resource limits
    if [[ -n "$MCP_CPU_LIMIT" && -n "$MCP_MEMORY_LIMIT" ]]; then
        validate_pass "Resource limits configured"
    else
        validate_warn "Resource limits not set" "Should define limits for stability"
    fi
}

##############################################################################
# Storage Validation
##############################################################################

validate_storage() {
    log_section "Storage Configuration Check"
    
    # Check volume paths
    if [[ -d "$VAULT_DATA_PATH" ]] || mkdir -p "$VAULT_DATA_PATH"; then
        validate_pass "Vault data path accessible ($VAULT_DATA_PATH)"
    else
        validate_fail "Cannot create vault data path" "Check permissions"
    fi
    
    # Check backup path
    if [[ -d "$BACKUP_PATH" ]] || mkdir -p "$BACKUP_PATH"; then
        validate_pass "Backup path accessible ($BACKUP_PATH)"
    else
        validate_fail "Cannot create backup path" "Check permissions"
    fi
    
    # Check volume permissions
    if [[ -w "$VAULT_DATA_PATH" ]]; then
        validate_pass "Vault data path writable"
    else
        validate_fail "Vault data path not writable" "Fix directory permissions"
    fi
}

##############################################################################
# Backup Validation
##############################################################################

validate_backups() {
    log_section "Backup Configuration Check"
    
    # Check backup schedule
    if [[ -n "$BACKUP_SCHEDULE" ]]; then
        validate_pass "Backup schedule configured ($BACKUP_SCHEDULE)"
    else
        validate_warn "Backup schedule not set" "Should enable automated backups"
    fi
    
    # Check backup retention
    if [[ -n "$BACKUP_RETENTION_DAYS" ]]; then
        validate_pass "Backup retention policy set ($BACKUP_RETENTION_DAYS days)"
    else
        validate_warn "Backup retention not configured" "Recommend 30 days minimum"
    fi
}

##############################################################################
# Monitoring Validation
##############################################################################

validate_monitoring() {
    log_section "Monitoring Configuration Check"
    
    if [[ "$METRICS_ENABLED" == "true" ]]; then
        validate_pass "Metrics collection enabled"
    else
        validate_warn "Metrics disabled" "Consider enabling for monitoring"
    fi
    
    # Check alert thresholds
    if [[ -n "$CPU_ALERT_THRESHOLD" ]] && [[ -n "$MEMORY_ALERT_THRESHOLD" ]]; then
        validate_pass "Alert thresholds configured"
    else
        validate_warn "Alert thresholds not set" "Set CPU/memory alert limits"
    fi
}

##############################################################################
# Main Validation Flow
##############################################################################

run_all_validations() {
    log_section "Production Deployment Validation"
    log_info "Environment: $ENVIRONMENT"
    log_info "Timestamp: $(date)"
    
    echo ""
    
    # Run all validation checks
    validate_resources
    echo ""
    
    validate_dependencies
    echo ""
    
    validate_registry
    echo ""
    
    validate_network
    echo ""
    
    validate_security
    echo ""
    
    validate_configuration
    echo ""
    
    validate_storage
    echo ""
    
    validate_backups
    echo ""
    
    validate_monitoring
    
    # Summary
    log_section "Validation Summary"
    
    local TOTAL=$((VALIDATION_PASSED + VALIDATION_FAILED + VALIDATION_WARNINGS))
    
    echo "Passed:  $VALIDATION_PASSED/$TOTAL"
    echo "Failed:  $VALIDATION_FAILED/$TOTAL"
    echo "Warnings: $VALIDATION_WARNINGS/$TOTAL"
    echo ""
    
    if [[ $VALIDATION_FAILED -eq 0 ]]; then
        log_success "✅ All validations passed - Ready for deployment"
        return 0
    else
        log_error "❌ Some validations failed - Address issues before deploying"
        return 1
    fi
}

##############################################################################
# Script Entry Point
##############################################################################

run_all_validations
exit_code=$?

echo ""
log_info "Validation completed at $(date)"

exit $exit_code
