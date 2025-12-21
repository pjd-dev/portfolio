#!/usr/bin/env bash

# vault-platform-full: Central script orchestrator
# This script provides a unified interface for all platform operations
# 
# Usage: scripts/vault [command] [options]
# Examples:
#   scripts/vault start          - Start all services
#   scripts/vault stop           - Stop all services
#   scripts/vault restart        - Restart all services
#   scripts/vault status         - Check service status
#   scripts/vault logs           - View service logs
#   scripts/vault build          - Build all containers
#   scripts/vault init           - Initialize platform
#   scripts/vault help           - Show this help message

set -euo pipefail

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
  echo -e "${BLUE}ℹ${NC} $*"
}

log_success() {
  echo -e "${GREEN}✓${NC} $*"
}

log_warn() {
  echo -e "${YELLOW}⚠${NC} $*"
}

log_error() {
  echo -e "${RED}✗${NC} $*" >&2
}

# Help command
show_help() {
  cat << 'EOF'
Vault Platform - Central Command Interface

USAGE:
  scripts/vault [command] [options]

COMMANDS:
  Quick Start:
    up [vault-path] Initialize and start all services
    
  Container Management:
    start           Start all services (MCP, Vault)
    stop            Stop all services
    restart         Restart all services
    status          Show service status
    logs            View service logs (tail -f)
    logs [service]  View specific service logs

  Development:
    build           Build all container images
    rebuild         Rebuild all container images (no cache)
    shell [app]     Start shell in container (default: mcp)
    
  Infrastructure:
    init            Initialize platform (volumes, networks)
    clean           Clean up containers and volumes
    prune           Remove unused Docker resources
    
  Utilities:
    sync-vault      Sync vault to local filesystem
    verify-vault    Verify vault integrity
    tunnel          Start Cloudflared tunnel
    smoke           Run smoke tests (quick health check)
    watchdog        Run watchdog (monitor + auto-restart)
    
  General:
    help            Show this help message
    version         Show version information

EXAMPLES:
  Start the platform:
    $ scripts/vault start
  
  View MCP logs:
    $ scripts/vault logs mcp
  
  Rebuild all images:
    $ scripts/vault rebuild
  
  Initialize new installation:
    $ scripts/vault init

ENVIRONMENT VARIABLES:
  VAULT_PATH              Path to vault directory (default: ~/.obsidian/vault)
  DOCKER_HOST             Docker daemon socket
  LOG_LEVEL               Logging level (debug, info, warn, error)

For more information, see doc/SCRIPTS.md
EOF
}

# Show version
show_version() {
  cat << EOF
vault-platform-full v1.0.0
Built with: bash, docker, pnpm
Phase: 3 (Script Consolidation)
Date: 2025-12-18
EOF
}

# Load common utilities
if [[ -f "$SCRIPT_DIR/common.sh" ]]; then
  source "$SCRIPT_DIR/common.sh"
fi

# Main command router
main() {
  local command="${1:-help}"
  
  case "$command" in
    # Quick start command
    up)
      log_info "Initializing and starting platform..."
      bash "$SCRIPT_DIR/infrastructure/init.sh" "${2:-}"
      source "$SCRIPT_DIR/services/start.sh"
      ;;
    
    # Container commands
    start)
      log_info "Starting all services..."
      source "$SCRIPT_DIR/services/start.sh"
      ;;
    stop)
      log_info "Stopping all services..."
      source "$SCRIPT_DIR/services/stop.sh"
      ;;
    restart)
      log_info "Restarting all services..."
      source "$SCRIPT_DIR/services/restart.sh"
      ;;
    status)
      log_info "Checking service status..."
      source "$SCRIPT_DIR/services/status.sh"
      ;;
    logs)
      log_info "Viewing logs..."
      source "$SCRIPT_DIR/services/logs.sh" "${2:-all}"
      ;;
    
    # Build commands
    build)
      log_info "Building container images..."
      source "$SCRIPT_DIR/build/docker-build.sh"
      ;;
    rebuild)
      log_info "Rebuilding container images (no cache)..."
      source "$SCRIPT_DIR/build/docker-build.sh" "no-cache"
      ;;
    
    # Infrastructure subcommands
    infrastructure)
      case "${2:-help}" in
        init)
          log_info "Initializing platform infrastructure..."
          bash "$SCRIPT_DIR/infrastructure/init.sh" "${@:3}"
          ;;
        verify)
          log_info "Verifying platform infrastructure..."
          bash "$SCRIPT_DIR/infrastructure/verify.sh" "${@:3}"
          ;;
        validate)
          log_info "Validating platform configuration..."
          bash "$SCRIPT_DIR/infrastructure/validate.sh" "${@:3}"
          ;;
        clean)
          log_info "Cleaning up infrastructure..."
          bash "$SCRIPT_DIR/infrastructure/clean.sh" "${@:3}"
          ;;
        prune)
          log_info "Pruning container resources..."
          bash "$SCRIPT_DIR/infrastructure/prune.sh" "${@:3}"
          ;;
        *)
          log_error "Unknown infrastructure command: ${2:-help}"
          echo "Infrastructure commands: init, verify, validate, clean, prune"
          exit 1
          ;;
      esac
      ;;
    
    # Utilities subcommands
    utilities)
      case "${2:-help}" in
        sync)
          log_info "Syncing vault..."
          bash "$SCRIPT_DIR/utilities/sync-vault.sh" "${@:3}"
          ;;
        verify)
          log_info "Verifying vault..."
          bash "$SCRIPT_DIR/utilities/verify-vault.sh" "${@:3}"
          ;;
        tunnel)
          log_info "Tunnel management..."
          bash "$SCRIPT_DIR/utilities/tunnel.sh" "${@:3}"
          ;;
        *)
          log_error "Unknown utilities command: ${2:-help}"
          echo "Utilities commands: sync, verify, tunnel"
          exit 1
          ;;
      esac
      ;;
    
    # Help/Info
    help)
      show_help
      ;;
    version)
      show_version
      ;;
    
    # Smoke tests
    smoke)
      log_info "Running smoke tests..."
      bash "$SCRIPT_DIR/smoke.sh" "${@:2}"
      ;;
    
    # Watchdog
    watchdog)
      log_info "Running watchdog..."
      bash "$SCRIPT_DIR/watchdog.sh" "${@:2}"
      ;;
    
    *)
      log_error "Unknown command: $command"
      show_help
      exit 1
      ;;
  esac
  
  log_success "Done!"
}

# Run main function with all arguments
main "$@"
