# Vitest Quick Reference

## Running Tests

### All Tests

```bash
pnpm test              # Run once
pnpm test:watch       # Watch mode (re-run on changes)
pnpm test:coverage    # With coverage report
pnpm test:ci          # CI mode (sequential, with coverage)
```

### Specific App Tests

```bash
cd apps/mcp
pnpm test
pnpm test:watch
pnpm test:coverage
```

## Writing Tests

### Basic Test

```typescript
import { describe, it, expect } from 'vitest';

describe('MyFeature', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
```

### With Setup/Teardown

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('MyService', () => {
  let resource: any;

  beforeEach(() => {
    resource = setup();
  });

  afterEach(() => {
    cleanup(resource);
  });

  it('should use resource', () => {
    expect(resource).toBeDefined();
  });
});
```

### Environment Variables

```typescript
beforeEach(() => {
  process.env.MY_VAR = 'value';
});

afterEach(() => {
  delete process.env.MY_VAR;
});

it('should access env var', () => {
  expect(process.env.MY_VAR).toBe('value');
});
```

### File Operations

```typescript
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

let testDir: string;

beforeEach(() => {
  testDir = mkdtempSync(join(tmpdir(), 'test-'));
});

afterEach(() => {
  rmSync(testDir, { recursive: true });
});

it('should create file', () => {
  const file = join(testDir, 'test.txt');
  writeFileSync(file, 'content');
  expect(true).toBe(true);
});
```

## Test Patterns

### File Location

- Location: `src/__tests__/`, `test/`, or `__tests__/`
- Name: `*.test.ts` or `*.spec.ts`
- Example: `src/__tests__/services/my.service.test.ts`

### Structure

```
apps/myapp/
├── src/
│   ├── __tests__/
│   │   ├── services/
│   │   │   └── my.service.test.ts
│   │   ├── utils/
│   │   │   └── helper.test.ts
│   │   └── setup.ts              # Optional test setup
│   ├── services/
│   ├── utils/
│   └── index.ts
├── vitest.config.ts
└── package.json
```

## Common Assertions

```typescript
// Equality
expect(value).toBe(5);
expect(value).toEqual({ a: 1 });
expect(value).toStrictEqual({ a: 1 });

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThan(5);
expect(value).toBeCloseTo(0.3);

// Strings
expect(text).toMatch(/regex/);
expect(text).toContain('substring');

// Arrays/Objects
expect(array).toContain(3);
expect(array).toHaveLength(3);
expect(obj).toHaveProperty('name');

// Errors
expect(() => {
  throwError();
}).toThrow();
expect(() => {
  throwError();
}).toThrow(/error message/);

// Functions
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledWith(arg);
```

## Hooks

```typescript
import { beforeAll, beforeEach, afterEach, afterAll } from 'vitest';

// Run once before all tests
beforeAll(() => {
  // Setup
});

// Run before each test
beforeEach(() => {
  // Reset state
});

// Run after each test
afterEach(() => {
  // Cleanup
});

// Run once after all tests
afterAll(() => {
  // Final cleanup
});
```

## Skipping/Focusing Tests

```typescript
// Skip a test
it.skip('should work', () => {
  // Not run
});

// Run only this test
it.only('should work', () => {
  // Only this runs
});

// Skip a suite
describe.skip('MyFeature', () => {
  // Not run
});

// Run only this suite
describe.only('MyFeature', () => {
  // Only this runs
});
```

## Async Tests

```typescript
it('should handle async', async () => {
  const result = await asyncFunction();
  expect(result).toBe('value');
});

it('should handle promises', () => {
  return promise.then((result) => {
    expect(result).toBe('value');
  });
});

// With timeout
it('should handle slow async', async () => {
  const result = await slowAsync();
  expect(result).toBe('value');
}, 10000); // 10 second timeout
```

## Mocking

```typescript
import { vi } from 'vitest';

// Mock a function
const mock = vi.fn();
mock('hello');
expect(mock).toHaveBeenCalledWith('hello');

// Mock a module
vi.mock('./module', () => ({
  default: { mocked: true },
}));

// Spy on a function
const spy = vi.spyOn(obj, 'method');
obj.method();
expect(spy).toHaveBeenCalled();
spy.mockRestore();
```

## Configuration

### Root Config

File: `vitest.config.base.ts`

- Environment: Node.js
- Include patterns: `**/__tests__/**/*.test.ts`, `**/*.test.ts`

### App Config

File: `apps/myapp/vitest.config.ts`

```typescript
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  extends: path.resolve(__dirname, '../../vitest.config.base.ts'),
  test: {
    dir: 'src', // or '.' for root-level tests
  },
});
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Troubleshooting

### "Tests not found"

- Check file name: `*.test.ts` or `*.spec.ts`
- Check location: `__tests__/`, `test/`, or `tests/` directory
- Check config: `vitest.config.ts` should be in app root

### "Cannot find module"

- Check import paths
- Verify tsconfig.json is correct
- Check TypeScript types are installed

### "Environment variables not set"

- Use beforeEach to set variables
- Use afterEach to clean up
- Don't rely on global state

### "Timeout error"

- Increase timeout: `it('test', async () => {}, 10000)`
- Check for hanging promises
- Verify async cleanup in afterEach

### "Test fails in CI but passes locally"

- Check environment-specific logic
- Use proper cleanup in afterEach
- Avoid test order dependencies
- Check CI environment variables

## Documentation

- Full Guide: [doc/TESTING_GUIDE.md](../doc/TESTING_GUIDE.md)
- Implementation: [doc/VITEST_UNIFIED_IMPLEMENTATION.md](../doc/VITEST_UNIFIED_IMPLEMENTATION.md)
- Official Docs: https://vitest.dev/

## Apps & Status

- ✅ **apps/mcp** - 57 tests passing
- ✅ **apps/auth** - Ready (no tests yet)
- ✅ **apps/llm-adapter** - Ready (no tests yet)
- ⏳ **apps/vaulty** - Ready (no tests yet)
- ✅ **Root** - 15 integration tests passing

Total: 72 tests across monorepo
