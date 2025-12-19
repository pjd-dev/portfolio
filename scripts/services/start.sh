#!/usr/bin/env bash

# Start all vault platform services
# Integrated logic from podman/run-mcp.sh and podman/run-vault.sh
# Plus environment loading and container orchestration

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/common.sh"

# ============================================================================
# Environment Setup (from podman scripts)
# ============================================================================

load_env_files() {
  # Load .env files in order: root, then apps
  local root_env="$PROJECT_ROOT/.env"
  if [[ -f "$root_env" ]]; then
    log_debug "Loading root environment: $root_env"
    set -a
    # shellcheck disable=SC1090
    source "$root_env"
    set +a
  fi

  # Load app-level .env files
  for app in mcp vaulty; do
    local app_env="$PROJECT_ROOT/apps/$app/.env"
    if [[ -f "$app_env" ]]; then
      log_debug "Loading $app environment: $app_env"
      set -a
      # shellcheck disable=SC1090
      source "$app_env"
      set +a
    fi
  done
}

# ============================================================================
# Configuration
# ============================================================================

load_env_files

# Container and pod configuration
POD_NAME="${POD_NAME:-vaulty-pod}"
MCP_CONTAINER="${MCP_CONTAINER_NAME:-${CONTAINER_NAME:-mcp-server-dev}}"
VAULT_CONTAINER="${VAULT_CONTAINER_NAME:-vaulty}"
MCP_PORT="${MCP_PORT:-4000}"

# Volume configuration
VOLUME_SOURCE="${LOCAL_VAULT_PATH:-${VAULT_DATA_VOLUME:-vault}}"

# Expand ~ if present in host path
if [[ "${VOLUME_SOURCE#~}" != "$VOLUME_SOURCE" ]]; then
  VOLUME_SOURCE="$(eval echo "$VOLUME_SOURCE")"
fi

# If expanded path is an absolute path, ensure it exists and is readable
if [[ "${VOLUME_SOURCE:0:1}" == "/" ]]; then
  # Try to create the directory if it doesn't exist
  if [[ ! -d "$VOLUME_SOURCE" ]]; then
    log_info "Creating LOCAL_VAULT_PATH directory: $VOLUME_SOURCE"
    if mkdir -p "$VOLUME_SOURCE" 2>/dev/null; then
      log_success "Directory created: $VOLUME_SOURCE"
    else
      log_warn "Failed to create LOCAL_VAULT_PATH '$VOLUME_SOURCE', falling back to named volume"
      VOLUME_SOURCE="vault"
    fi
  elif [[ ! -r "$VOLUME_SOURCE" ]]; then
    # Directory exists but not readable
    log_warn "LOCAL_VAULT_PATH '$VOLUME_SOURCE' not readable, falling back to named volume"
    VOLUME_SOURCE="vault"
  else
    log_success "Using LOCAL_VAULT_PATH: $VOLUME_SOURCE"
  fi
fi

# User/group mapping
CONTAINER_USER="${CONTAINER_USER:-$(id -u):$(id -g)}"

# ============================================================================
# Service Startup Functions
# ============================================================================

build_mcp_image() {
  local dockerfile="$PROJECT_ROOT/apps/mcp/Dockerfile"
  
  if [[ ! -f "$dockerfile" ]]; then
    die "MCP Dockerfile not found: $dockerfile"
  fi
  
  log_info "Building MCP image..."
  $RUNTIME build -t vault-mcp:latest -f "$dockerfile" "$PROJECT_ROOT" || die "MCP build failed"
  log_success "MCP image built"
}

build_vault_image() {
  local dockerfile="$PROJECT_ROOT/apps/vaulty/Dockerfile"
  
  if [[ ! -f "$dockerfile" ]]; then
    die "Vault Dockerfile not found: $dockerfile"
  fi
  
  log_info "Building Vault image..."
  $RUNTIME build -t vault-vaulty:latest -f "$dockerfile" "$PROJECT_ROOT/apps/vaulty" || die "Vault build failed"
  log_success "Vault image built"
}

create_pod() {
  log_info "Creating pod '$POD_NAME' with port $MCP_PORT..."
  
  # Create pod with port binding (ignore if exists)
  $RUNTIME pod create --name "$POD_NAME" -p "$MCP_PORT:4000" 2>/dev/null || true
  
  log_success "Pod ready: $POD_NAME"
}

start_mcp_service() {
  log_info "Starting MCP service..."
  
  # Prepare environment and volume flags
  local env_flags=()
  for env_file in "$PROJECT_ROOT/.env" "$PROJECT_ROOT/apps/mcp/.env"; do
    if [[ -f "$env_file" ]]; then
      env_flags+=(--env-file "$env_file")
    fi
  done
  
  local user_flags=()
  if [[ -n "$CONTAINER_USER" ]]; then
    user_flags=(--user "$CONTAINER_USER")
  fi
  
  # Run MCP container
  $RUNTIME run -d --rm \
    --name "$MCP_CONTAINER" \
    --pod "$POD_NAME" \
    --volume "$VOLUME_SOURCE:/vault:Z" \
    "${env_flags[@]}" \
    "${user_flags[@]}" \
    vault-mcp:latest || die "Failed to start MCP container"
  
  log_success "MCP service started: $MCP_CONTAINER"
}

start_vault_service() {
  log_info "Starting Vault service..."
  
  # Prepare environment and volume flags
  local env_flags=()
  for env_file in "$PROJECT_ROOT/.env" "$PROJECT_ROOT/apps/vaulty/.env"; do
    if [[ -f "$env_file" ]]; then
      env_flags+=(--env-file "$env_file")
    fi
  done
  
  local user_flags=()
  if [[ -n "$CONTAINER_USER" ]]; then
    user_flags=(--user "$CONTAINER_USER")
  fi
  
  # Run Vault container
  $RUNTIME run -d --rm \
    --name "$VAULT_CONTAINER" \
    --pod "$POD_NAME" \
    --volume "$VOLUME_SOURCE:/vault:Z" \
    "${env_flags[@]}" \
    "${user_flags[@]}" \
    vault-vaulty:latest || die "Failed to start Vault container"
  
  log_success "Vault service started: $VAULT_CONTAINER"
}

# ============================================================================
# Main Execution
# ============================================================================

print_header "Starting Vault Platform Services"

print_section "Building container images"
build_mcp_image
build_vault_image

print_section "Creating pod infrastructure"
create_pod

print_section "Starting MCP service"
start_mcp_service

print_section "Starting Vault service"
start_vault_service

# Verify services
sleep 2
print_section "Verifying services"
if $RUNTIME ps --filter "name=$MCP_CONTAINER" --format "{{.Names}}" | grep -q "$MCP_CONTAINER"; then
  log_success "MCP service verified running"
else
  log_warn "MCP service verification failed"
fi

if $RUNTIME ps --filter "name=$VAULT_CONTAINER" --format "{{.Names}}" | grep -q "$VAULT_CONTAINER"; then
  log_success "Vault service verified running"
else
  log_warn "Vault service verification failed"
fi

log_success "All services started successfully"
