#!/bin/bash
# Unified orchestration script - delegates to podman-compose.sh
# Usage: ./run-all.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

# Execute unified podman-compose script with cleanup enabled
exec bash "$SCRIPT_DIR/podman-compose.sh" "cleanup"