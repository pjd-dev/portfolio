/**
 * Configuration utilities for vault platform
 */

/**
 * Load configuration from environment variables
 */
export function loadConfig() {
  return {
    vaultPath: process.env.VAULT_PATH || process.env.HOME + '/.obsidian/vault',
    mcpSecret: process.env.MCP_SECRET,
    port: parseInt(process.env.PORT || '4000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  };
}

/**
 * Get a configuration value with optional default
 */
export function getConfigValue(
  key: string,
  defaultValue?: string
): string | undefined {
  return process.env[key] || defaultValue;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}
