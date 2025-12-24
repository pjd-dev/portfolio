import { defineConfig } from 'vitest/config';

// Set VAULT_PATH for any service tests that might need it
process.env.VAULT_PATH = process.env.VAULT_PATH || '/tmp/test-vault';

export default defineConfig({
  test: {
    globals: true,
    include: [
      '__tests__/**/*.test.ts',
      '__tests__/**/*.spec.ts',
      // Also include top-level test files if needed
      '__tests__/*.test.ts',
      '__tests__/*.spec.ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.git/**',
      '**/.next/**',
      '**/.output/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/.cache/**',
      '**/.vscode/**',
    ],
    // Use the new projects config pattern for monorepo
    projects: [
      '.',
      'apps/*',
      'packages/*',
      // Exclude any folders if needed, e.g.:
      // '!packages/excluded'
    ],
    // Global setup for all projects (if needed)
    setupFiles: ['packages/vault-common/test/setup-env.ts'],
  },
});
