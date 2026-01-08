import 'dotenv/config';

export const config = {
  // Server
  port: parseInt(process.env.PORT || '4200', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Vault
  vaultRoot: process.env.VAULT_ROOT || '',

  // Auth
  authEnabled: process.env.AUTH_ENABLED === 'true',
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:4100',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
} as const;

export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.vaultRoot) {
    errors.push('VAULT_ROOT is required');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}
