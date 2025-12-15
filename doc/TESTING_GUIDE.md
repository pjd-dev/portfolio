# Testing Guide - Vitest Unified Approach

This monorepo uses **Vitest** as the unified testing framework across all applications.

## Testing Structure

```
apps/
├── auth/              # Vitest configured
├── mcp/               # Vitest with service & script tests
├── llm-adapter/       # Vitest configured
└── vaulty/            # Ready for vitest tests
```

## Running Tests

### From Root Workspace

```bash
# Run all tests (root + all apps)
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# CI mode: sequential, with coverage
pnpm test:ci

# Run only app tests
pnpm test:all
```

### From Individual App Directories

```bash
cd apps/mcp
pnpm test              # Run tests once
pnpm test:watch       # Watch mode
pnpm test:coverage    # With coverage
```

## Test File Structure

All test files follow the pattern `**/__tests__/**/*.test.ts` or `**/*.test.ts`:

```
apps/mcp/
├── src/
│   ├── __tests__/
│   │   ├── scripts/
│   │   │   ├── prepare.test.ts
│   │   │   └── restart-all.test.ts
│   │   ├── services/
│   │   │   ├── task-graph.service.test.ts
│   │   │   └── session-planner.service.test.ts
│   │   └── setup.ts
│   ├── services/
│   ├── utils/
│   └── index.ts
├── vitest.config.ts   # App-specific config
└── package.json
```

## Configuration

### Root Configuration

- **File**: `vitest.config.base.ts`
- **Environment**: Node.js
- **Includes**: `**/__tests__/**/*.test.ts`, `**/__tests__/**/*.spec.ts`, `**/*.test.ts`, `**/*.spec.ts`

### App-Level Configuration

Each app extends the base config:

```typescript
// apps/[app]/vitest.config.ts
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  extends: path.resolve(__dirname, '../../vitest.config.base.ts'),
  test: {
    dir: 'src', // or '.' for apps without src/
  },
});
```

## Writing Tests

### Basic Test

```typescript
import { describe, it, expect } from 'vitest';

describe('MyComponent', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

### With Setup/Teardown

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ServiceTests', () => {
  let resource: any;

  beforeEach(() => {
    resource = setupResource();
  });

  afterEach(() => {
    cleanupResource(resource);
  });

  it('should work', () => {
    expect(resource).toBeDefined();
  });
});
```

## Test Categories

### 1. **Service Tests** (apps/mcp/src/**tests**/services/)

- `task-graph.service.test.ts` - Task graph operations (19 tests)
- `session-planner.service.test.ts` - Session planning logic (18 tests)

### 2. **Script Tests** (apps/mcp/src/**tests**/scripts/)

- `prepare.test.ts` - Environment variable handling (11 tests)
- `restart-all.test.ts` - Pod & log configuration (14 tests)

**Total**: 62 tests across the monorepo

## CI/CD Integration

The `test:ci` command is optimized for CI environments:

```bash
pnpm test:ci
# Runs sequentially with coverage reporting
# Useful for GitHub Actions, GitLab CI, etc.
```

## Coverage Reports

Generate coverage reports:

```bash
pnpm test:coverage
```

Coverage reports are generated in:

- `coverage/` directory (default)
- Viewable in browser as HTML report

## Migrating from Other Test Frameworks

### From Jest

Jest and Vitest have very similar APIs. Most Jest tests work directly:

- Replace `jest` imports with `vitest`
- Update jest config to vitest config

### From Bash/Shell Scripts

Vitest provides Node.js APIs for:

- File system operations (`fs` module)
- Environment variables (`process.env`)
- Temporary files (`fs.mkdtempSync`)
- Command execution if needed

## Troubleshooting

### Tests Not Found

Ensure test files match the pattern: `**/__tests__/**/*.test.ts` or `**/*.test.ts`

### Environment Variables Not Set

Use `beforeEach`/`afterEach` to manage environment state:

```typescript
beforeEach(() => {
  process.env.MY_VAR = 'value';
});
afterEach(() => {
  delete process.env.MY_VAR;
});
```

### Timeout Errors

Increase timeout for slow tests:

```typescript
it('slow test', async () => {
  // test code
}, 10000); // 10 second timeout
```

## Adding Tests to a New App

1. Create vitest.config.ts:

```typescript
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  extends: path.resolve(__dirname, '../../vitest.config.base.ts'),
  test: { dir: 'src' },
});
```

2. Add test script to package.json:

```json
"test": "vitest run",
"test:watch": "vitest"
```

3. Create test directory and files:

```bash
mkdir -p src/__tests__/services
touch src/__tests__/services/example.test.ts
```

4. Run tests:

```bash
pnpm test
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vitest API Reference](https://vitest.dev/api/)
- [Node.js Testing](https://nodejs.org/en/docs/guides/testing/)
