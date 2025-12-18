#!/usr/bin/env bash

# Validate platform configuration and environment
# Checks for required files, variables, and configuration

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/common.sh"

# ============================================================================
# Configuration Checks
# ============================================================================

check_env_files() {
  print_section "Checking environment files"
  
  local env_files=(
    "$PROJECT_ROOT/.env"
    "$PROJECT_ROOT/apps/mcp/.env"
    "$PROJECT_ROOT/apps/vaulty/.env"
  )
  
  local found=0
  
  for file in "${env_files[@]}"; do
    if [[ -f "$file" ]]; then
      log_success "Found: $file"
      found=$((found + 1))
    else
      log_debug "Not found: $file (optional)"
    fi
  done
  
  if [[ $found -eq 0 ]]; then
    log_warn "No .env files found - using defaults only"
    return 1
  fi
  
  return 0
}

check_dockerfiles() {
  print_section "Checking Dockerfiles"
  
  local dockerfiles=(
    "$PROJECT_ROOT/apps/mcp/Dockerfile"
    "$PROJECT_ROOT/apps/vaulty/Dockerfile"
  )
  
  for dockerfile in "${dockerfiles[@]}"; do
    if [[ -f "$dockerfile" ]]; then
      log_success "Found: $dockerfile"
    else
      log_error "Missing Dockerfile: $dockerfile"
      return 1
    fi
  done
  
  return 0
}

check_package_files() {
  print_section "Checking package files"
  
  local required_files=(
    "$PROJECT_ROOT/package.json"
    "$PROJECT_ROOT/pnpm-workspace.yaml"
    "$PROJECT_ROOT/apps/mcp/package.json"
    "$PROJECT_ROOT/apps/vaulty/package.json"
  )
  
  for file in "${required_files[@]}"; do
    if [[ -f "$file" ]]; then
      log_success "Found: $file"
    else
      log_error "Missing: $file"
      return 1
    fi
  done
  
  return 0
}

check_required_commands() {
  print_section "Checking required commands"
  
  local commands=(
    "$RUNTIME"
    "bash"
    "mkdir"
    "cp"
  )
  
  local missing=0
  
  for cmd in "${commands[@]}"; do
    if command -v "$cmd" &>/dev/null; then
      log_success "Found: $cmd"
    else
      log_error "Missing: $cmd"
      missing=$((missing + 1))
    fi
  done
  
  if [[ $missing -gt 0 ]]; then
    return 1
  fi
  
  return 0
}

check_directory_structure() {
  print_section "Checking directory structure"
  
  local required_dirs=(
    "$PROJECT_ROOT/scripts"
    "$PROJECT_ROOT/scripts/services"
    "$PROJECT_ROOT/scripts/infrastructure"
    "$PROJECT_ROOT/scripts/utilities"
    "$PROJECT_ROOT/scripts/build"
    "$PROJECT_ROOT/apps/mcp"
    "$PROJECT_ROOT/apps/vaulty"
    "$PROJECT_ROOT/apps/auth"
  )
  
  for dir in "${required_dirs[@]}"; do
    if [[ -d "$dir" ]]; then
      log_success "Found: $dir"
    else
      log_error "Missing: $dir"
      return 1
    fi
  done
  
  return 0
}

check_port_availability() {
  print_section "Checking port availability"
  
  local port="${MCP_PORT:-4000}"
  
  # Check if port is in use (works on macOS and Linux)
  if lsof -Pi ":$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
    log_warn "Port $port is already in use"
    return 1
  else
    log_success "Port $port available"
    return 0
  fi
}

check_volume_driver() {
  print_section "Checking volume driver support"
  
  # Try to create a test volume to verify driver support
  local test_vol="__test_volume_$$"
  
  if $RUNTIME volume create "$test_vol" >/dev/null 2>&1; then
    log_success "Volume driver working"
    $RUNTIME volume rm "$test_vol" >/dev/null 2>&1 || true
    return 0
  else
    log_error "Volume driver not working"
    return 1
  fi
}

check_network_driver() {
  print_section "Checking network driver support"
  
  # Try to create a test network to verify driver support
  local test_net="__test_network_$$"
  
  if $RUNTIME network create "$test_net" >/dev/null 2>&1; then
    log_success "Network driver working"
    $RUNTIME network rm "$test_net" >/dev/null 2>&1 || true
    return 0
  else
    log_error "Network driver not working"
    return 1
  fi
}

# ============================================================================
# Validation Report
# ============================================================================

run_validations() {
  print_header "Validating Platform Configuration"
  
  local errors=0
  local warnings=0
  
  # Critical checks (must pass)
  print_divider
  if ! check_directory_structure; then
    errors=$((errors + 1))
  fi
  
  if ! check_package_files; then
    errors=$((errors + 1))
  fi
  
  if ! check_dockerfiles; then
    errors=$((errors + 1))
  fi
  
  if ! check_required_commands; then
    errors=$((errors + 1))
  fi
  
  # Driver checks (critical for runtime)
  print_divider
  if ! check_volume_driver; then
    errors=$((errors + 1))
  fi
  
  if ! check_network_driver; then
    errors=$((errors + 1))
  fi
  
  # Optional/warning checks
  print_divider
  if ! check_env_files; then
    warnings=$((warnings + 1))
  fi
  
  if ! check_port_availability; then
    warnings=$((warnings + 1))
  fi
  
  # Summary
  print_section "Validation Summary"
  
  if [[ $errors -eq 0 ]]; then
    log_success "✅ All critical checks passed"
  else
    log_error "❌ $errors critical check(s) failed"
  fi
  
  if [[ $warnings -gt 0 ]]; then
    log_warn "⚠️  $warnings warning(s) found"
  fi
  
  print_divider
  
  if [[ $errors -gt 0 ]]; then
    die "Configuration validation failed - please fix errors above"
  fi
  
  log_success "Configuration validation complete"
}

# ============================================================================
# Main Execution
# ============================================================================

run_validations
