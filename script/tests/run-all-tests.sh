#!/usr/bin/env bash
# DEPRECATED: Use 'pnpm test' instead
# This script is maintained for backward compatibility only.
# All tests have been migrated to Vitest.

set -euo pipefail

TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_ROOT="$(cd "$TEST_DIR/.." && pwd)"
REPO_ROOT="$(cd "$SCRIPT_ROOT/.." && pwd)"

# Source common functions
source "$SCRIPT_ROOT/common.sh" 2>/dev/null || {
  # Fallback info function if common.sh not found
  info() { echo "[INFO] $*"; }
}

info "⚠️  DEPRECATED: This bash test runner is deprecated."
info "Please use: pnpm test (from repository root)"
info ""
info "Running Vitest instead..."
info ""

# Run vitest from repo root
cd "$REPO_ROOT"
pnpm test
