import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config.base';

// Set VAULT_PATH for any service tests that might need it
process.env.VAULT_PATH = process.env.VAULT_PATH || '/tmp/test-vault';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        // Exclude MCP service tests from root - run them with `pnpm --filter @vault/mcp test`
        'apps/mcp/src/__tests__/services/**',
      ],
    },
  })
);
