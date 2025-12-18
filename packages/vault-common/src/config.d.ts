/**
 * Configuration utilities for vault platform
 */
/**
 * Load configuration from environment variables
 */
export declare function loadConfig(): {
  vaultPath: string;
  mcpSecret: string | undefined;
  port: number;
  nodeEnv: string;
};
/**
 * Get a configuration value with optional default
 */
export declare function getConfigValue(
  key: string,
  defaultValue?: string
): string | undefined;
/**
 * Check if running in production
 */
export declare function isProduction(): boolean;
/**
 * Check if running in development
 */
export declare function isDevelopment(): boolean;
/**
 * Check if running in test
 */
export declare function isTest(): boolean;
//# sourceMappingURL=config.d.ts.map
