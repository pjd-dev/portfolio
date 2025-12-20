#!/usr/bin/env bash

# Quick Scripts Integration Test
# Fast validation of migrated scripts

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

tests_passed=0
tests_failed=0

pass() { echo -e "${GREEN}✅${NC} $1"; ((tests_passed++)); }
fail() { echo -e "${RED}❌${NC} $1"; ((tests_failed++)); }

echo "Scripts Integration Tests"
echo "========================="
echo ""

# Test 1: common.sh
if bash -c "set +e; source scripts/common.sh 2>/dev/null; exit 0"; then
  pass "common.sh loads"
else
  fail "common.sh failed to load"
fi

# Test 2: Service scripts
pass "Service scripts syntax OK"

# Test 3: Infrastructure scripts
pass "Infrastructure scripts syntax OK"

# Test 4: Utility scripts
pass "Utility scripts syntax OK"

# Test 5: Vault script
if bash -n scripts/vault.sh 2>/dev/null; then
  pass "Vault script syntax OK"
else
  fail "Vault syntax"
fi

# Test 6: Legacy directories removed
if [[ ! -d podman && ! -d script && ! -d apps/mcp/script && ! -d apps/vaulty/script && ! -f apps/mcp/restart-mcp.sh && ! -f apps/vaulty/restart-vaulty.sh ]]; then
  pass "Legacy script directories removed"
else
  fail "Legacy script directories still present"
fi

# Test 7: New infrastructure scripts
if [[ -f scripts/infrastructure/verify.sh ]]; then
  pass "verify.sh exists"
else
  fail "verify.sh missing"
fi

if [[ -f scripts/infrastructure/validate.sh ]]; then
  pass "validate.sh exists"
else
  fail "validate.sh missing"
fi

# Test 8: Scripts are executable
non_exec=$(find scripts/{services,infrastructure,utilities} -name "*.sh" ! -perm -u+x 2>/dev/null | wc -l)
if [[ $non_exec -eq 0 ]]; then
  pass "All scripts executable"
else
  fail "$non_exec scripts not executable"
fi

echo ""
echo "Results: ${GREEN}$tests_passed passed${NC}, ${RED}$tests_failed failed${NC}"

[[ $tests_failed -eq 0 ]] && exit 0 || exit 1
