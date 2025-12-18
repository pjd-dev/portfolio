# Testing in the monorepo

This repository uses a mix of test runners historically. Current direction:

- `vitest` is hoisted to the repo root and a shared `vitest.config.ts` exists at the repo root.
- `apps/auth` uses `vitest` already.
- `apps/mcp` tests have been migrated (sample) to `vitest` — more files may need conversion.

Running tests locally

Install and bootstrap workspaces:

```bash
pnpm install -w
```

Run all package test scripts (respects each package's configured runner):

```bash
pnpm -w -r test
```

Run Vitest across workspaces (uses hoisted `vitest`):

```bash
pnpm -w -r exec -- vitest run
```

Migration guidance

- If a package currently imports `@jest/globals`, replace imports with `vitest` or remove imports when `globals: true` is enabled in `vitest.config.ts`.
- Adapt any Jest-only mocking APIs; `vitest` supports most APIs but differences exist in some jest-specific modules.
- After migrating tests, you can remove `jest` and `ts-jest` from that package's devDependencies.

If you want, I can continue converting remaining `apps/mcp` tests to Vitest and remove Jest dependencies from that package.

Status: `apps/mcp` Jest migration

- `jest` / `ts-jest` / `@jest/globals` and related devDependencies were removed from `apps/mcp/package.json`.
- The `apps/mcp/jest.config.js` file was replaced with a placeholder noting migration to Vitest.
- Two representative test files were migrated to use `vitest` imports and verified passing.
