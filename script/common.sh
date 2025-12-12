#!/usr/bin/env bash
# Shared common helpers for repo restart scripts

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "[repo-restart] common.sh must be sourced" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

info() { echo "[repo-restart] $*"; }
warn() { echo "${YELLOW}[repo-restart] WARN: $*${NC}"; }
fail() { echo "${RED}[repo-restart] ERROR: $*${NC}" >&2; exit 1; }

ensure_command() { command -v "$1" >/dev/null 2>&1 || fail "$1 not found in PATH"; }

load_env_files() {
  # Load root .env first (optional), then app-level .env if present
  local root_env="$ROOT_DIR/.env"
  [ -f "$root_env" ] && source "$root_env"

  # If caller set SCRIPT_ROOT to app dir, try loading its .env
  if [ -n "${SCRIPT_ROOT:-}" ]; then
    local app_env="$SCRIPT_ROOT/.env"
    [ -f "$app_env" ] && source "$app_env"
  fi
}

resolve_path() {
  local path="$1"
  case "$path" in
    /*) echo "$path" ;;
    ~/*) echo "${HOME}/${path#~/}" ;;
    *) echo "${HOME}/$path" ;;
  esac
}
