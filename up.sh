#!/usr/bin/env bash

# Vault Platform Quick Start
# Initialize and start all services in one command
# 
# Usage: ./up.sh [vault-path]
# Example: ./up.sh ~/my-vault

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Vault Platform - Quick Start${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo

# Step 1: Initialize infrastructure
echo -e "${GREEN}[1/2]${NC} Initializing infrastructure..."
if [[ -n "${1:-}" ]]; then
  bash "$SCRIPT_DIR/scripts/vault" infrastructure init "$1"
else
  bash "$SCRIPT_DIR/scripts/vault" infrastructure init
fi

echo
echo -e "${GREEN}[2/2]${NC} Starting services..."
bash "$SCRIPT_DIR/scripts/vault" start

echo
echo -e "${GREEN}✓${NC} Platform is up and running!"
echo -e "${YELLOW}ℹ${NC} Access MCP server at: http://localhost:4000"
echo -e "${YELLOW}ℹ${NC} View logs: ${BLUE}./scripts/vault logs${NC}"
echo -e "${YELLOW}ℹ${NC} Check status: ${BLUE}./scripts/vault status${NC}"
echo
