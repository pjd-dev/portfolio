#!/usr/bin/env bash

################################################################################
# Parallel Health Check Utility
# Performance Optimization: Implements parallel health checking
#
# Usage: source scripts/utils/health-check.sh
#        parallel_health_check "$mcp_endpoint" "$vaulty_endpoint"
################################################################################

set -euo pipefail

##############################################################################
# Parallel Health Check Function
##############################################################################

parallel_health_check() {
    local mcp_endpoint="${1:-}"
    local vaulty_endpoint="${2:-}"
    local timeout="${3:-10}"
    
    if [[ -z "$mcp_endpoint" ]] || [[ -z "$vaulty_endpoint" ]]; then
        echo "Usage: parallel_health_check <mcp_endpoint> <vaulty_endpoint> [timeout]" >&2
        return 1
    fi
    
    # Start health checks in background
    (curl -sf --max-time "$timeout" "$mcp_endpoint" >/dev/null 2>&1) &
    local mcp_pid=$!
    
    (curl -sf --max-time "$timeout" "$vaulty_endpoint" >/dev/null 2>&1) &
    local vaulty_pid=$!
    
    # Wait for both to complete
    wait "$mcp_pid" 2>/dev/null && local mcp_ok=1 || local mcp_ok=0
    wait "$vaulty_pid" 2>/dev/null && local vaulty_ok=1 || local vaulty_ok=0
    
    # Both must be healthy
    if [[ $mcp_ok -eq 1 && $vaulty_ok -eq 1 ]]; then
        return 0  # Both healthy
    else
        return 1  # One or both unhealthy
    fi
}

##############################################################################
# Individual Health Check Functions
##############################################################################

check_mcp_health() {
    local endpoint="${1:-http://localhost:4000/health}"
    local timeout="${2:-10}"
    
    curl -sf --max-time "$timeout" "$endpoint" >/dev/null 2>&1
}

check_vaulty_health() {
    local endpoint="${1:-http://localhost:3333/health}"
    local timeout="${2:-10}"
    
    curl -sf --max-time "$timeout" "$endpoint" >/dev/null 2>&1
}

# Export functions for use in subscripts
export -f parallel_health_check
export -f check_mcp_health
export -f check_vaulty_health
