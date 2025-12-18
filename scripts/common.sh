#!/usr/bin/env bash

# Common utilities for vault platform scripts
# This file contains shared functions and variables used across all scripts

set -euo pipefail

# ============================================================================
# Environment Setup
# ============================================================================

# Script directory
SCRIPT_DIR="${SCRIPT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
PROJECT_ROOT="${PROJECT_ROOT:-$(dirname "$SCRIPT_DIR")}"
APPS_DIR="$PROJECT_ROOT/apps"
PODMAN_DIR="$PROJECT_ROOT/podman"
DOC_DIR="$PROJECT_ROOT/doc"

# Load colors if available
if [[ -f "$SCRIPT_DIR/lib/colors.sh" ]]; then
  source "$SCRIPT_DIR/lib/colors.sh"
else
  # Fallback color codes
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  BLUE='\033[0;34m'
  CYAN='\033[0;36m'
  NC='\033[0m'
fi

# ============================================================================
# Logging Functions
# ============================================================================

# Log with level and color
log_level() {
  local level="$1"
  shift
  local message="$*"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  
  case "$level" in
    DEBUG)
      [[ "${LOG_LEVEL:-info}" == "debug" ]] && echo -e "${CYAN}[DEBUG]${NC} $message" >&2
      ;;
    INFO)
      echo -e "${BLUE}[INFO]${NC} $message"
      ;;
    SUCCESS)
      echo -e "${GREEN}[✓]${NC} $message"
      ;;
    WARN)
      echo -e "${YELLOW}[⚠]${NC} $message" >&2
      ;;
    ERROR)
      echo -e "${RED}[✗]${NC} $message" >&2
      ;;
  esac
}

log_debug() { log_level DEBUG "$@"; }
log_info() { log_level INFO "$@"; }
log_success() { log_level SUCCESS "$@"; }
log_warn() { log_level WARN "$@"; }
log_error() { log_level ERROR "$@"; }

# ============================================================================
# Error Handling
# ============================================================================

# Trap errors and show line number
trap 'log_error "Error on line $LINENO"' ERR

# Die with error message
die() {
  log_error "$@"
  exit 1
}

# Check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check required commands
require_commands() {
  for cmd in "$@"; do
    if ! command_exists "$cmd"; then
      die "Required command not found: $cmd"
    fi
  done
}

# ============================================================================
# Docker/Podman Functions
# ============================================================================

# Get the container runtime (docker or podman)
get_runtime() {
  if command_exists podman; then
    echo "podman"
  elif command_exists docker; then
    echo "docker"
  else
    die "Neither podman nor docker found"
  fi
}

RUNTIME="${RUNTIME:-$(get_runtime)}"

# Check if container is running
is_container_running() {
  local container="$1"
  $RUNTIME ps --filter "name=$container" --format "{{.Names}}" | grep -q "$container" 2>/dev/null || return 1
}

# Check if image exists
image_exists() {
  local image="$1"
  $RUNTIME images --format "{{.Repository}}:{{.Tag}}" | grep -q "$image" 2>/dev/null || return 1
}

# Get container ID
get_container_id() {
  local container="$1"
  $RUNTIME ps --all --filter "name=$container" --format "{{.ID}}" | head -n1
}

# ============================================================================
# File System Functions
# ============================================================================

# Ensure directory exists
mkdir_p() {
  mkdir -p "$@"
}

# Ensure file exists
touch_file() {
  mkdir -p "$(dirname "$1")"
  touch "$1"
}

# Safe remove (with confirmation in interactive mode)
safe_rm() {
  local target="$1"
  if [[ -e "$target" ]]; then
    if [[ -t 0 ]]; then
      read -p "Remove $target? [y/N] " -n 1 -r
      echo
      if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$target"
        log_success "Removed $target"
      fi
    else
      rm -rf "$target"
      log_success "Removed $target"
    fi
  fi
}

# ============================================================================
# Git Functions
# ============================================================================

# Check if in git repo
is_git_repo() {
  git rev-parse --git-dir > /dev/null 2>&1
}

# Get current git branch
git_branch() {
  git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown"
}

# Get git status (short)
git_status() {
  git status --short 2>/dev/null | wc -l
}

# ============================================================================
# Process Functions
# ============================================================================

# Get process PID
get_pid() {
  local process="$1"
  pgrep -f "$process" | head -n1
}

# Wait for port to be available
wait_for_port() {
  local port="$1"
  local max_attempts="${2:-30}"
  local attempt=0
  
  log_info "Waiting for port $port to be available..."
  
  while ! nc -z localhost "$port" 2>/dev/null; do
    ((attempt++))
    if (( attempt > max_attempts )); then
      die "Timeout waiting for port $port"
    fi
    sleep 1
  done
  
  log_success "Port $port is available"
}

# Wait for service health
wait_for_service() {
  local service="$1"
  local max_attempts="${2:-30}"
  local attempt=0
  
  log_info "Waiting for $service to be healthy..."
  
  while ! is_container_running "$service"; do
    ((attempt++))
    if (( attempt > max_attempts )); then
      die "Timeout waiting for $service"
    fi
    sleep 1
  done
  
  log_success "$service is running"
}

# ============================================================================
# Output Functions
# ============================================================================

# Print header
print_header() {
  local text="$1"
  local width=80
  local text_width=${#text}
  local padding=$(( (width - text_width - 2) / 2 ))
  
  echo ""
  printf "${BLUE}"
  printf "%${padding}s" | tr ' ' '='
  printf " %s " "$text"
  printf "%$((width - text_width - padding - 2))s" | tr ' ' '='
  printf "${NC}\n"
  echo ""
}

# Print section
print_section() {
  local text="$1"
  echo ""
  echo -e "${CYAN}→ $text${NC}"
}

# Print divider
print_divider() {
  echo ""
  printf '%0.s─' {1..80}
  echo ""
  echo ""
}

# ============================================================================
# Validation Functions
# ============================================================================

# Validate required environment variables
require_env() {
  for var in "$@"; do
    if [[ -z "${!var:-}" ]]; then
      die "Required environment variable not set: $var"
    fi
  done
}

# Validate file exists
require_file() {
  for file in "$@"; do
    if [[ ! -f "$file" ]]; then
      die "Required file not found: $file"
    fi
  done
}

# Validate directory exists
require_dir() {
  for dir in "$@"; do
    if [[ ! -d "$dir" ]]; then
      die "Required directory not found: $dir"
    fi
  done
}

# ============================================================================
# Configuration Functions
# ============================================================================

# Load .env file if exists
load_env() {
  local env_file="${1:-.env}"
  if [[ -f "$env_file" ]]; then
    log_debug "Loading environment from $env_file"
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a
  fi
}

# Get config value with default
get_config() {
  local key="$1"
  local default="${2:-}"
  echo "${!key:-$default}"
}

# ============================================================================
# Utility Functions
# ============================================================================

# Retry command with backoff
retry() {
  local max_attempts=3
  local attempt=1
  local delay=1
  
  while true; do
    if "$@"; then
      return 0
    fi
    
    if (( attempt >= max_attempts )); then
      return 1
    fi
    
    ((attempt++))
    sleep "$delay"
    delay=$((delay * 2))
  done
}

# Run command and capture output
run_cmd() {
  local cmd="$*"
  log_debug "Running: $cmd"
  if output=$($cmd 2>&1); then
    echo "$output"
    return 0
  else
    log_error "Command failed: $cmd"
    echo "$output"
    return 1
  fi
}

# Check OS
is_mac() {
  [[ "$OSTYPE" == "darwin"* ]]
}

is_linux() {
  [[ "$OSTYPE" == "linux-gnu"* ]]
}

# ============================================================================
# Export for sourcing
# ============================================================================

export -f log_level log_debug log_info log_success log_warn log_error
export -f die command_exists require_commands
export -f get_runtime is_container_running image_exists get_container_id
export -f mkdir_p touch_file safe_rm
export -f is_git_repo git_branch git_status
export -f get_pid wait_for_port wait_for_service
export -f print_header print_section print_divider
export -f require_env require_file require_dir
export -f load_env get_config
export -f retry run_cmd is_mac is_linux

export SCRIPT_DIR PROJECT_ROOT APPS_DIR PODMAN_DIR DOC_DIR RUNTIME
