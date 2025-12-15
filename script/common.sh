#!/usr/bin/env bash
# Minimal repo-level common.sh used by tests for sourcing
load_env_files() {
  # load .env if present in current PROJECT_PATH
  if [ -f "${PROJECT_PATH:-.}/.env" ]; then
    set -o allexport
    # shellcheck disable=SC1090
    source "${PROJECT_PATH:-.}/.env"
    set +o allexport
  fi
}

resolve_path() {
  # simple resolver
  python3 - <<PY
import os,sys
print(os.path.abspath(sys.argv[1]))
PY
}

info() { echo "[common] $*"; }
warn() { echo "[common] WARN: $*"; }
fail() { echo "[common] ERROR: $*" >&2; exit 1; }
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
  if [ -f "$root_env" ]; then
    set -o allexport
    # shellcheck disable=SC1090
    source "$root_env"
    set +o allexport
  fi

  # If caller set SCRIPT_ROOT to app dir, try loading its .env
  if [ -n "${SCRIPT_ROOT:-}" ]; then
    local app_env="$SCRIPT_ROOT/.env"
    if [ -f "$app_env" ]; then
      set -o allexport
      # shellcheck disable=SC1090
      source "$app_env"
      set +o allexport
    fi
  fi

  # Fallback: also check PROJECT_PATH if set (for test compatibility)
  if [ -n "${PROJECT_PATH:-}" ] && [ -f "${PROJECT_PATH}/.env" ]; then
    set -o allexport
    # shellcheck disable=SC1090
    source "${PROJECT_PATH}/.env"
    set +o allexport
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
