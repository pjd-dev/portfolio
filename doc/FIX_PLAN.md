# Architecture Fix Plan — Vault Platform Full

**Created**: December 17, 2025  
**Total Estimated Time**: 40-60 hours  
**Priority Level**: Critical  
**Execution Strategy**: Phased (4 phases over 4 weeks)

---

## 📋 Executive Plan

This document provides step-by-step instructions to resolve all architectural issues identified in ARCHITECTURE_REVIEW.md.

**Key Principles:**

- ✅ Backward compatibility where possible
- ✅ Incremental changes (no "big bang" refactors)
- ✅ Comprehensive testing at each phase
- ✅ Clear rollback points

---

## PHASE 1: Module System Unification (Week 1)

**Duration**: 8-12 hours  
**Impact**: HIGH (fixes import chaos)  
**Risk**: MEDIUM (requires coordinated changes)

### Decision: Go All ESM (Recommended)

**Why ESM?**

- ✅ Node.js native standard
- ✅ Better tree-shaking
- ✅ Aligns with `@modelcontextprotocol/sdk`
- ✅ Future-proof
- ✅ auth already uses it

**Alternative**: All CommonJS (simpler migration for some, but outdated)

---

### Phase 1.1: Audit Current Module Usage

**Task 1.1.1: Document all imports by app**

```bash
# From workspace root
grep -r "^import\|^require\|^export" apps/*/src --include="*.ts" | \
  cut -d: -f1 | sort | uniq -c | sort -rn
```

Expected output shows:

- auth: mostly `import` statements
- mcp: mostly `require` or dynamic imports
- llm-adapter: `require()` statements
- vaulty: N/A (Python)

---

### Phase 1.2: Migrate MCP to ESM

**Task 1.2.1: Update mcp/package.json**

```json
// BEFORE
{
  "name": "obsidian-mcp",
  "type": "commonjs",          // ← REMOVE THIS
  "main": "dist/index.js",
  "scripts": {
    "build": "pnpm typecheck && node esbuild.config.mjs"
  }
}

// AFTER
{
  "name": "obsidian-mcp",
  "type": "module",            // ← CHANGE TO ESM
  "main": "dist/index.js",
  "exports": {
    ".": "./dist/index.js"
  },
  "scripts": {
    "build": "pnpm typecheck && node esbuild.config.mjs"
  }
}
```

**File**: [apps/mcp/package.json](apps/mcp/package.json)  
**Time**: 15 min

---

**Task 1.2.2: Update mcp/tsconfig.json**

```json
// apps/mcp/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext", // ← Ensure this (was probably commonjs)
    "target": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "bundler", // ← Better for ESM
    "strict": true,
    "resolveJsonModule": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**File**: [apps/mcp/tsconfig.json](apps/mcp/tsconfig.json)  
**Time**: 15 min

---

**Task 1.2.3: Fix mcp esbuild.config.mjs**

Check that esbuild is configured for ESM:

```javascript
// apps/mcp/esbuild.config.mjs
import * as esbuild from 'esbuild';

const config = {
  entryPoints: ['src/index.ts'],
  bundle: false,
  platform: 'node',
  target: 'es2022',
  format: 'esm', // ← ENSURE THIS
  outfile: 'dist/index.js',
  external: [
    '@modelcontextprotocol/sdk',
    '@supabase/supabase-js',
    // ... other externals
  ],
};

await esbuild.build(config);
```

**File**: [apps/mcp/esbuild.config.mjs](apps/mcp/esbuild.config.mjs)  
**Time**: 15 min

---

**Task 1.2.4: Remove .js extensions from relative imports in mcp/src**

```bash
# Search all mcp TypeScript files for imports with .js extension
grep -r "from ['\"]\.\.?/.*\.js['\"]" apps/mcp/src --include="*.ts"
```

For each match, remove the `.js` extension:

```typescript
// BEFORE (CJS style)
import { VAULT_ROOT } from '../utils/vault/index.js';
import { KnowledgeGraph } from '../core/graph.js';

// AFTER (ESM native)
import { VAULT_ROOT } from '../utils/vault/index';
import { KnowledgeGraph } from '../core/graph';
```

**Files to check**:

- apps/mcp/src/services/\*.service.ts (10+ files)
- apps/mcp/src/mcp/\*.ts
- apps/mcp/src/index.ts

**Time**: 1-2 hours (many files)

**Verification**:

```bash
cd apps/mcp
pnpm build      # Should complete without errors
```

---

### Phase 1.3: Ensure LLM Adapter is ESM Compatible

**Task 1.3.1: Update llm-adapter/package.json**

```json
// BEFORE
{
  "name": "llm-adapter-prototype",
  "description": "Minimal LLM Adapter prototype (no external deps)",
  "main": "index.js",
  // No type declaration
}

// AFTER
{
  "name": "llm-adapter-prototype",
  "type": "module",
  "description": "Minimal LLM Adapter prototype (no external deps)",
  "main": "dist/index.js",
  "exports": {
    ".": "./dist/index.js"
  },
  "scripts": {
    "start": "node dist/index.js",
    "build": "echo 'No build needed for llm-adapter'"
  }
}
```

**File**: [apps/llm-adapter/package.json](apps/llm-adapter/package.json)  
**Time**: 15 min

---

**Task 1.3.2: Convert llm-adapter/index.js to ESM**

```javascript
// BEFORE (CommonJS)
const http = require('http');
const { URL } = require('url');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// ... handlers ...

http
  .createServer((req, res) => {
    // ...
  })
  .listen(PORT);

module.exports = {
  /* ... */
};

// AFTER (ESM)
import http from 'http';
import { URL } from 'url';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// ... handlers ...

http
  .createServer((req, res) => {
    // ...
  })
  .listen(PORT);

// For ESM, use export default or named exports
export default {
  /* ... */
};
```

**File**: [apps/llm-adapter/index.js](apps/llm-adapter/index.js)  
**Rename to**: `apps/llm-adapter/src/index.ts` (TypeScript version)  
**Time**: 1 hour

---

### Phase 1.4: Update Auth to Confirm ESM

**Task 1.4.1: Verify auth/package.json is correct**

```json
// Should already be correct
{
  "name": "@vault/auth",
  "type": "module",
  "description": "Supabase authentication service",
  "main": "dist/index.js",
  "exports": {
    ".": "./dist/index.js"
  }
}
```

**File**: [apps/auth/package.json](apps/auth/package.json)  
**Verification**: Check that it has `"type": "module"`  
**Time**: 5 min

---

### Phase 1.5: Update Root TypeScript Config

**Task 1.5.1: Update tsconfig.base.json for ESM**

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext", // ← Ensure ESNext (for ESM)
    "moduleResolution": "bundler", // ← Better for ESM
    "lib": ["ES2022"],
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "strict": true,
    "esModuleInterop": false, // ← Disable for pure ESM
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "rootDir": "src",
    "outDir": "dist"
  }
}
```

**File**: [tsconfig.base.json](tsconfig.base.json)  
**Time**: 15 min

---

### Phase 1.6: Update Build Scripts

**Task 1.6.1: Update root build commands**

```json
// package.json
{
  "scripts": {
    "build": "pnpm run build:auth && pnpm run build:mcp && pnpm run build:llm",
    "build:auth": "pnpm --filter @vault/auth run build",
    "build:mcp": "pnpm --filter obsidian-mcp run build",
    "build:llm": "pnpm --filter llm-adapter-prototype run build",
    "typecheck": "pnpm -r run typecheck --if-present",
    "lint": "pnpm -r run lint --if-present"
  }
}
```

**File**: [package.json](package.json)  
**Time**: 15 min

---

### Phase 1.7: Test Module System Changes

**Task 1.7.1: Run type checking**

```bash
cd /Users/darry/Dev/darrybook/vault-platform-full
pnpm typecheck
```

Expected: No errors  
Time: 5 min

---

**Task 1.7.2: Build all apps**

```bash
pnpm build
```

Expected: All builds succeed  
Time: 10 min

---

**Task 1.7.3: Run tests**

```bash
pnpm test
pnpm test:all    # Includes app-level tests
```

Expected: All tests pass  
Time: 10 min

---

### Phase 1 Summary

**Changes**:

- ✅ 4 package.json updates
- ✅ 2 tsconfig updates
- ✅ ~200+ import statement fixes (remove .js extensions)
- ✅ esbuild config verification
- ✅ ESM conversion in llm-adapter

**Verification Checklist**:

- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` completes successfully
- [ ] `pnpm test` all pass
- [ ] No `"require"` statements in TypeScript files
- [ ] All relative imports use no .js extension

**Rollback**: Revert package.json `type` field and re-add .js extensions

---

## PHASE 2: Create Shared Library (Week 1-2)

**Duration**: 6-10 hours  
**Impact**: MEDIUM (reduces duplication)  
**Risk**: LOW (additive change)

### Phase 2.1: Create packages directory structure

**Task 2.1.1: Create vault-types package**

```bash
mkdir -p packages/vault-types/src
mkdir -p packages/vault-types/dist
```

Create [packages/vault-types/package.json](packages/vault-types/package.json):

```json
{
  "name": "@vault/types",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "exports": {
    ".": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/node": "^20.10.6",
    "typescript": "^5.4.0"
  }
}
```

**Time**: 15 min

---

**Task 2.1.2: Create vault-types/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

**Time**: 10 min

---

**Task 2.1.3: Create vault-utils package**

```bash
mkdir -p packages/vault-utils/src
mkdir -p packages/vault-utils/dist
```

Create [packages/vault-utils/package.json](packages/vault-utils/package.json):

```json
{
  "name": "@vault/utils",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "exports": {
    ".": "./dist/index.js",
    "./vault": "./dist/vault.js",
    "./errors": "./dist/errors.js",
    "./fs": "./dist/fs.js"
  },
  "dependencies": {
    "fs-extra": "^11.3.2"
  },
  "devDependencies": {
    "@types/fs-extra": "^11.0.4",
    "@types/node": "^20.10.6",
    "typescript": "^5.4.0"
  }
}
```

**Time**: 15 min

---

### Phase 2.2: Extract Common Code to Packages

**Task 2.2.1: Create @vault/types/src/vault.ts**

Extract all vault-related type definitions:

```typescript
// packages/vault-types/src/vault.ts

/** Core vault paths and constants */
export interface VaultConfig {
  vaultPath: string;
  opsDir: string;
  sessionsDir: string;
}

/** File mutation representation */
export interface FileMutation {
  path: string;
  type: 'create' | 'modify' | 'delete';
  before?: string;
  after?: string;
  timestamp: number;
}

/** Pipeline definition */
export interface VaultPipeline {
  id: string;
  name: string;
  steps: PipelineStep[];
  metadata?: Record<string, unknown>;
}

export interface PipelineStep {
  type: 'patch' | 'move' | 'autolink' | 'template' | 'metadata' | 'refactor';
  config: Record<string, unknown>;
}

/** Task graph types */
export interface TaskNode {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'blocked' | 'done';
  focusCost: number;
  dependencies: string[];
}

export interface TaskGraph {
  nodes: Map<string, TaskNode>;
  edges: Map<string, Set<string>>;
}

/** Session planner types */
export interface SessionConfig {
  id: string;
  durationMinutes: number;
  maxFocusCost: number;
  tasks: string[];
}

/** Journal entry */
export interface JournalEntry {
  id: string;
  timestamp: number;
  type: string;
  action: string;
  mutations: FileMutation[];
  metadata?: Record<string, unknown>;
  reversible: boolean;
}

export interface JournalState {
  entries: JournalEntry[];
}

/** Operation result */
export interface OperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}
```

**Time**: 1 hour

---

**Task 2.2.2: Create @vault/utils/src/vault.ts**

Extract VAULT_ROOT and related utilities:

```typescript
// packages/vault-utils/src/vault.ts
import path from 'node:path';
import fs from 'fs-extra';

/**
 * Get the vault root directory from environment
 * Defaults to VAULT_PATH env var, then process.cwd()
 */
export function getVaultRoot(): string {
  const envPath = process.env.VAULT_PATH;
  if (envPath) {
    if (!fs.existsSync(envPath)) {
      throw new Error(`VAULT_PATH not found: ${envPath}`);
    }
    return envPath;
  }
  return process.cwd();
}

/** Lazily initialized vault root (for backward compatibility) */
export const VAULT_ROOT = getVaultRoot();

/** Get config directory inside vault */
export function getVaultOpsDir(): string {
  return path.join(VAULT_ROOT, process.env.VAULT_OPS_DIR || '.vault-ops');
}

/** Get sessions directory inside vault */
export function getVaultSessionsDir(): string {
  return path.join(
    VAULT_ROOT,
    process.env.VAULT_SESSIONS_DIR || '.vault-sessions'
  );
}

/** Get path relative to vault root */
export function getVaultPath(...segments: string[]): string {
  return path.join(VAULT_ROOT, ...segments);
}

/** Ensure vault structure exists */
export async function ensureVaultStructure(): Promise<void> {
  const opsDir = getVaultOpsDir();
  const sessionsDir = getVaultSessionsDir();

  await fs.ensureDir(opsDir);
  await fs.ensureDir(sessionsDir);
}
```

**Time**: 45 min

---

**Task 2.2.3: Create @vault/utils/src/fs.ts**

Extract file system utilities:

```typescript
// packages/vault-utils/src/fs.ts
import fs from 'fs-extra';
import path from 'node:path';

/** Read a file as text */
export async function readFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read file: ${filePath}`, { cause: error });
  }
}

/** Write file with directory creation */
export async function writeFile(
  filePath: string,
  content: string
): Promise<void> {
  try {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write file: ${filePath}`, { cause: error });
  }
}

/** Delete file or directory */
export async function deleteFileOrDir(filePath: string): Promise<void> {
  try {
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
    }
  } catch (error) {
    throw new Error(`Failed to delete: ${filePath}`, { cause: error });
  }
}

/** List markdown files in directory */
export async function listMarkdownFiles(dir: string): Promise<string[]> {
  try {
    const files = await fs.readdir(dir, { recursive: true });
    return files.filter((f) => f.endsWith('.md')).map((f) => path.join(dir, f));
  } catch (error) {
    throw new Error(`Failed to list files in ${dir}`, { cause: error });
  }
}
```

**Time**: 45 min

---

**Task 2.2.4: Create @vault/utils/src/errors.ts**

Extract error classes:

```typescript
// packages/vault-utils/src/errors.ts

/** Base vault error */
export class VaultError extends Error {
  constructor(
    message: string,
    public code: string,
    cause?: unknown
  ) {
    super(message);
    this.name = 'VaultError';
    if (cause) this.cause = cause;
  }
}

/** File system errors */
export class VaultFileError extends VaultError {
  constructor(message: string, cause?: unknown) {
    super(message, 'FILE_ERROR', cause);
    this.name = 'VaultFileError';
  }
}

/** Pipeline errors */
export class VaultPipelineError extends VaultError {
  constructor(message: string, cause?: unknown) {
    super(message, 'PIPELINE_ERROR', cause);
    this.name = 'VaultPipelineError';
  }
}

/** Validation errors */
export class VaultValidationError extends VaultError {
  constructor(
    message: string,
    public fields: Record<string, string> = {},
    cause?: unknown
  ) {
    super(message, 'VALIDATION_ERROR', cause);
    this.name = 'VaultValidationError';
  }
}

/** Graph cycle detection */
export class VaultGraphCycleError extends VaultError {
  constructor(
    public cycle: string[],
    cause?: unknown
  ) {
    super(
      `Cycle detected in graph: ${cycle.join(' -> ')}`,
      'GRAPH_CYCLE',
      cause
    );
    this.name = 'VaultGraphCycleError';
  }
}
```

**Time**: 45 min

---

**Task 2.2.5: Create @vault/utils/src/index.ts**

```typescript
// packages/vault-utils/src/index.ts
export * from './vault';
export * from './fs';
export * from './errors';
```

**Time**: 5 min

---

**Task 2.2.6: Create @vault/types/src/index.ts**

```typescript
// packages/vault-types/src/index.ts
export * from './vault';
```

**Time**: 5 min

---

### Phase 2.3: Update Root pnpm-workspace.yaml

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'

onlyBuiltDependencies:
  - bcrypt
  - esbuild
```

**File**: [pnpm-workspace.yaml](pnpm-workspace.yaml)  
**Time**: 5 min

---

### Phase 2.4: Update package.json to include packages in scripts

```json
{
  "scripts": {
    "build": "pnpm run build:packages && pnpm run build:apps",
    "build:packages": "pnpm --filter './packages/*' run build",
    "build:apps": "pnpm --filter './apps/*' run build",
    "typecheck": "pnpm -r run typecheck --if-present"
  }
}
```

**File**: [package.json](package.json)  
**Time**: 10 min

---

### Phase 2.5: Update Apps to Use Shared Packages

**Task 2.5.1: Update mcp/package.json dependencies**

```json
{
  "dependencies": {
    "@vault/types": "workspace:*",
    "@vault/utils": "workspace:*",
    "@modelcontextprotocol/sdk": "^1.23.0"
    // ... keep existing
  }
}
```

**File**: [apps/mcp/package.json](apps/mcp/package.json)  
**Time**: 10 min

---

**Task 2.5.2: Update auth/package.json dependencies**

```json
{
  "dependencies": {
    "@vault/types": "workspace:*",
    "@vault/utils": "workspace:*",
    "@supabase/supabase-js": "^2.39.3"
    // ... keep existing
  }
}
```

**File**: [apps/auth/package.json](apps/auth/package.json)  
**Time**: 10 min

---

**Task 2.5.3: Replace VAULT_ROOT imports in mcp**

In all mcp service files, replace:

```typescript
// BEFORE
import { VAULT_ROOT } from '../utils/vault/index.js';

// AFTER
import { VAULT_ROOT, getVaultOpsDir } from '@vault/utils';
```

**Files to update**:

- apps/mcp/src/services/journal.service.ts
- apps/mcp/src/services/template-discovery.service.ts
- apps/mcp/src/services/autolink.service.ts
- apps/mcp/src/services/filesystem.service.ts
- apps/mcp/src/services/pipeline.service.ts
- apps/mcp/src/utils/vault/index.ts (can be deleted after)

**Time**: 1 hour

---

**Task 2.5.4: Add type imports in mcp**

```typescript
// At top of files that use types
import type {
  FileMutation,
  VaultPipeline,
  TaskNode,
  JournalEntry,
} from '@vault/types';
```

**Time**: 1-2 hours

---

### Phase 2.6: Install and Test

**Task 2.6.1: Install dependencies**

```bash
cd /Users/darry/Dev/darrybook/vault-platform-full
pnpm install
```

Expected: All packages resolved, no conflicts  
**Time**: 5 min

---

**Task 2.6.2: Build all packages and apps**

```bash
pnpm build
```

Expected: No errors  
**Time**: 10 min

---

**Task 2.6.3: Run tests**

```bash
pnpm test
```

Expected: All tests pass  
**Time**: 10 min

---

### Phase 2 Summary

**New Structure**:

```
packages/
├── vault-types/          (Shared type definitions)
├── vault-utils/          (Shared utilities & constants)
└── ...

apps/
├── auth/                 (Uses @vault/types, @vault/utils)
├── mcp/                  (Uses @vault/types, @vault/utils)
└── ...
```

**Verification Checklist**:

- [ ] `pnpm install` succeeds
- [ ] `pnpm build` succeeds
- [ ] `pnpm test` all pass
- [ ] No more duplicated type definitions
- [ ] VAULT_ROOT centralized in one place

---

## PHASE 3: Fix Test Architecture (Week 2)

**Duration**: 4-6 hours  
**Impact**: HIGH (clarity + reliability)  
**Risk**: LOW (improves existing setup)

### Phase 3.1: Include vaulty Tests

**Task 3.1.1: Understand vaulty test situation**

Vaulty is Python. We have 2 options:

**Option A**: Include Python tests in CI (requires pytest)

```bash
# Would need to add to CI pipeline
pytest apps/vaulty/tests/
```

**Option B**: Keep vaulty separate (acknowledge it's a sidecar)

- Document clearly that it's Python
- Don't try to unify its tests
- Have separate test commands

**Recommendation**: Option B (for now) - keeps TypeScript unified

---

**Task 3.1.2: Update vitest.config.ts to be clearer**

Current:

```typescript
exclude: [
  'apps/mcp/src/__tests__/services/**',
  'apps/auth/**',
  'apps/mcp/**',
  'apps/llm-adapter/**',
  'apps/vaulty/**',  // ← Unclear if intentional
],
```

Better (with comments):

```typescript
// vitest.config.ts
import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config.base';

process.env.VAULT_PATH = process.env.VAULT_PATH || '/tmp/test-vault';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      exclude: [
        '**/node_modules/**',
        '**/dist/**',

        // Individual app tests - run via `pnpm --filter <app> test`
        'apps/auth/**/*.test.ts',
        'apps/auth/**/*.spec.ts',
        'apps/mcp/**/*.test.ts',
        'apps/mcp/**/*.spec.ts',
        'apps/llm-adapter/**/*.test.ts',
        'apps/llm-adapter/**/*.spec.ts',

        // Vaulty is Python - uses separate test runner (pytest)
        // See: apps/vaulty/tests/
        'apps/vaulty/**',
      ],

      // Root-level integration tests only
      include: ['__tests__/**/*.test.ts', '__tests__/**/*.spec.ts'],
    },
  })
);
```

**File**: [vitest.config.ts](vitest.config.ts)  
**Time**: 15 min

---

### Phase 3.2: Create Unified Test Commands

**Task 3.2.1: Update root package.json test scripts**

```json
{
  "scripts": {
    "test": "vitest run __tests__",
    "test:watch": "vitest watch __tests__",
    "test:coverage": "vitest run --coverage __tests__",
    "test:ci": "vitest run --runInBand --coverage __tests__",

    // New: explicit unified command
    "test:unit": "vitest run",
    "test:unit:watch": "vitest watch",

    // New: all tests including apps
    "test:all": "pnpm test:unit && pnpm test:apps",
    "test:apps": "pnpm --filter './apps/*' run test --if-present",

    // New: vaulty-specific (Python)
    "test:vaulty": "cd apps/vaulty && pytest tests/ -v"
  }
}
```

**File**: [package.json](package.json)  
**Time**: 15 min

---

**Task 3.2.2: Create test documentation**

Create [docs/TESTING_ARCHITECTURE.md](docs/TESTING_ARCHITECTURE.md):

````markdown
# Testing Architecture

## Test Layers

### Root Integration Tests

Run: `pnpm test:unit`
Path: `__tests__/`
Framework: Vitest
Coverage: Monorepo integration, root-level utilities

### App Unit Tests

Run: `pnpm test:apps` or `pnpm --filter <app> test`
Framework: Vitest (Node apps), Pytest (vaulty)
Coverage: Individual application logic

### Python Tests (Vaulty)

Run: `pnpm test:vaulty` or `cd apps/vaulty && pytest`
Framework: Pytest
Coverage: Git sync, seed, health checks

## Running All Tests

```bash
# Root + apps (JavaScript/TypeScript)
pnpm test:all

# Full test suite including Python
pnpm test:unit && pnpm test:vaulty

# In CI
pnpm test:ci && pnpm test:apps
```
````

## Test Matrix

| Layer       | Framework | Command                           | Time |
| ----------- | --------- | --------------------------------- | ---- |
| Integration | Vitest    | `pnpm test`                       | 10s  |
| MCP         | Vitest    | `pnpm --filter obsidian-mcp test` | 20s  |
| Auth        | Vitest    | `pnpm --filter @vault/auth test`  | 10s  |
| Vaulty      | Pytest    | `cd apps/vaulty && pytest`        | 30s  |
| **Total**   | Mixed     | `pnpm test:all`                   | ~70s |

````

**Time**: 30 min

---

### Phase 3.3: Verify Test Execution

**Task 3.3.1: Run all test commands**

```bash
# Test root
pnpm test:unit
# Expected: All root tests pass

# Test individual apps
pnpm --filter '@vault/auth' test
pnpm --filter 'obsidian-mcp' test
pnpm --filter 'llm-adapter-prototype' test

# Test all apps together
pnpm test:apps

# Full suite
pnpm test:all
````

**Time**: 15 min

---

### Phase 3.4: Update TESTING_CHECKLIST.md

Update to reflect new structure:

```markdown
# Test Architecture — Unified Matrix

## Test Layers

### Root Tests (Vitest)

- Path: `__tests__/`
- Command: `pnpm test`
- Status: ✅ Runs root integration tests

### App Tests (Vitest + Pytest)

- Commands:
  - `pnpm test:apps` (all JavaScript/TypeScript apps)
  - `pnpm --filter <app> test` (individual app)
  - `pnpm test:vaulty` (Python app)
- Coverage: 100+ tests across all apps

### Full Suite

- Command: `pnpm test:all`
- Runs: Root + all apps (both JS and Python)
- CI: `pnpm test:ci && pnpm test:vaulty`
```

**File**: [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)  
**Time**: 15 min

---

### Phase 3 Summary

**Changes**:

- ✅ Clear test commands for each layer
- ✅ Documentation of test matrix
- ✅ Python tests acknowledged and separated
- ✅ No more ambiguity about what runs where

**Verification Checklist**:

- [ ] `pnpm test` runs root only (fast)
- [ ] `pnpm test:apps` runs JS/TS apps
- [ ] `pnpm test:all` runs everything
- [ ] All commands exit with correct codes
- [ ] Test documentation is current

---

## PHASE 4: Decide on Vaulty + Cleanup (Week 3-4)

**Duration**: 4-8 hours (decision-dependent)  
**Impact**: MEDIUM (architectural clarity)  
**Risk**: MEDIUM (depends on decision)

### Phase 4.1: Evaluate Vaulty Options

**Option A: Keep as Python Sidecar** ✅ RECOMMENDED

- Vaulty stays in Python
- Runs in separate container
- Minimal change needed
- Action: Document clearly

**Option B: Convert to Node.js**

- Rewrite sync logic in TypeScript
- Unified monorepo
- Better type safety
- Time: 20-40 hours
- Risk: Complex migration

**Option C: Replace with Minimal Node Version**

- Create simple git sync in Node
- Drop Python entirely
- Time: 10-15 hours
- Risk: Feature parity loss

**Recommendation**: Option A (keep Python sidecar)

- Already works
- No tech debt
- Can migrate later
- Document decision in ADR

---

### Phase 4.2: Document Architectural Decision

Create [docs/ADR-001-VAULTY-PYTHON.md](docs/ADR-001-VAULTY-PYTHON.md):

```markdown
# ADR-001: Vaulty as Python Sidecar

## Context

Vault platform is a Node.js/TypeScript monorepo. Vaulty (git sync + seeding) is Python.

## Options Considered

1. Keep Python (current) - Low effort, isolated
2. Convert to Node.js - High effort, unified
3. Replace with minimal Node.js - Medium effort, limited features

## Decision

**Option 1: Keep as Python Sidecar**

## Rationale

- Vaulty works reliably in current form
- Python is excellent for file I/O and git operations
- Separate container keeps concerns isolated
- Can unify later without rewriting current logic

## Consequences

- Monorepo remains multi-language
- Testing requires two frameworks (Vitest + Pytest)
- Deployment uses two runtimes
- Documentation must be clear about boundary

## Alternatives in Future

- Can convert to Node.js if monorepo consolidation is priority
- Can replace with simpler implementation if features aren't needed
```

**Time**: 20 min

---

### Phase 4.3: Create Vaulty Integration Guide

Create [docs/VAULTY_INTEGRATION.md](docs/VAULTY_INTEGRATION.md):

```markdown
# Vaulty Integration Guide

## What is Vaulty?

Vaulty is a **Python-based sidecar service** that provides:

- Git-backed vault storage
- Automatic seeding from git templates
- Real-time or interval-based sync
- Health monitoring

## Why Python?

- Native file I/O and directory watching (inotify)
- Git integration via subprocess (reliable)
- Script efficiency for CI/CD tasks
- Proven model for infrastructure tools (Ansible, etc.)

## Architecture
```

┌─────────────────────────────────────┐
│ Vault Platform (Node.js/TypeScript) │
├─────────────────────────────────────┤
│ MCP Server (Port 4000) │
│ Auth Service (Port 3001) │
│ LLM Adapter (Port 3000) │
└─────────────────────────────────────┘
↑
│ HTTP API
↓
┌─────────────────────────────────────┐
│ Vaulty Service (Python) │
├─────────────────────────────────────┤
│ Git Sync (inotify/interval) │
│ Seed Management │
│ Health Checks │
└─────────────────────────────────────┘
↑
│ Filesystem
↓
/vault (shared volume)

````

## Testing

Vaulty tests are separate from Node.js tests:

```bash
# Run Python tests
pnpm test:vaulty
# or directly
cd apps/vaulty && pytest tests/

# Run all tests (including Python)
pnpm test:all
````

## Future Considerations

If Node.js consolidation becomes a priority:

1. Convert critical git sync logic to Node.js
2. Rewrite seed management
3. Maintain Python version for compatibility
4. Gradually migrate users

Current plan: Keep Python as-is.

````

**Time**: 30 min

---

### Phase 4.4: Consolidate Scripts

**Task 4.4.1: Audit existing scripts**

```bash
find . -name "*.sh" -type f | grep -E "(script|podman)" | sort
````

Expected (current):

- No `./podman/` or `./script/` entries (removed)
- Results should list `./scripts/...` and app `src` scripts only

**Time**: 10 min

---

**Task 4.4.2: Create scripts/README.md**

````markdown
# Scripts Directory

## Orchestration

- `scripts/vault start|stop|restart|status|logs`

## Build

- `scripts/vault build`
- `scripts/vault rebuild`

## Infrastructure

- `scripts/vault init`
- `scripts/vault clean`
- `scripts/vault prune`

## Utilities

- `scripts/vault sync-vault`
- `scripts/vault verify-vault`
- `scripts/vault tunnel`

## Usage Examples

```bash
./scripts/vault start
./scripts/vault build
./scripts/vault verify-vault
```
````

````

**Time**: 15 min

---

### Phase 4.5: Document Environment Variables

Create [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md):

```markdown
# Environment Variables Reference

## Loading Order

1. Root `.env` (if exists)
2. App-level `.env` (apps/mcp/.env, apps/vaulty/.env)
3. Podman/container overrides

**Later in order = Higher precedence**

## Vault Configuration

| Var | Purpose | Default | Required |
|-----|---------|---------|----------|
| `VAULT_PATH` | Vault root directory | `/tmp/test-vault` | ✓ |
| `VAULT_OPS_DIR` | Operations journal dir | `.vault-ops` | ✗ |
| `VAULT_SESSIONS_DIR` | Sessions directory | `.vault-sessions` | ✗ |

## Sync Configuration (Vaulty)

| Var | Purpose | Default | Required |
|-----|---------|---------|----------|
| `SYNC_MODE` | `interval` or `realtime` | `interval` | ✗ |
| `GIT_SYNC_INTERVAL` | Sync frequency (seconds) | `30` | ✗ |
| `GIT_TOKEN` | GitHub/GitLab token | N/A | ✓ (if pushing) |
| `GIT_USERNAME` | Git user | `pjd-dev` | ✗ |
| `GIT_REPO` | Repository name | `obsidianVault.git` | ✓ |

## Service Configuration

### MCP Server
| Var | Purpose | Default |
|-----|---------|---------|
| `PORT` | HTTP port | `4000` |

### Auth Service
| Var | Purpose | Default |
|-----|---------|---------|
| `SUPABASE_URL` | Supabase project URL | N/A |
| `SUPABASE_KEY` | Supabase API key | N/A |

### LLM Adapter
| Var | Purpose | Default |
|-----|---------|---------|
| `PROVIDER_URL` | LLM provider endpoint | N/A |
| `MCP_AUTH_TYPE` | `none`, `apikey`, `bearer` | `none` |

## Example .env Files

### Root (`.env`)
```bash
VAULT_PATH=/mnt/vault
VAULT_OPS_DIR=.vault-ops

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# Git
GIT_TOKEN=ghp_xxxxxxxxxxxx
````

### Vaulty (`apps/vaulty/.env`)

```bash
SYNC_MODE=realtime
GIT_SYNC_INTERVAL=30
GIT_REPO=https://github.com/you/obsidian-vault.git
```

````

**File**: [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md)
**Time**: 30 min

---

### Phase 4.6: Fix Docker Build Context

**Task 4.6.1: Update mcp/Dockerfile**

Current (complex relative paths):
```dockerfile
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ./
COPY package.json ./apps/mcp/package.json
````

Better (cleaner context):

```dockerfile
# Build from workspace root with: docker build -f apps/mcp/Dockerfile -t mcp .
FROM node:22-alpine AS base
WORKDIR /app

RUN npm install -g pnpm

# Copy workspace manifests
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy app manifest
COPY apps/mcp/package.json ./apps/mcp/

# Install (with cache)
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
  pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm --filter ./apps/mcp run build

ENV PORT=4000
WORKDIR /app/apps/mcp

EXPOSE 4000
CMD ["pnpm", "start"]
```

Add comment:

```dockerfile
# Build from workspace root:
# docker build -f apps/mcp/Dockerfile -t mcp-server .
```

**File**: [apps/mcp/Dockerfile](apps/mcp/Dockerfile)  
**Time**: 15 min

---

**Task 4.6.2: Create Dockerfile.build script**

Create [scripts/build/docker-build.sh](scripts/build/docker-build.sh):

```bash
#!/bin/bash
# Build Docker images from workspace root

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

case "${1:-all}" in
  mcp)
    docker build -f apps/mcp/Dockerfile -t mcp-server:latest .
    ;;
  vaulty)
    docker build -f apps/vaulty/Dockerfile -t vaulty:latest ./apps/vaulty
    ;;
  all)
    docker build -f apps/mcp/Dockerfile -t mcp-server:latest .
    docker build -f apps/vaulty/Dockerfile -t vaulty:latest ./apps/vaulty
    ;;
  *)
    echo "Usage: $0 {mcp|vaulty|all}"
    exit 1
    ;;
esac

echo "Build complete!"
```

**File**: [scripts/build/docker-build.sh](scripts/build/docker-build.sh)  
**Time**: 15 min

---

### Phase 4 Summary

**Changes**:

- ✅ ADR documenting Vaulty decision
- ✅ Integration guide for Python service
- ✅ Environment variables documented
- ✅ Scripts consolidated and documented
- ✅ Docker build context clarified

**Verification Checklist**:

- [ ] Documentation is clear and current
- [ ] Environment variables documented
- [ ] Scripts have README
- [ ] Docker builds work from workspace root

---

## 🎯 FINAL VERIFICATION & ROLLOUT

### Pre-Rollout Checklist

**Phase 1 (Module System)**:

- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` completes successfully
- [ ] `pnpm test` passes
- [ ] No `.js` extensions in relative imports
- [ ] All apps are ESM

**Phase 2 (Shared Library)**:

- [ ] `packages/vault-types` builds
- [ ] `packages/vault-utils` builds
- [ ] All apps import from packages
- [ ] No duplicated type definitions
- [ ] `pnpm install` clean

**Phase 3 (Testing)**:

- [ ] `pnpm test:unit` works
- [ ] `pnpm test:apps` works
- [ ] `pnpm test:all` works
- [ ] Coverage reports include all apps
- [ ] Vaulty tests separate

**Phase 4 (Cleanup)**:

- [ ] Documentation complete
- [ ] Environment variables documented
- [ ] Docker builds work
- [ ] Scripts have README
- [ ] ADR documented

---

### Rollout Strategy

**Week 1**: Phase 1 (Module System) + Phase 2 (Shared Library)

- Target: Monday-Friday
- Effort: 2 people × 5 days = 10 person-days
- Risk: Medium (requires coordinated changes)
- Rollback: Revert package.json + imports

**Week 2**: Phase 3 (Testing) + Phase 4 (Cleanup/Docs)

- Target: Monday-Wednesday
- Effort: 1-2 people × 3 days = 3-6 person-days
- Risk: Low (additive changes)
- Rollback: Update config files

**Week 3**: Stabilization + Hotfixes

- Target: Thursday-Friday
- Effort: 1 person × 2 days = 2 person-days
- Risk: Low (monitoring phase)

---

### Deployment to Production

**Step 1**: Merge Phase 1+2 to `develop`

```bash
git checkout develop
git merge feature/esm-unification
git merge feature/shared-libraries
pnpm install
pnpm build
pnpm test
```

**Step 2**: Tag release

```bash
git tag -a v2.0.0 -m "ESM unification + shared libraries"
git push origin v2.0.0
```

**Step 3**: Deploy containers

```bash
./scripts/build/docker-build.sh all
docker push mcp-server:latest
docker push vaulty:latest
```

**Step 4**: Update documentation

- [ ] README.md (update architecture section)
- [ ] Contributing guide (update setup instructions)
- [ ] Release notes (document breaking changes)

---

### Post-Rollout Monitoring

**For 2 weeks after rollout, monitor**:

1. **Build times**: Compare before/after
2. **Test failures**: Any unexpected errors
3. **Performance**: Container startup times
4. **Developer experience**: Issues with new structure

**Metrics to Track**:

- Build success rate (target: 100%)
- Test execution time (target: < 2 min)
- Container startup (target: < 30s)
- Developer onboarding time (survey team)

---

## 📚 Summary of Files to Create

| File                               | Phase | Purpose           |
| ---------------------------------- | ----- | ----------------- |
| packages/vault-types/package.json  | 2     | Type definitions  |
| packages/vault-types/tsconfig.json | 2     | TS config         |
| packages/vault-types/src/vault.ts  | 2     | Vault types       |
| packages/vault-types/src/index.ts  | 2     | Export            |
| packages/vault-utils/package.json  | 2     | Utilities         |
| packages/vault-utils/tsconfig.json | 2     | TS config         |
| packages/vault-utils/src/vault.ts  | 2     | Vault utils       |
| packages/vault-utils/src/fs.ts     | 2     | FS utils          |
| packages/vault-utils/src/errors.ts | 2     | Error classes     |
| packages/vault-utils/src/index.ts  | 2     | Export            |
| docs/TESTING_ARCHITECTURE.md       | 3     | Testing guide     |
| docs/ADR-001-VAULTY-PYTHON.md      | 4     | Decision record   |
| docs/VAULTY_INTEGRATION.md         | 4     | Integration guide |
| docs/ENVIRONMENT_VARIABLES.md      | 4     | Env config        |
| scripts/docker-build.sh            | 4     | Build helper      |
| scripts/README.md                  | 4     | Script docs       |

---

## 🚀 Getting Started

### For Immediate Action

**Tomorrow morning:**

1. Review this plan with team
2. Assign responsibilities:
   - Person A: Module system (Phase 1)
   - Person B: Shared libraries (Phase 2)
   - Person C: Testing/docs (Phase 3-4)
3. Create feature branches
4. Start Phase 1

**Daily standups:**

- Report blockers
- Update progress
- Adjust timeline if needed

### Questions Before Starting?

Ask yourself/team:

1. Is ESM the right choice? (Recommended: yes)
2. Should vaulty stay Python? (Recommended: yes)
3. Timeline realistic? (Recommended: 4 weeks, can compress to 2)
4. Team bandwidth available? (Recommended: 2-3 people)

---

**End of Fix Plan**  
Generated: December 17, 2025  
Total Effort: 40-60 hours across 4 weeks
