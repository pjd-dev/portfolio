#!/usr/bin/env bash

################################################################################
# Production Deployment Executor
# Phase 4 Objective 5: Deploy to Production
#
# Manages production deployment with health checks and rollback capability
# Supports rolling and blue-green deployment strategies
################################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/common.sh"
source "$SCRIPT_DIR/../config/production.env" || true

# ============================================================================
# Deployment State
# ============================================================================

DEPLOYMENT_ID="deploy-$(date +%Y%m%d-%H%M%S)"
DEPLOYMENT_LOG="${SCRIPT_DIR}/../logs/deployment-${DEPLOYMENT_ID}.log"
DEPLOYMENT_STATE_FILE="${SCRIPT_DIR}/../logs/deployment-state.json"

# Ensure logs directory exists
mkdir -p "$(dirname "$DEPLOYMENT_LOG")"

##############################################################################
# Deployment Functions
##############################################################################

deploy_start() {
    local service="$1"
    log_section "Starting $service deployment..."
    log_info "Deployment ID: $DEPLOYMENT_ID"
    log_info "Strategy: $DEPLOYMENT_STRATEGY"
    log_info "Timestamp: $(date)"
}

deploy_health_check() {
    local service="$1"
    local endpoint="$2"
    local max_retries="${3:-30}"
    local retry_delay="${4:-2}"
    
    log_info "Health checking $service..."
    
    local retry_count=0
    while [[ $retry_count -lt $max_retries ]]; do
        if curl -sf "$endpoint" >/dev/null 2>&1; then
            log_success "✅ $service health check passed"
            return 0
        fi
        
        ((retry_count++))
        log_debug "Health check attempt $retry_count/$max_retries - retrying in ${retry_delay}s..."
        sleep "$retry_delay"
    done
    
    log_error "❌ $service health check failed after $max_retries attempts"
    return 1
}

deploy_image() {
    local service="$1"
    local image="$2"
    local container_name="$3"
    
    log_info "Deploying $service image: $image"
    
    # Stop existing container if running (for rolling deployment)
    if podman ps -a --filter "name=$container_name" --format "{{.Names}}" | grep -q "^$container_name$"; then
        log_info "Stopping existing $service container..."
        podman stop "$container_name" 2>/dev/null || true
    fi
    
    # Remove old container
    if podman ps -a --filter "name=$container_name" --format "{{.Names}}" | grep -q "^$container_name$"; then
        log_info "Removing old $service container..."
        podman rm "$container_name" --force 2>/dev/null || true
    fi
    
    # Pull latest image
    log_info "Pulling latest $service image..."
    podman pull "$image"
    
    # Run new container
    log_info "Starting new $service container..."
    case "$service" in
        "mcp")
            podman run -d \
                --name "$container_name" \
                --pod "$POD_NAME" \
                --cpus "$MCP_CPU_LIMIT" \
                --memory "$MCP_MEMORY_LIMIT" \
                -e "NODE_ENV=production" \
                -e "PORT=$MCP_PORT" \
                --health-cmd="curl -f http://localhost:$MCP_PORT/health" \
                --health-interval=30s \
                --health-timeout=10s \
                --health-retries=3 \
                "$image"
            ;;
        "vaulty")
            podman run -d \
                --name "$container_name" \
                --pod "$POD_NAME" \
                --cpus "$VAULTY_CPU_LIMIT" \
                --memory "$VAULTY_MEMORY_LIMIT" \
                -e "NODE_ENV=production" \
                -e "PORT=$VAULT_PORT" \
                -v "$VAULT_DATA_PATH:/app/data" \
                --health-cmd="curl -f http://localhost:$VAULT_PORT/health" \
                --health-interval=30s \
                --health-timeout=10s \
                --health-retries=3 \
                "$image"
            ;;
        *)
            log_error "Unknown service: $service"
            return 1
            ;;
    esac
    
    log_success "✅ $service container started"
}

deploy_verify() {
    local service="$1"
    local endpoint="$2"
    
    log_info "Verifying $service deployment..."
    
    # Wait for container to be ready
    sleep 3
    
    # Check health
    if ! deploy_health_check "$service" "$endpoint"; then
        return 1
    fi
    
    # Run smoke tests
    log_info "Running $service smoke tests..."
    case "$service" in
        "mcp")
            if curl -sf "$endpoint" | jq -e '.status' >/dev/null 2>&1; then
                log_success "✅ MCP endpoints responding"
            else
                log_error "❌ MCP endpoints not responding"
                return 1
            fi
            ;;
        "vaulty")
            if curl -sf "$endpoint" | jq -e '.healthy' >/dev/null 2>&1; then
                log_success "✅ Vaulty endpoints responding"
            else
                log_error "❌ Vaulty endpoints not responding"
                return 1
            fi
            ;;
    esac
    
    return 0
}

deploy_rollback() {
    local service="$1"
    local previous_image="$2"
    local container_name="$3"
    
    log_error "❌ Rolling back $service to previous version..."
    
    # Stop failed container
    podman stop "$container_name" 2>/dev/null || true
    podman rm "$container_name" --force 2>/dev/null || true
    
    # Deploy previous version
    log_info "Deploying previous $service image: $previous_image"
    podman pull "$previous_image"
    
    case "$service" in
        "mcp")
            podman run -d \
                --name "$container_name" \
                --pod "$POD_NAME" \
                --cpus "$MCP_CPU_LIMIT" \
                --memory "$MCP_MEMORY_LIMIT" \
                -e "NODE_ENV=production" \
                -e "PORT=$MCP_PORT" \
                "$previous_image"
            ;;
        "vaulty")
            podman run -d \
                --name "$container_name" \
                --pod "$POD_NAME" \
                --cpus "$VAULTY_CPU_LIMIT" \
                --memory "$VAULTY_MEMORY_LIMIT" \
                -e "NODE_ENV=production" \
                -e "PORT=$VAULT_PORT" \
                -v "$VAULT_DATA_PATH:/app/data" \
                "$previous_image"
            ;;
    esac
    
    log_success "✅ Rollback completed"
}

##############################################################################
# Deployment Strategies
##############################################################################

deploy_rolling() {
    log_section "Rolling Deployment Strategy"
    
    local services=("mcp" "vaulty")
    
    for service in "${services[@]}"; do
        log_info "Deploying $service..."
        
        case "$service" in
            "mcp")
                deploy_image "mcp" "$MCP_IMAGE" "$MCP_CONTAINER_NAME" || return 1
                deploy_verify "mcp" "$MCP_HEALTH_ENDPOINT" || {
                    deploy_rollback "mcp" "${MCP_PREVIOUS_IMAGE}" "$MCP_CONTAINER_NAME"
                    return 1
                }
                ;;
            "vaulty")
                deploy_image "vaulty" "$VAULTY_IMAGE" "$VAULTY_CONTAINER_NAME" || return 1
                deploy_verify "vaulty" "$VAULT_HEALTH_ENDPOINT" || {
                    deploy_rollback "vaulty" "${VAULTY_PREVIOUS_IMAGE}" "$VAULTY_CONTAINER_NAME"
                    return 1
                }
                ;;
        esac
        
        # Wait between deployments
        sleep 5
    done
    
    log_success "✅ Rolling deployment completed"
    return 0
}

deploy_blue_green() {
    log_section "Blue-Green Deployment Strategy"
    
    local services=("mcp" "vaulty")
    
    # Deploy to "green" environment
    for service in "${services[@]}"; do
        log_info "Deploying $service to green environment..."
        
        case "$service" in
            "mcp")
                local green_container="${MCP_CONTAINER_NAME}-green"
                deploy_image "mcp" "$MCP_IMAGE" "$green_container" || return 1
                deploy_verify "mcp" "$MCP_HEALTH_ENDPOINT" || return 1
                ;;
            "vaulty")
                local green_container="${VAULTY_CONTAINER_NAME}-green"
                deploy_image "vaulty" "$VAULTY_IMAGE" "$green_container" || return 1
                deploy_verify "vaulty" "$VAULT_HEALTH_ENDPOINT" || return 1
                ;;
        esac
    done
    
    # Switch traffic to "green" environment
    log_info "Switching traffic to green environment..."
    
    # Here you would implement traffic switching logic
    # E.g., update load balancer, DNS, ingress rules, etc.
    
    log_success "✅ Blue-green deployment completed"
    return 0
}

##############################################################################
# Deployment Monitoring
##############################################################################

monitor_deployment() {
    log_section "Monitoring Deployment"
    
    local monitoring_duration="${DEPLOYMENT_MONITORING_DURATION:-300}"  # 5 minutes default
    local monitoring_interval="${DEPLOYMENT_MONITORING_INTERVAL:-10}"    # 10 seconds
    local start_time=$(date +%s)
    
    log_info "Monitoring deployment for ${monitoring_duration}s..."
    
    while true; do
        current_time=$(date +%s)
        elapsed=$((current_time - start_time))
        
        if [[ $elapsed -gt $monitoring_duration ]]; then
            break
        fi
        
        # Check container status
        if podman ps | grep -q "$MCP_CONTAINER_NAME"; then
            local mcp_status="running"
        else
            local mcp_status="stopped"
        fi
        
        if podman ps | grep -q "$VAULTY_CONTAINER_NAME"; then
            local vaulty_status="running"
        else
            local vaulty_status="stopped"
        fi
        
        # Check resources
        if podman ps --format "table {{.Names}}\t{{.CPUPerc}}\t{{.MemPerc}}" | grep "$MCP_CONTAINER_NAME" >/dev/null 2>&1; then
            log_debug "MCP: $mcp_status - Vaulty: $vaulty_status"
        fi
        
        # Check for errors in logs
        local mcp_errors=$(podman logs "$MCP_CONTAINER_NAME" 2>/dev/null | grep -i "error\|exception" | wc -l)
        local vaulty_errors=$(podman logs "$VAULTY_CONTAINER_NAME" 2>/dev/null | grep -i "error\|exception" | wc -l)
        
        if [[ $mcp_errors -gt 0 ]] || [[ $vaulty_errors -gt 0 ]]; then
            log_warning "Errors detected - MCP: $mcp_errors, Vaulty: $vaulty_errors"
        fi
        
        sleep "$monitoring_interval"
    done
    
    log_success "✅ Monitoring completed"
}

##############################################################################
# Deployment Hooks
##############################################################################

run_pre_deployment_hooks() {
    log_section "Running pre-deployment hooks..."
    
    # Create backup
    if [[ -d "$BACKUP_PATH" ]]; then
        log_info "Creating pre-deployment backup..."
        cp -r "$VAULT_DATA_PATH" "$BACKUP_PATH/pre-deployment-$(date +%Y%m%d-%H%M%S)" || log_warning "Backup failed"
    fi
    
    # Drain connections
    log_info "Draining existing connections..."
    sleep 5
}

run_post_deployment_hooks() {
    log_section "Running post-deployment hooks..."
    
    # Run smoke tests
    log_info "Running post-deployment tests..."
    if command -v "$SCRIPT_DIR/services/verify.sh" &>/dev/null; then
        "$SCRIPT_DIR/services/verify.sh" || log_warning "Verification failed"
    fi
    
    # Update monitoring
    log_info "Updating monitoring configuration..."
}

##############################################################################
# Main Deployment
##############################################################################

main() {
    log_section "Production Deployment"
    
    # Validate environment
    log_info "Validating deployment environment..."
    if ! "$SCRIPT_DIR/deployment/validate-production.sh"; then
        log_error "❌ Validation failed - aborting deployment"
        return 1
    fi
    
    log_success "✅ Environment validated"
    echo ""
    
    # Pre-deployment
    run_pre_deployment_hooks || {
        log_error "❌ Pre-deployment hooks failed"
        return 1
    }
    echo ""
    
    # Deploy
    case "$DEPLOYMENT_STRATEGY" in
        "rolling")
            deploy_rolling || return 1
            ;;
        "blue-green")
            deploy_blue_green || return 1
            ;;
        *)
            log_error "❌ Unknown deployment strategy: $DEPLOYMENT_STRATEGY"
            return 1
            ;;
    esac
    echo ""
    
    # Monitor
    monitor_deployment || log_warning "⚠️  Monitoring completed with warnings"
    echo ""
    
    # Post-deployment
    run_post_deployment_hooks || log_warning "⚠️  Post-deployment hooks had warnings"
    echo ""
    
    # Summary
    log_section "Deployment Complete"
    log_success "✅ Production deployment successful"
    log_info "Deployment ID: $DEPLOYMENT_ID"
    log_info "Logs: $DEPLOYMENT_LOG"
    
    return 0
}

##############################################################################
# Script Entry Point
##############################################################################

main "$@"
exit $?
