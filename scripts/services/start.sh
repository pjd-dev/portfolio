#!/usr/bin/env bash

# Start all vault platform services
# Integrated logic from legacy service scripts (removed)
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
  for app in mcp vaulty viewer; do
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
VIEWER_CONTAINER="${VIEWER_CONTAINER_NAME:-viewer}"
API_CONTAINER="${API_CONTAINER_NAME:-api-server}"
PROXY_CONTAINER="${PROXY_CONTAINER_NAME:-proxy}"
MCP_PORT="${MCP_PORT:-4000}"
API_PORT="${API_PORT:-4300}"
VIEWER_PORT="${VIEWER_PORT:-4400}"
PROXY_PORT="${PROXY_PORT:-8080}"

# Internal API wiring (inside the pod)
API_INTERNAL_PORT="${API_INTERNAL_PORT:-4300}"
API_INTERNAL_HOST="${API_INTERNAL_HOST:-127.0.0.1}"
API_INTERNAL_URL="${API_INTERNAL_URL:-http://${API_INTERNAL_HOST}:${API_INTERNAL_PORT}}"
# CORS origins for dev/prod viewer
DEV_CORS_ORIGINS="${CORS_ORIGIN:-http://localhost:8080,http://127.0.0.1:8080,http://localhost:8000,http://127.0.0.1:8000,http://localhost:3000,http://127.0.0.1:3000,http://localhost:4400,http://127.0.0.1:4400}"

# Volume configuration: prefer explicit LOCAL_VAULT_PATH, then VAULT_PATH if absolute; otherwise use named volume
VOLUME_SOURCE="${LOCAL_VAULT_PATH:-${VAULT_DATA_VOLUME:-vault}}"

# Expand ~ if present in host path
if [[ "${VOLUME_SOURCE#~}" != "$VOLUME_SOURCE" ]]; then
  VOLUME_SOURCE="$(eval echo "$VOLUME_SOURCE")"
fi

# If VOLUME_SOURCE is not an absolute path, but VAULT_PATH is absolute, use that as host bind
if [[ "${VOLUME_SOURCE:0:1}" != "/" && "${VAULT_PATH:-}" == /* ]]; then
  VOLUME_SOURCE="$VAULT_PATH"
fi

VOLUME_BIND_MODE="volume"
# If expanded path is an absolute path, ensure it exists and is readable; otherwise fall back to named volume
if [[ "${VOLUME_SOURCE:0:1}" == "/" ]]; then
  # Try to create the directory if it doesn't exist
  if [[ ! -d "$VOLUME_SOURCE" ]]; then
    log_info "Creating host vault path: $VOLUME_SOURCE"
    if mkdir -p "$VOLUME_SOURCE" 2>/dev/null; then
      log_success "Directory created: $VOLUME_SOURCE"
    else
      log_warn "Failed to create host vault path '$VOLUME_SOURCE', falling back to named volume"
      VOLUME_SOURCE="vault"
    fi
  elif [[ ! -r "$VOLUME_SOURCE" ]]; then
    # Directory exists but not readable
    log_warn "Host vault path '$VOLUME_SOURCE' not readable, falling back to named volume"
    VOLUME_SOURCE="vault"
  else
    log_success "Using host vault path: $VOLUME_SOURCE"
    VOLUME_BIND_MODE="bind"
  fi
fi

log_info "Vault mount source: $VOLUME_SOURCE (mode: $VOLUME_BIND_MODE)"

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
  $RUNTIME build --format=docker -t vault-mcp:latest -f "$dockerfile" "$PROJECT_ROOT" || die "MCP build failed"
  log_success "MCP image built"
}

build_vault_image() {
  local dockerfile="$PROJECT_ROOT/apps/vaulty/Dockerfile"
  
  if [[ ! -f "$dockerfile" ]]; then
    die "Vault Dockerfile not found: $dockerfile"
  fi
  
  log_info "Building Vault image..."
  $RUNTIME build --format=docker -t vault-vaulty:latest -f "$dockerfile" "$PROJECT_ROOT/apps/vaulty" || die "Vault build failed"
  log_success "Vault image built"
}

build_viewer_image() {
  local dockerfile="$PROJECT_ROOT/apps/viewer/Dockerfile"

  if [[ ! -f "$dockerfile" ]]; then
    log_warn "Viewer Dockerfile not found: $dockerfile (skipping)"
    return
  fi

  log_info "Building Viewer image..."
  $RUNTIME build --format=docker -t vault-viewer:latest -f "$dockerfile" "$PROJECT_ROOT/apps/viewer" || die "Viewer build failed"
  log_success "Viewer image built"
}

build_api_image() {
  local dockerfile="$PROJECT_ROOT/apps/api/Dockerfile"

  if [[ ! -f "$dockerfile" ]]; then
    log_warn "API Dockerfile not found: $dockerfile (skipping)"
    return
  fi

  log_info "Building API image..."
  $RUNTIME build --format=docker -t vault-api:latest -f "$dockerfile" "$PROJECT_ROOT" || die "API build failed"
  log_success "API image built"
}

build_proxy_image() {
  local dockerfile="$PROJECT_ROOT/apps/proxy/Dockerfile"

  if [[ ! -f "$dockerfile" ]]; then
    log_warn "Proxy Dockerfile not found: $dockerfile (skipping)"
    return
  fi

  log_info "Building Proxy image..."
  $RUNTIME build --format=docker -t vault-proxy:latest "$PROJECT_ROOT/apps/proxy" || die "Proxy build failed"
  log_success "Proxy image built"
}

create_pod() {
  log_info "Creating pod '$POD_NAME' with ports Proxy:$PROXY_PORT MCP:$MCP_PORT API:$API_PORT Viewer:$VIEWER_PORT..."
  
  # Create pod with port binding (ignore if exists)
  # Proxy on port 8080 is the main entry point; direct ports for debugging
  local port_flags=("-p" "$PROXY_PORT:8080" "-p" "$MCP_PORT:4000" "-p" "$API_PORT:4300")
  if [[ -n "$VIEWER_PORT" ]]; then
    port_flags+=("-p" "$VIEWER_PORT:4400")
  fi
  $RUNTIME pod create --name "$POD_NAME" "${port_flags[@]}" 2>/dev/null || true
  
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

  # Remove existing container if present to avoid name collision
  $RUNTIME rm -f "$MCP_CONTAINER" >/dev/null 2>&1 && log_info "Removed existing container $MCP_CONTAINER" || true

  # Run MCP container
  local volume_flag="${VOLUME_FLAG_OVERRIDE:-}"
  if [[ -z "$volume_flag" ]]; then
    if [[ "$VOLUME_BIND_MODE" == "bind" ]]; then
      volume_flag="-v"
    else
      volume_flag="--volume"
    fi
  fi

  $RUNTIME run -d \
    --name "$MCP_CONTAINER" \
    --pod "$POD_NAME" \
    $volume_flag "$VOLUME_SOURCE:/vault:Z" \
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

  # Remove existing container if present to avoid name collision
  $RUNTIME rm -f "$VAULT_CONTAINER" >/dev/null 2>&1 && log_info "Removed existing container $VAULT_CONTAINER" || true

  # Volume flag based on bind/volume mode
  local volume_flag="${VOLUME_FLAG_OVERRIDE:-}"
  if [[ -z "$volume_flag" ]]; then
    if [[ "$VOLUME_BIND_MODE" == "bind" ]]; then
      volume_flag="-v"
    else
      volume_flag="--volume"
    fi
  fi

  # Run Vault container
  $RUNTIME run -d \
    --name "$VAULT_CONTAINER" \
    --pod "$POD_NAME" \
    $volume_flag "$VOLUME_SOURCE:/vault:Z" \
    "${env_flags[@]}" \
    "${user_flags[@]}" \
    vault-vaulty:latest || die "Failed to start Vault container"
  
  log_success "Vault service started: $VAULT_CONTAINER"
}

start_viewer_service() {
  log_info "Starting Viewer service..."

  if [[ ! -d "$PROJECT_ROOT/apps/viewer" ]]; then
    log_warn "Viewer app not found at apps/viewer (skipping)"
    return
  fi

  # Remove existing container if present to avoid name collision
  $RUNTIME rm -f "$VIEWER_CONTAINER" >/dev/null 2>&1 && log_info "Removed existing container $VIEWER_CONTAINER" || true

  # Volume flag based on bind/volume mode
  local volume_flag="${VOLUME_FLAG_OVERRIDE:-}"
  if [[ -z "$volume_flag" ]]; then
    if [[ "$VOLUME_BIND_MODE" == "bind" ]]; then
      volume_flag="-v"
    else
      volume_flag="--volume"
    fi
  fi

  # Prepare environment flags (no user flag - nginx handles privileges internally)
  local env_flags=()
  for env_file in "$PROJECT_ROOT/.env" "$PROJECT_ROOT/apps/viewer/.env"; do
    if [[ -f "$env_file" ]]; then
      env_flags+=(--env-file "$env_file")
    fi
  done

  # API URL exposed to frontend JS. Keep this empty to use relative /api via nginx proxy,
  # unless explicitly overridden. This avoids CORS by sharing origin with the viewer.
  local api_url="${TASKER_API_URL:-}"

  # Run Viewer container (nginx runs as root, drops privileges itself)
  $RUNTIME run -d \
    --name "$VIEWER_CONTAINER" \
    --pod "$POD_NAME" \
    $volume_flag "$VOLUME_SOURCE:/vault:Z" \
    -e "TASKER_API_URL=$api_url" \
    -e "API_PROXY_URL=$API_INTERNAL_URL" \
    "${env_flags[@]}" \
    vault-viewer:latest || die "Failed to start Viewer container"

  log_success "Viewer service started: $VIEWER_CONTAINER (API: $api_url)"
}

start_api_service() {
  log_info "Starting API service..."

  if [[ ! -d "$PROJECT_ROOT/apps/api" ]]; then
    log_warn "API app not found at apps/api (skipping)"
    return
  fi

  # Remove existing container if present to avoid name collision
  # Remove existing container if present to avoid name collision
  $RUNTIME rm -f "$API_CONTAINER" >/dev/null 2>&1 && log_info "Removed existing container $API_CONTAINER" || true

  # Volume flag based on bind/volume mode
  local volume_flag="${VOLUME_FLAG_OVERRIDE:-}"
  if [[ -z "$volume_flag" ]]; then
    if [[ "$VOLUME_BIND_MODE" == "bind" ]]; then
      volume_flag="-v"
    else
      volume_flag="--volume"
    fi
  fi

  # Prepare environment and volume flags
  local env_flags=()
  for env_file in "$PROJECT_ROOT/.env" "$PROJECT_ROOT/apps/api/.env"; do
    if [[ -f "$env_file" ]]; then
      env_flags+=(--env-file "$env_file")
    fi
  done

  local user_flags=()
  if [[ -n "$CONTAINER_USER" ]]; then
    user_flags=(--user "$CONTAINER_USER")
  fi

  # Run API container
  $RUNTIME run -d \
    --name "$API_CONTAINER" \
    --pod "$POD_NAME" \
    $volume_flag "$VOLUME_SOURCE:/vault:Z" \
    "${env_flags[@]}" \
    -e "CORS_ORIGIN=$DEV_CORS_ORIGINS" \
    "${user_flags[@]}" \
    vault-api:latest || die "Failed to start API container"

  log_success "API service started: $API_CONTAINER"
}

start_proxy_service() {
  log_info "Starting Proxy service..."

  if [[ ! -d "$PROJECT_ROOT/apps/proxy" ]]; then
    log_warn "Proxy app not found at apps/proxy (skipping)"
    return
  fi

  # Remove existing container if present to avoid name collision
  if $RUNTIME ps -a --format "{{.Names}}" | grep -q "^${PROXY_CONTAINER}\$"; then
    log_warn "Container ${PROXY_CONTAINER} already exists; removing it first"
    $RUNTIME rm -f "$PROXY_CONTAINER" >/dev/null 2>&1 && log_info "Removed existing container $PROXY_CONTAINER" || true
  fi

  # Run Proxy container
  $RUNTIME run -d \
    --name "$PROXY_CONTAINER" \
    --pod "$POD_NAME" \
    vault-proxy:latest || die "Failed to start Proxy container"

  log_success "Proxy service started: $PROXY_CONTAINER"
}

# ============================================================================
# Main Execution
# ============================================================================

print_header "Starting Vault Platform Services"

print_section "Building container images"
build_mcp_image
build_vault_image
build_api_image
build_viewer_image
build_proxy_image

print_section "Creating pod infrastructure"
create_pod

print_section "Starting Vault service"
start_vault_service

# Wait for vault to initialize
sleep 3

print_section "Starting MCP service"
start_mcp_service

print_section "Starting API service"
start_api_service

# Viewer can start after MCP with shared volume.
print_section "Starting Viewer service"
start_viewer_service

# Proxy starts last after all backend services are up
print_section "Starting Proxy service"
start_proxy_service

# Verify services
sleep 2
print_section "Verifying services"
if $RUNTIME ps --filter "name=$MCP_CONTAINER" --format "{{.Names}}" | grep -q "$MCP_CONTAINER"; then
  log_success "MCP service verified running"
else
  log_warn "MCP service verification failed"
fi

if $RUNTIME ps --filter "name=$API_CONTAINER" --format "{{.Names}}" | grep -q "$API_CONTAINER"; then
  log_success "API service verified running"
else
  log_warn "API service verification failed"
fi

if $RUNTIME ps --filter "name=$VAULT_CONTAINER" --format "{{.Names}}" | grep -q "$VAULT_CONTAINER"; then
  log_success "Vault service verified running"
else
  log_warn "Vault service verification failed"
fi

if $RUNTIME ps --filter "name=$VIEWER_CONTAINER" --format "{{.Names}}" | grep -q "$VIEWER_CONTAINER"; then
  log_success "Viewer service verified running"
else
  log_warn "Viewer service verification failed"
fi

if $RUNTIME ps --filter "name=$PROXY_CONTAINER" --format "{{.Names}}" | grep -q "$PROXY_CONTAINER"; then
  log_success "Proxy service verified running"
else
  log_warn "Proxy service verification failed"
fi

log_success "All services started successfully"
log_info "Access the platform at http://localhost:$PROXY_PORT"

# Inspect vault mounts inside containers that should have /vault
for c in "$MCP_CONTAINER" "$VAULT_CONTAINER" "$API_CONTAINER" "$VIEWER_CONTAINER"; do
  if $RUNTIME ps --format "{{.Names}}" | grep -q "^$c$"; then
    log_info "Inspecting vault mount in $c (ls -la /vault | head)..."
    $RUNTIME exec "$c" sh -c 'ls -la /vault | head' || log_warn "Unable to list /vault in $c"
  fi
done
