#!/usr/bin/env bash

################################################################################
# Production Rollback Manager
# Phase 4 Objective 5: Emergency Rollback
#
# Manages rollback to previous deployment version
# Supports multiple rollback depths and verification
################################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/common.sh"
source "$SCRIPT_DIR/../config/production.env" || true

# ============================================================================
# Rollback State
# ============================================================================

ROLLBACK_ID="rollback-$(date +%Y%m%d-%H%M%S)"
ROLLBACK_LOG="${SCRIPT_DIR}/../logs/rollback-${ROLLBACK_ID}.log"
DEPLOYMENT_HISTORY="${SCRIPT_DIR}/../logs/deployment-history.json"

# Ensure logs directory exists
mkdir -p "$(dirname "$ROLLBACK_LOG")"

##############################################################################
# Rollback Functions
##############################################################################

get_previous_image() {
    local service="$1"
    local depth="${2:-1}"
    
    if [[ -f "$DEPLOYMENT_HISTORY" ]]; then
        # Extract previous image from deployment history
        local previous_image=$(jq -r --arg svc "$service" --arg d "$depth" \
            '.deployments | reverse | .[($d | tonumber)] | select(.service == $svc) | .image' \
            "$DEPLOYMENT_HISTORY" 2>/dev/null)
        
        if [[ -n "$previous_image" ]]; then
            echo "$previous_image"
            return 0
        fi
    fi
    
    # Fallback to default previous version
    case "$service" in
        "mcp")
            echo "${MCP_PREVIOUS_IMAGE:-$MCP_IMAGE}"
            ;;
        "vaulty")
            echo "${VAULTY_PREVIOUS_IMAGE:-$VAULTY_IMAGE}"
            ;;
        *)
            log_error "Unknown service: $service"
            return 1
            ;;
    esac
}

get_current_image() {
    local service="$1"
    
    case "$service" in
        "mcp")
            podman ps -a --filter "name=$MCP_CONTAINER_NAME" --format "{{.Image}}" || echo ""
            ;;
        "vaulty")
            podman ps -a --filter "name=$VAULTY_CONTAINER_NAME" --format "{{.Image}}" || echo ""
            ;;
        *)
            log_error "Unknown service: $service"
            return 1
            ;;
    esac
}

rollback_service() {
    local service="$1"
    local depth="${2:-1}"
    local container_name
    local previous_image
    local rollback_successful=false
    
    log_info "Rolling back $service (depth: $depth)..."
    
    case "$service" in
        "mcp")
            container_name="$MCP_CONTAINER_NAME"
            ;;
        "vaulty")
            container_name="$VAULTY_CONTAINER_NAME"
            ;;
        *)
            log_error "Unknown service: $service"
            return 1
            ;;
    esac
    
    # Get previous image
    previous_image=$(get_previous_image "$service" "$depth") || {
        log_error "Failed to get previous image for $service"
        return 1
    }
    
    log_info "Previous image: $previous_image"
    
    # Stop current container
    log_info "Stopping $service container..."
    if podman ps | grep -q "^${container_name}"; then
        podman stop "$container_name" || log_warning "Failed to stop $service gracefully"
    fi
    
    # Remove container
    log_info "Removing $service container..."
    podman rm "$container_name" --force 2>/dev/null || true
    
    # Pull previous image
    log_info "Pulling previous $service image..."
    if ! podman pull "$previous_image"; then
        log_error "Failed to pull previous image: $previous_image"
        return 1
    fi
    
    # Start previous container
    log_info "Starting $service container with previous image..."
    case "$service" in
        "mcp")
            if podman run -d \
                --name "$container_name" \
                --pod "${POD_NAME}" \
                --cpus "$MCP_CPU_LIMIT" \
                --memory "$MCP_MEMORY_LIMIT" \
                -e "NODE_ENV=production" \
                -e "PORT=$MCP_PORT" \
                --health-cmd="curl -f http://localhost:$MCP_PORT/health" \
                --health-interval=30s \
                --health-timeout=10s \
                --health-retries=3 \
                "$previous_image"; then
                rollback_successful=true
            fi
            ;;
        "vaulty")
            if podman run -d \
                --name "$container_name" \
                --pod "${POD_NAME}" \
                --cpus "$VAULTY_CPU_LIMIT" \
                --memory "$VAULTY_MEMORY_LIMIT" \
                -e "NODE_ENV=production" \
                -e "PORT=$VAULT_PORT" \
                -v "$VAULT_DATA_PATH:/app/data" \
                --health-cmd="curl -f http://localhost:$VAULT_PORT/health" \
                --health-interval=30s \
                --health-timeout=10s \
                --health-retries=3 \
                "$previous_image"; then
                rollback_successful=true
            fi
            ;;
    esac
    
    if [[ "$rollback_successful" != "true" ]]; then
        log_error "Failed to start $service container"
        return 1
    fi
    
    log_success "✅ $service container started"
    
    # Wait for container to be ready
    sleep 3
    
    # Verify container health
    local max_retries=30
    local retry_count=0
    
    while [[ $retry_count -lt $max_retries ]]; do
        if podman ps | grep -q "$container_name"; then
            log_success "✅ $service container is running"
            return 0
        fi
        
        ((retry_count++))
        log_debug "Waiting for $service container... ($retry_count/$max_retries)"
        sleep 1
    done
    
    log_error "❌ $service container failed to start within timeout"
    return 1
}

verify_rollback() {
    local service="$1"
    local endpoint
    local max_retries=30
    local retry_count=0
    
    log_info "Verifying $service rollback..."
    
    case "$service" in
        "mcp")
            endpoint="$MCP_HEALTH_ENDPOINT"
            ;;
        "vaulty")
            endpoint="$VAULT_HEALTH_ENDPOINT"
            ;;
        *)
            log_error "Unknown service: $service"
            return 1
            ;;
    esac
    
    # Health check
    while [[ $retry_count -lt $max_retries ]]; do
        if curl -sf "$endpoint" >/dev/null 2>&1; then
            log_success "✅ $service is healthy after rollback"
            return 0
        fi
        
        ((retry_count++))
        log_debug "Health check attempt $retry_count/$max_retries..."
        sleep 1
    done
    
    log_error "❌ $service health check failed"
    return 1
}

create_rollback_report() {
    log_section "Rollback Report"
    
    # MCP status
    if podman ps | grep -q "$MCP_CONTAINER_NAME"; then
        log_success "MCP: Running ($(get_current_image 'mcp'))"
    else
        log_error "MCP: Stopped"
    fi
    
    # Vaulty status
    if podman ps | grep -q "$VAULTY_CONTAINER_NAME"; then
        log_success "Vaulty: Running ($(get_current_image 'vaulty'))"
    else
        log_error "Vaulty: Stopped"
    fi
    
    # Resource usage
    log_info "Resource Usage:"
    podman stats --no-stream --format "table {{.Names}}\t{{.CPUPerc}}\t{{.MemPerc}}" | grep -E "$MCP_CONTAINER_NAME|$VAULTY_CONTAINER_NAME" || true
    
    # Container logs
    log_info "Recent Container Logs (last 20 lines):"
    
    if podman ps -a | grep -q "$MCP_CONTAINER_NAME"; then
        log_info "MCP logs:"
        podman logs "$MCP_CONTAINER_NAME" 2>/dev/null | tail -10 || log_warning "Failed to retrieve MCP logs"
    fi
    
    if podman ps -a | grep -q "$VAULTY_CONTAINER_NAME"; then
        log_info "Vaulty logs:"
        podman logs "$VAULTY_CONTAINER_NAME" 2>/dev/null | tail -10 || log_warning "Failed to retrieve Vaulty logs"
    fi
}

##############################################################################
# Interactive Rollback
##############################################################################

interactive_rollback() {
    log_section "Interactive Rollback"
    
    echo ""
    echo "Available services to rollback:"
    echo "1) MCP"
    echo "2) Vaulty"
    echo "3) Both (recommended)"
    echo "4) Cancel"
    echo ""
    
    read -p "Select service to rollback [1-4]: " selection
    
    case "$selection" in
        1)
            rollback_service "mcp" && verify_rollback "mcp"
            ;;
        2)
            rollback_service "vaulty" && verify_rollback "vaulty"
            ;;
        3)
            rollback_service "mcp" && verify_rollback "mcp" && sleep 5
            rollback_service "vaulty" && verify_rollback "vaulty"
            ;;
        4)
            log_info "Rollback cancelled"
            return 0
            ;;
        *)
            log_error "Invalid selection"
            return 1
            ;;
    esac
}

##############################################################################
# Automatic Rollback
##############################################################################

auto_rollback() {
    local services=("mcp" "vaulty")
    
    log_section "Automatic Rollback - All Services"
    
    for service in "${services[@]}"; do
        if ! rollback_service "$service"; then
            log_error "Failed to rollback $service"
            return 1
        fi
        
        if ! verify_rollback "$service"; then
            log_error "Failed to verify $service after rollback"
            return 1
        fi
        
        sleep 5
    done
    
    return 0
}

##############################################################################
# Main Rollback
##############################################################################

main() {
    local mode="${1:-interactive}"
    
    log_section "Production Rollback Manager"
    log_info "Mode: $mode"
    log_info "Rollback ID: $ROLLBACK_ID"
    log_info "Timestamp: $(date)"
    
    echo ""
    
    case "$mode" in
        "auto")
            auto_rollback || {
                log_error "❌ Automatic rollback failed"
                create_rollback_report
                return 1
            }
            ;;
        "interactive")
            interactive_rollback || {
                log_error "❌ Interactive rollback failed"
                create_rollback_report
                return 1
            }
            ;;
        *)
            log_error "Unknown rollback mode: $mode (use 'auto' or 'interactive')"
            return 1
            ;;
    esac
    
    echo ""
    create_rollback_report
    
    log_success "✅ Rollback completed successfully"
    log_info "Logs: $ROLLBACK_LOG"
    
    return 0
}

##############################################################################
# Script Entry Point
##############################################################################

main "$@"
exit $?
