# Phase 2: Shared Library Creation - Planning Guide

**Date**: December 18, 2025  
**Estimated Duration**: 6-10 hours  
**Priority**: HIGH  
**Depends On**: Phase 1 (✅ Complete)

---

## Objective

Extract common code patterns across apps into a unified `packages/` directory to eliminate duplication and establish clean module boundaries.

---

## Phase 2 Scope

### What Will Be Built

```
packages/
├── vault-common/          # Shared utilities
│   ├── src/
│   │   ├── vault/        # VAULT_ROOT, path utilities
│   │   ├── errors/       # Custom error classes
│   │   ├── config/       # Common config loading
│   │   └── utils/        # Helper functions
│   └── package.json
├── vault-types/           # Shared TypeScript interfaces
│   ├── src/
│   │   ├── vault.ts      # Vault types
│   │   ├── operations.ts # Operation types
│   │   ├── task.ts       # Task/workflow types
│   │   └── api.ts        # API response types
│   └── package.json
└── vault-errors/          # Custom error classes
    ├── src/
    │   ├── VaultError.ts
    │   ├── ValidationError.ts
    │   └── index.ts
    └── package.json
```

---

## Task Breakdown

### Task 1: Create vault-common Package (2-3 hours)

**Objectives**:

- Extract VAULT_ROOT and path utilities
- Create centralized configuration loading
- Move common helper functions

**Files to Extract**:

From [apps/mcp/src/utils/vault/vault.utils.ts](../apps/mcp/src/utils/vault/vault.utils.ts):

```typescript
export const VAULT_ROOT =
  process.env.VAULT_PATH ||
  path.join(process.env.HOME || '/root', '.obsidian', 'vault');
```

From [apps/vaulty/src/vault-init.sh](../apps/vaulty/src/vault-init.sh):

```bash
VAULT_PATH="${VAULT_PATH:-$HOME/.obsidian/vault}"
```

**Create**:

```
packages/vault-common/src/vault.ts
packages/vault-common/src/config.ts
packages/vault-common/src/logger.ts
```

**Usage After**:

```typescript
import { VAULT_ROOT, loadConfig } from '@vault/common';
```

---

### Task 2: Create vault-types Package (1.5-2 hours)

**Objectives**:

- Centralize TypeScript interfaces
- Enable shared type definitions across apps
- Document API contracts

**Types to Extract**:

From [apps/mcp/src/types/](../apps/mcp/src/types/):

- Operation types
- Task/workflow types
- Journal entry types
- Session planner types

**Create**:

```typescript
// packages/vault-types/src/vault.ts
export interface VaultFile {
  path: string;
  content: string;
  frontmatter?: Record<string, any>;
}

export interface VaultConfig {
  rootPath: string;
  syncEnabled: boolean;
  autoCommit: boolean;
}

// packages/vault-types/src/operations.ts
export interface Operation {
  id: string;
  type: 'read' | 'write' | 'delete' | 'move';
  path: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
}

// packages/vault-types/src/task.ts
export interface Task {
  id: string;
  name: string;
  dependencies: string[];
  status: 'queued' | 'running' | 'completed' | 'failed';
}
```

**Usage After**:

```typescript
import { VaultFile, Operation, Task } from '@vault/types';
```

---

### Task 3: Create vault-errors Package (1-1.5 hours)

**Objectives**:

- Establish error hierarchy
- Consistent error handling across apps

**Create**:

```typescript
// packages/vault-errors/src/VaultError.ts
export class VaultError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'VaultError';
  }
}

export class ValidationError extends VaultError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends VaultError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}
```

**Usage After**:

```typescript
import { VaultError, ValidationError } from '@vault/errors';
```

---

### Task 4: Update Workspace Configuration (1 hour)

**Files to Update**:

1. **pnpm-workspace.yaml**

   ```yaml
   packages:
     - 'apps/*'
     - 'packages/*'
   ```

2. **tsconfig.base.json** - Add path aliases

   ```json
   "paths": {
     "@vault/common": ["packages/vault-common/src"],
     "@vault/types": ["packages/vault-types/src"],
     "@vault/errors": ["packages/vault-errors/src"]
   }
   ```

3. **Each app's tsconfig.json** - Inherit paths from base

---

### Task 5: Update App Dependencies (1-2 hours)

**For each app**:

```bash
# apps/mcp/package.json
"dependencies": {
  "@vault/common": "workspace:*",
  "@vault/types": "workspace:*",
  "@vault/errors": "workspace:*"
}

# apps/auth/package.json
"dependencies": {
  "@vault/types": "workspace:*",
  "@vault/errors": "workspace:*"
}

# apps/llm-adapter/package.json
"dependencies": {
  "@vault/types": "workspace:*"
}
```

---

### Task 6: Refactor Apps to Use Shared Packages (2-3 hours)

**apps/mcp** - Remove duplicated utilities

```diff
- import { VAULT_ROOT } from '../utils/vault/vault.utils.js';
+ import { VAULT_ROOT } from '@vault/common/vault.js';

- import { VaultError } from '../errors/CustomError.js';
+ import { VaultError } from '@vault/errors';

- import type { Operation, Task } from '../types/index.js';
+ import type { Operation, Task } from '@vault/types';
```

**apps/auth** - Remove duplicated types

```diff
- import type { VaultConfig } from '../types/shared.js';
+ import type { VaultConfig } from '@vault/types';
```

**apps/llm-adapter** - Standardize on shared types

```diff
+ import type { VaultFile } from '@vault/types';
```

---

## Implementation Steps

### Step 1: Create Branch

```bash
git checkout -b feature/phase2-shared-libs
```

### Step 2: Create Package Structure

```bash
# Create directories
mkdir -p packages/vault-common/src
mkdir -p packages/vault-types/src
mkdir -p packages/vault-errors/src

# Create base files
touch packages/vault-common/{package.json,tsconfig.json}
touch packages/vault-types/{package.json,tsconfig.json}
touch packages/vault-errors/{package.json,tsconfig.json}
```

### Step 3: Create package.json Files

**Template**:

```json
{
  "name": "@vault/common",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "exports": {
    ".": "./dist/index.js",
    "./vault": "./dist/vault.js",
    "./config": "./dist/config.js"
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

### Step 4: Extract and Create Shared Code

For each package:

1. Identify reusable code from apps/
2. Copy to packages/{name}/src/
3. Update imports to use relative paths initially
4. Test with `pnpm build`

### Step 5: Update Workspace Config

Update pnpm-workspace.yaml, tsconfig.base.json, and app tsconfigs

### Step 6: Update App Dependencies

Add `@vault/{common,types,errors}` to each app that needs them

### Step 7: Refactor Apps

Replace local imports with package imports:

```bash
# Use find + sed or manual replacement
find apps/mcp/src -type f -name "*.ts" \
  -exec sed -i "s|from '../utils/vault/vault.utils.js'|from '@vault/common/vault.js'|g" {} \;
```

### Step 8: Verify

```bash
# Build all packages
pnpm -r build

# Type check
pnpm typecheck

# Run tests
pnpm test

# Build Docker images
pnpm build:mcp
podman build -t mcp -f apps/mcp/Dockerfile .
```

---

## Success Criteria

- [ ] All 3 packages (`vault-common`, `vault-types`, `vault-errors`) created
- [ ] TypeScript compilation passes for all packages
- [ ] All apps build successfully with new dependencies
- [ ] Tests pass (180+/189)
- [ ] Docker images build successfully
- [ ] Containers start without errors
- [ ] No remaining duplicate utility code across apps
- [ ] Path aliases work in all apps
- [ ] pnpm workspace recognizes new packages

---

## Rollback Plan

If issues arise:

```bash
# Revert changes
git reset --hard HEAD

# Or specific packages:
rm -rf packages/vault-{common,types,errors}

# Restore app imports
git checkout apps/*/src/**/*.ts
```

---

## Testing Strategy

### Unit Tests

```bash
# Test each package independently
pnpm -C packages/vault-common test
pnpm -C packages/vault-types test
pnpm -C packages/vault-errors test
```

### Integration Tests

```bash
# Test apps using new packages
pnpm test:all

# Docker integration
podman build -t mcp -f apps/mcp/Dockerfile .
podman run -it mcp
```

### Type Safety

```bash
# Ensure types resolve correctly
pnpm typecheck

# Check path alias resolution
npx tsc --showConfig -p tsconfig.json
```

---

## Dependencies & Blockers

**Depends On**:

- ✅ Phase 1: ESM Unification (COMPLETE)

**Blocks**:

- Phase 3: Script Consolidation (uses shared utilities)
- Phase 4: Test Architecture Unification

---

## Effort Estimate

| Task                    | Estimate     | Status          |
| ----------------------- | ------------ | --------------- |
| Create vault-common     | 2-3 hrs      | Not started     |
| Create vault-types      | 1.5-2 hrs    | Not started     |
| Create vault-errors     | 1-1.5 hrs    | Not started     |
| Update workspace config | 1 hr         | Not started     |
| Update dependencies     | 1-2 hrs      | Not started     |
| Refactor apps           | 2-3 hrs      | Not started     |
| Testing & validation    | 1 hr         | Not started     |
| **Total**               | **9-13 hrs** | **Not started** |

---

## Resources

- ARCHITECTURE_REVIEW.md - Context on why shared libs are needed
- PHASE1_COMPLETION_REPORT.md - What was completed in Phase 1
- pnpm documentation: https://pnpm.io/workspaces
- TypeScript path aliases: https://www.typescriptlang.org/tsconfig#paths

---

## Next Steps After Phase 2

1. **Phase 3**: Script Consolidation
   - Merge all scripts to `/scripts` directory
   - Create single entry point
   - Document script dependencies

2. **Phase 4**: Test Architecture Unification
   - Make all tests run under single command
   - Handle vaulty Python tests (include or exclude)
   - Consistent test reporting

3. **Phase 5**: Vaulty Decision & Implementation
   - Keep as Python, or convert to TypeScript/Node
   - Impacts entire deployment strategy

---

**Ready to begin Phase 2 after Phase 1 merge or when needed.**
