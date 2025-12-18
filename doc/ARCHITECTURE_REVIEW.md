# Architecture Review: Vault Platform Full

**Date**: December 17, 2025  
**Project**: Obsidian MCP Platform (vault-platform-full)  
**Scope**: Complete monorepo architecture analysis

---

## Executive Summary

The project is a **multi-language, multi-paradigm monorepo** with significant architectural inconsistencies that create complexity and maintenance burden. While the vision is ambitious (deterministic workflows for Obsidian), the implementation mixes contradictory patterns, module systems, and language choices.

**Overall Status**: 🟡 **FUNCTIONAL BUT FRAGILE**

---

## 🚨 CRITICAL ARCHITECTURE ISSUES

### 1. **Module System Chaos** ⚠️ HIGHEST PRIORITY

#### Details

The workspace uses **THREE DIFFERENT MODULE SYSTEMS** within TypeScript/JavaScript:

```text
├── apps/auth/           → type: "module" (ESM)
├── apps/mcp/            → type: "commonjs" (CJS)
├── apps/llm-adapter/    → JavaScript (Node's default)
└── apps/vaulty/         → Python (completely different runtime)
```

#### Evidence

- **auth**: `"type": "module"` with import/export syntax
- **mcp**: `"type": "commonjs"` with explicit `.js` extensions in imports
- **llm-adapter**: Plain JavaScript, no type declaration
- **vaulty**: Python shell scripts

#### Why This Is Bad

1. **Inter-app communication complexity**: Calling CJS from ESM (or vice versa) requires wrapper modules
2. **Inconsistent patterns**: Each app has different import syntax
3. **Tooling confusion**: Build tools (esbuild, tsc) need special configuration
4. **Runtime errors**: Module resolution can fail silently or at runtime

#### Example Problem

```typescript
// In mcp/src/services/journal.service.ts (CJS)
import { VAULT_ROOT } from '../utils/vault/index.js'; // ← Must use .js extension

// In auth/src (ESM)
import { handler } from './middleware/auth.js'; // ← Can use .js extension
```

#### Evidence: [apps/mcp/package.json](apps/mcp/package.json#L5) vs [apps/auth/package.json](apps/auth/package.json#L4)

---

### 2. **Monorepo Workspace Isolation Broken** ⚠️ HIGH PRIORITY

#### Problem

The root `pnpm-workspace.yaml` defines workspaces, but **app-level tests are excluded from root**:

```typescript
// vitest.config.ts excludes:
exclude: [
  'apps/auth/**',
  'apps/mcp/**',
  'apps/llm-adapter/**',
  'apps/vaulty/**',  // ← Excluded!
],
```

But `package.json` script claims:

```json
"test": "vitest run",           // Only runs root tests
"test:all": "pnpm -w -r run test --if-present"  // Workaround needed
```

#### Why This Is Bad

1. **Hidden tests**: `pnpm test` doesn't run vaulty tests
2. **False confidence**: Coverage/test reports incomplete
3. **Inconsistent commands**: Different commands do different things
4. **CI Risk**: CI might pass but individual apps might fail

#### Evidence: [vitest.config.ts](vitest.config.ts#L17-L26) and [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md#L67-L78)

---

### 3. **Language Mismatch: Node.js + Python at Core** ⚠️ HIGH PRIORITY

#### Problem

The project mixes **three runtime environments**:

```
├── TypeScript/Node.js   → MCP server, Auth, LLM adapter
├── Python               → Vaulty (git sync, seed management)
└── Bash/Shell          → Orchestration scripts
```

#### Evidence

- **vaulty/Dockerfile**: `FROM alpine:3.20` → Python runtime

  ```dockerfile
  RUN apk add --no-cache git ca-certificates inotify-tools python3
  COPY src/scripts/seed.py /usr/local/bin/
  COPY src/scripts/healthcheck.py /usr/local/bin/
  ```

- **vaulty/requirements.txt**: Empty (no dependencies), suggests incomplete setup

#### Why This Is Bad

1. **Deployment complexity**: Multiple runtimes in containers
2. **Testing complexity**: Can't use unified test framework
3. **Knowledge fragmentation**: Teams need to know Node.js AND Python
4. **Monitoring difficulty**: Different logging patterns, error formats

#### Evidence: [apps/vaulty/Dockerfile](apps/vaulty/Dockerfile#L1) and [apps/vaulty/requirements.txt](apps/vaulty/requirements.txt)

---

### 4. **Docker Build Context Issues** ⚠️ MEDIUM PRIORITY

#### Problem

Both Dockerfiles assume root workspace context but copy files incorrectly:

```dockerfile
# mcp/Dockerfile (LINE 12)
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ./
COPY package.json ./apps/mcp/package.json

# This assumes root context but paths don't align with typical Docker builds
```

#### Why This Is Bad

1. **Context mismatch**: Docker build from `apps/mcp/` vs root changes file locations
2. **CI complexity**: Build scripts need special handling
3. **Non-portable**: Can't build individual containers easily

#### Evidence: [apps/mcp/Dockerfile](apps/mcp/Dockerfile#L8-L11)

---

### 5. **Package Manager Inconsistency** ⚠️ MEDIUM PRIORITY

#### Problem

Workspace uses **pnpm** but individual apps define different behaviors:

```json
// Root
"packageManager": "pnpm@10.20.0"

// apps/llm-adapter
"packageManager": "pnpm@10.20.0"
```

But `llm-adapter/package.json` has **NO DEPENDENCIES**:

```json
{
  "name": "llm-adapter-prototype",
  "devDependencies": {
    "vitest": "^4.0.15",
    "typescript": "^5.4.0"
  }
}
```

This is called a "prototype" in comments. **Is this production-ready?**

#### Evidence: [apps/llm-adapter/package.json](apps/llm-adapter/package.json#L1-L6)

---

### 6. **Inconsistent TypeScript Configuration** ⚠️ MEDIUM PRIORITY

#### Problem

Base `tsconfig.base.json` is minimal:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node"
    // ... minimal config
  }
}
```

But **each app has its own `tsconfig.json`** with different settings:

- **auth**: Stricter configuration
- **mcp**: Using CommonJS
- **vaulty**: Uses Python (no TypeScript)

#### Why This Is Bad

1. **Type safety differs by app**: One app might have stricter typing than another
2. **Build inconsistency**: Different modules might target different outputs
3. **Maintenance burden**: Changes to base config require updating 3+ files

#### Evidence: [tsconfig.base.json](tsconfig.base.json#L1-L10) and individual app configs

---

### 7. **Script Architecture is Fragile** ⚠️ MEDIUM PRIORITY

#### Problem

Complex bash scripts manage deployment, but they're hard to maintain:

```bash
# podman-compose.sh is 218 lines
# run-all.sh, restart-all.sh, etc. are scattered across multiple directories
# No clear error handling or logging
```

#### Evidence

- [podman/podman-compose.sh](podman/podman-compose.sh#L1-L80)
- Multiple similar scripts: `run-vault.sh`, `run-mcp.sh`, `run-all.sh`

#### Why This Is Bad

1. **Duplication**: Logic repeated across scripts
2. **Maintenance**: Hard to track which script does what
3. **Error handling**: Missing error propagation
4. **Testability**: Bash scripts hard to test (though some test coverage exists)

---

### 8. **Environment Variable Management Lacks Structure** ⚠️ LOW-MEDIUM PRIORITY

#### Problem

Environment setup scattered across:

1. **Root `.env`** (not committed)
2. **App-level `.env`** (apps/vaulty/.env, apps/mcp/.env)
3. **Dockerfile ENV directives** (hardcoded values)
4. **Podman scripts** (runtime overrides)

Example from [podman-compose.sh](podman/podman-compose.sh#L25-L40):

```bash
load_env_files() {
  local root_env="$REPO_ROOT/.env"
  if [ -f "$root_env" ]; then
    set -o allexport
    source "$root_env"
    set +o allexport
  fi
  # Load app-level .env files so overrides are respected
  for app in vaulty mcp; do
    local app_env="$REPO_ROOT/apps/$app/.env"
    # ...
  done
}
```

#### Why This Is Bad

1. **Precedence unclear**: Which `.env` takes priority? Order matters
2. **CI/CD risk**: Environment variables might not be set correctly in deployment
3. **Secret management**: Potential for credentials in `.env` files

---

## 🔴 STRUCTURAL ANTI-PATTERNS

### 9. **Incomplete App: llm-adapter** ⚠️ DESIGN ISSUE

The LLM adapter is a "minimal prototype" with:

- ✅ Plain JavaScript (no TypeScript)
- ❌ No production dependencies
- ❌ Described as "prototype"
- ❌ Only ~94 lines

```javascript
// index.js - entire file is this simple
const http = require('http');
const { URL } = require('url');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
// ... minimal HTTP server
```

#### Evidence: [apps/llm-adapter/index.js](apps/llm-adapter/index.js#L1-L50)

**Question**: Is this meant to be placeholder? Production-ready? Needs clarification.

---

### 10. **Python App (vaulty) Lacks TypeScript Integration** ⚠️ DESIGN ISSUE

Vaulty is a complete Python application in a TypeScript monorepo:

```
apps/vaulty/
├── src/
│   ├── git-sync.sh
│   ├── vault-init.sh
│   ├── scripts/
│   │   ├── seed.py
│   │   ├── healthcheck.py
│   │   └── ...
│   ├── tests/
│   └── ...
├── requirements.txt  (empty!)
├── Dockerfile       (Alpine + Python)
└── restart-vaulty.sh
```

#### Why This Is Bad

1. **Type safety lost**: Python has no TypeScript types
2. **Shared types**: Can't share Vault interface definitions across languages
3. **Testing**: Can't use unified test framework
4. **IDE support**: Different tooling needed

**Decision needed**: Keep as Python sidecar, or convert to TypeScript?

---

### 11. **Root-Level Test File Isolation Incomplete** ⚠️ TESTING ISSUE

Root `__tests__/` has subdirectories but exclusions suggest this is WIP:

```typescript
// vitest.config.ts
exclude: [
  'apps/mcp/src/__tests__/services/**',  // ← Only MCP services excluded
  'apps/auth/**',                        // ← Entire app excluded
],
```

And there's a special test file:

```
__tests__/
├── monorepo-integration.test.ts
├── podman/podman-scripts.test.ts
├── script/root-scripts.test.ts
└── vaulty/vaulty-*.test.ts
```

But vaulty tests can't run (it's Python). This is contradictory.

#### Evidence: [vitest.config.ts](vitest.config.ts) and [**tests**/](../__tests__)

---

### 12. **Monorepo Missing Shared Library** ⚠️ ARCHITECTURE ISSUE

There's **no `packages/` or `libs/` folder** for shared code.

Common patterns across apps:

- `VAULT_ROOT` constant definition (repeated)
- JSON/YAML parsing (repeated)
- Error handling (repeated)
- Type definitions (duplicated?)

This should be extracted to a shared package:

```
packages/
├── vault-types/     (Shared interfaces)
├── vault-utils/     (VAULT_ROOT, path utilities)
└── vault-errors/    (Error classes)
```

---

## 🟡 DESIGN CONCERNS

### 13. **Unclear Service Dependencies**

The MCP server has many services. Dependency order is unclear:

```
apps/mcp/src/services/
├── pipeline.service.ts
├── journal.service.ts
├── task-graph.service.ts
├── session-planner.service.ts
├── autolink.service.ts
├── diff-preview.service.ts
├── template-discovery.service.ts
├── filesystem.service.ts
└── structure-schema.service.ts
```

**Are these truly independent?** Or does one depend on another? Circular dependencies risk.

---

### 14. **MCP Tools Organization Unclear**

Files exist but need review:

```
apps/mcp/src/
├── mcp/
│   ├── factory.ts
│   └── obsidian/
│       ├── index.ts
│       └── tools/     (actual tool definitions?)
├── tools/             (also a tools folder?)
└── ...
```

**Two `tools` folders?** This is confusing.

---

## ✅ WHAT'S ACTUALLY WORKING WELL

1. **Test Coverage**: 104+ tests with Vitest
2. **Documentation**: Comprehensive markdown docs in `/doc`
3. **Health Checks**: Container health monitoring (vaulty)
4. **CI/CD**: Scripts exist for testing and building
5. **Containerization**: Dockerfile strategy is reasonable (despite context issues)
6. **Monorepo Foundation**: pnpm workspaces is correct choice

---

## 🎯 RECOMMENDATIONS (Priority Order)

### 1. **URGENT: Unify Module System**

**Action**: Choose ONE module system for all Node/TypeScript code:

```bash
# Option A: Go all ESM (recommended for Node 18+)
# Option B: Go all CommonJS (simpler migration)
```

**Estimate**: 4-8 hours  
**Impact**: HIGH - fixes import/export chaos  
**Status**: Not started

---

### 2. **HIGH: Create Shared Library**

**Action**: Extract common code:

```bash
mkdir packages/vault-common
mkdir packages/vault-types
mkdir packages/vault-errors
```

Move shared utilities and types here.

**Estimate**: 6-10 hours  
**Impact**: MEDIUM - reduces duplication  
**Status**: Not started

---

### 3. **HIGH: Fix Test Architecture**

**Action**:

- Include vaulty Python tests in CI (or remove from test configs)
- Use single test command for all apps
- Document test matrix

**Estimate**: 2-3 hours  
**Impact**: MEDIUM - clarity and reliability  
**Status**: Partially done

---

### 4. **MEDIUM: Decide on vaulty**

**Action**: Answer one of:

- Keep as Python sidecar (then document clearly)
- Convert to TypeScript (then remove Python)
- Replace with Node.js implementation (then remove Python)

**Estimate**: 2-40 hours (depends on decision)  
**Impact**: HIGH - affects entire architecture  
**Status**: Unclear/decision pending

---

### 5. **MEDIUM: Consolidate Scripts**

**Action**:

- Move all scripts to `/scripts` folder
- Create single entry point (`scripts/manage-containers.sh`)
- Document script dependencies

**Estimate**: 3-4 hours  
**Impact**: LOW - but improves maintainability  
**Status**: Not started

---

### 6. **MEDIUM: Fix Docker Build Context**

**Action**: Use proper Docker build patterns:

```bash
# Instead of complex relative paths
COPY ./package.json ./
COPY ./pnpm-lock.yaml ./
```

**Estimate**: 1-2 hours  
**Impact**: LOW - but enables better CI/CD  
**Status**: Not started

---

### 7. **LOW: Document Environment Strategy**

**Action**: Create [docs/ENVIRONMENT_STRATEGY.md](docs/ENVIRONMENT_STRATEGY.md)

Explain:

- Which `.env` files are which
- Override precedence
- Required vs optional variables

**Estimate**: 1 hour  
**Impact**: LOW - improves developer experience  
**Status**: Not started

---

## 📊 RISK MATRIX

| Issue                  | Severity | Likelihood | Impact                         |
| ---------------------- | -------- | ---------- | ------------------------------ |
| Module system chaos    | HIGH     | HIGH       | Breaks inter-app communication |
| Test architecture      | HIGH     | MEDIUM     | False negatives in CI          |
| Python/Node mismatch   | MEDIUM   | HIGH       | Complex deployment             |
| Docker context         | MEDIUM   | MEDIUM     | CI/CD failures                 |
| Missing shared lib     | MEDIUM   | MEDIUM     | Code duplication               |
| Script fragility       | LOW      | HIGH       | Operational errors             |
| Environment management | LOW      | MEDIUM     | Configuration errors           |

---

## 📋 NEXT STEPS

1. **Week 1**: Fix module system + create shared library
2. **Week 2**: Decide on vaulty (Python vs Node) + implement decision
3. **Week 3**: Consolidate scripts + fix Docker
4. **Week 4**: Complete test unification + documentation

---

## Questions for the Team

1. **Is llm-adapter production-ready or placeholder?** (Line unclear)
2. **Should vaulty stay as Python or convert to Node.js?**
3. **Why are module systems mixed?** (Historical? Intentional?)
4. **What's the deployment target?** (Affects container strategy)
5. **Should shared utilities be extracted?**

---

## Files Mentioned (Quick Reference)

- Module mismatch: [apps/mcp/package.json](apps/mcp/package.json#L5) vs [apps/auth/package.json](apps/auth/package.json#L4)
- Test exclusions: [vitest.config.ts](vitest.config.ts#L17-L26)
- vaulty Docker: [apps/vaulty/Dockerfile](apps/vaulty/Dockerfile)
- MCP Docker: [apps/mcp/Dockerfile](apps/mcp/Dockerfile)
- Environment loading: [podman/podman-compose.sh](podman/podman-compose.sh#L25)
- llm-adapter: [apps/llm-adapter/index.js](apps/llm-adapter/index.js)

---

**End of Review**  
Generated: December 17, 2025
