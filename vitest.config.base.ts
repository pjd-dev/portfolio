import { defineConfig } from 'vitest/config';

// Ensure VAULT_PATH is set for services that require it
process.env.VAULT_PATH = process.env.VAULT_PATH || '/tmp/test-vault';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      '**/__tests__/**/*.test.ts',
      '**/__tests__/**/*.spec.ts',
      '**/*.test.ts',
      '**/*.spec.ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      // Exclude MCP service tests from root - they need MCP's setup file
      'apps/mcp/src/__tests__/services/**',
    ],
  },
});
